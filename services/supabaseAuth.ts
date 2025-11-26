import { supabase } from './supabaseClient';

export interface SupabaseUserMetadata {
  country?: string;
  [key: string]: unknown;
}

export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: SupabaseUserMetadata;
}

export interface SupabaseAuthSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  user: SupabaseUser;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload extends SignInPayload {
  country: string;
}

export interface SignUpResult {
  session: SupabaseAuthSession | null;
  user: SupabaseUser | null;
}

interface AuthResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  user?: SupabaseUser;
  session?: AuthResponse;
  user_metadata?: SupabaseUserMetadata;
  error?: string;
  error_description?: string;
  msg?: string;
}

type AuthStateListener = (session: SupabaseAuthSession | null) => void;

const STORAGE_KEY = 'agriconnect.supabase.session';
const getEnv = () => ({
  url: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  key: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
});

const listeners = new Set<AuthStateListener>();
let currentSession: SupabaseAuthSession | null = null;

const buildRedirectTo = () => {
  const configured = import.meta.env.VITE_SITE_URL as string | undefined;
  if (typeof window === 'undefined') return configured;

  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.endsWith('.local');

  // If running locally, always use the current origin (and preserve path) so auth returns to the dev server.
  if (isLocal) {
    const localUrl = new URL(window.location.href);
    localUrl.hash = '';
    return localUrl.toString();
  }

  // Non-local: fall back to configured site URL if provided, else current origin/path.
  if (configured) return configured;

  const url = new URL(window.location.href);
  url.hash = '';
  return url.toString();
};

const fetchUserProfile = async (accessToken: string): Promise<SupabaseUser | null> => {
  const { url } = ensureEnv();
  const response = await fetch(`${url}/auth/v1/user`, {
    method: 'GET',
    headers: buildHeaders({ Authorization: `Bearer ${accessToken}` }),
  });
  if (!response.ok) {
    console.warn('Failed to fetch Supabase user profile');
    return null;
  }
  const data = (await response.json()) as { user: SupabaseUser };
  return data.user ?? null;
};

const hydrateSessionUser = async (
  session: SupabaseAuthSession | null,
): Promise<SupabaseAuthSession | null> => {
  if (!session) return null;
  if (session.user?.email && session.user?.id) {
    return session;
  }
  try {
    const profile = await fetchUserProfile(session.access_token);
    if (profile) {
      const hydrated: SupabaseAuthSession = { ...session, user: profile };
      persistSession(hydrated);
      notify(hydrated);
      return hydrated;
    }
  } catch (error) {
    console.warn('Unable to hydrate Supabase session user', error);
  }
  return session;
};

const captureOAuthSessionFromUrl = () => {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash?.startsWith('#') ? window.location.hash.substring(1) : '';
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  if (!accessToken) return null;
  const payload: AuthResponse = {
    access_token: accessToken,
    refresh_token: params.get('refresh_token') ?? undefined,
    expires_in: params.get('expires_in') ? Number(params.get('expires_in')) : undefined,
    token_type: params.get('token_type') ?? undefined,
    user: undefined,
  };
  const session = parseSession(payload);
  if (session) {
    persistSession(session);
    void syncSupabaseClientSession(session);
    notify(session);
    void hydrateSessionUser(session);
  }
  if (window.history.replaceState) {
    window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
  } else {
    window.location.hash = '';
  }
  return session;
};

const ensureEnv = () => {
  const { url, key } = getEnv();
  if (!url || !key) {
    throw new Error('Supabase credentials are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  return { url, key };
};

const buildHeaders = (overrides?: HeadersInit): HeadersInit => {
  const { key } = ensureEnv();
  return {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...overrides,
  };
};

const persistSession = (session: SupabaseAuthSession | null) => {
  currentSession = session;
  if (typeof window === 'undefined') return;
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

const readStoredSession = (): SupabaseAuthSession | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SupabaseAuthSession;
    return parsed;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const parseSession = (payload?: AuthResponse | null): SupabaseAuthSession | null => {
  if (!payload || !payload.access_token) return null;
  const expiresAt = payload.expires_at ?? Math.floor(Date.now() / 1000) + (payload.expires_in ?? 3600);
  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token ?? '',
    token_type: payload.token_type ?? 'bearer',
    expires_in: payload.expires_in ?? 3600,
    expires_at: expiresAt,
    user: payload.user ?? { id: '', email: undefined, user_metadata: {} },
  };
};

const notify = (session: SupabaseAuthSession | null) => {
  listeners.forEach((listener) => listener(session));
};

const syncSupabaseClientSession = async (session: SupabaseAuthSession | null) => {
  if (!session) return;
  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
};

const sessionIsValid = (session: SupabaseAuthSession | null) => {
  if (!session) return false;
  return session.expires_at * 1000 > Date.now() + 1000; // add small buffer
};

const refreshWithToken = async (refreshToken?: string) => {
  if (!refreshToken) return null;
  const { url } = ensureEnv();
  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) {
    throw new Error('Unable to refresh session');
  }
  const data = (await response.json()) as AuthResponse;
  const session = parseSession(data);
  if (session) {
    persistSession(session);
    await syncSupabaseClientSession(session);
    notify(session);
    return hydrateSessionUser(session);
  }
  return session;
};

const supabaseAuth = {
  async getSession(): Promise<SupabaseAuthSession | null> {
    if (currentSession && sessionIsValid(currentSession)) return currentSession;
    const oauthSession = captureOAuthSessionFromUrl();
    if (oauthSession) {
      currentSession = oauthSession;
      return currentSession;
    }
    const stored = readStoredSession();
    if (stored) {
      currentSession = await this.restoreSession();
    }
    return currentSession;
  },
  async restoreSession() {
    const stored = readStoredSession();
    if (sessionIsValid(stored)) {
      notify(stored);
      await syncSupabaseClientSession(stored);
      return hydrateSessionUser(stored);
    }
    try {
      const refreshed = await refreshWithToken(stored?.refresh_token);
      if (refreshed) {
        return refreshed;
      }
    } catch (error) {
      console.warn('Failed to refresh Supabase session', error);
    }
    persistSession(null);
    notify(null);
    return null;
  },
  async signIn({ email, password }: SignInPayload) {
    const { url } = ensureEnv();
    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = (await response.json()) as AuthResponse;
    if (!response.ok) {
      const message = data.error_description || data.error || data.msg || 'Unable to log in.';
      throw new Error(message);
    }
    const session = parseSession(data);
    if (!session) {
      throw new Error('No session returned from Supabase.');
    }
    persistSession(session);
    await syncSupabaseClientSession(session);
    notify(session);
    return hydrateSessionUser(session);
  },
  async signUp({ email, password, country }: SignUpPayload): Promise<SignUpResult> {
    const { url } = ensureEnv();
    const response = await fetch(`${url}/auth/v1/signup`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ email, password, data: { country } }),
    });
    const data = (await response.json()) as AuthResponse;
    if (!response.ok) {
      const message = data.error_description || data.error || data.msg || 'Unable to register account.';
      throw new Error(message);
    }
    const session = parseSession(data.session ?? data);
    let hydratedSession = session;
    if (session) {
      persistSession(session);
      await syncSupabaseClientSession(session);
      notify(session);
      hydratedSession = await hydrateSessionUser(session);
    }
    return {
      session: hydratedSession,
      user: data.user ?? hydratedSession?.user ?? null,
    };
  },
  signInWithGoogle() {
    const { url } = ensureEnv();
    if (typeof window === 'undefined') {
      throw new Error('Google sign-in requires a browser environment.');
    }
    const redirectTo = buildRedirectTo();
    const authUrl = new URL(`${url}/auth/v1/authorize`);
    authUrl.searchParams.set('provider', 'google');
    if (redirectTo) {
      authUrl.searchParams.set('redirect_to', redirectTo);
    }
    window.location.href = authUrl.toString();
  },
  async signOut() {
    const { url } = ensureEnv();
    const session = await this.getSession();
    if (session) {
      try {
        await fetch(`${url}/auth/v1/logout`, {
          method: 'POST',
          headers: buildHeaders({ Authorization: `Bearer ${session.access_token}` }),
        });
      } catch (error) {
        console.warn('Failed to sign out from Supabase', error);
      }
    }
    persistSession(null);
    await supabase.auth.signOut();
    notify(null);
  },
  onAuthStateChange(callback: AuthStateListener) {
    listeners.add(callback);
    callback(this.getSession());
    return () => listeners.delete(callback);
  },
};

export default supabaseAuth;

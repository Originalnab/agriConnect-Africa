import React, { useState, useEffect, useRef } from 'react';
import { ViewState, Language, UserRole, SUPPORTED_LANGUAGES } from './types';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import CropDoctor from './components/CropDoctor';
import MarketView from './components/MarketView';
import AuthForm from './components/AuthForm';
import UserAccount from './components/UserAccount';
import FarmerHome from './components/FarmerHome';
import BuyerMarketplace from './components/BuyerMarketplace';
import TwoFactorVerification from './components/TwoFactorVerification';
import OnboardingPage from './components/OnboardingPage';
import { supabase } from './services/supabaseClient';
import supabaseAuth from './services/supabaseAuth';
import { Session } from '@supabase/supabase-js';
import { enable2FA } from './services/twoFactorAuth';
import { WifiOff } from 'lucide-react';

// Temporary flag to bypass 2FA while keeping the implementation intact.
const SUSPEND_TWO_FACTOR = true;

const allowedViewsByRole: Record<UserRole, ViewState[]> = {
  farmer: [ViewState.DASHBOARD, ViewState.CHAT, ViewState.DOCTOR, ViewState.MARKET],
  buyer: [ViewState.BUYER_MARKETPLACE, ViewState.CHAT],
  pending: [ViewState.DASHBOARD, ViewState.CHAT, ViewState.DOCTOR, ViewState.MARKET],
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [language, setLanguage] = useState<Language>('en');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>('pending');
  const [isRoleLoading, setIsRoleLoading] = useState<boolean>(!!session);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [roleRefreshToken, setRoleRefreshToken] = useState(0);
  const [hasTwoFactorEnabled, setHasTwoFactorEnabled] = useState<boolean>(false);
  const [isTwoFactorVerified, setIsTwoFactorVerified] = useState<boolean>(false);
  const sessionIdRef = useRef<string | null>(null);
  const isValidatingSessionRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Hydrate any OAuth session (e.g., Google) captured in URL hash, then sync Supabase session.
    const bootstrap = async () => {
      try {
        await supabaseAuth.getSession();
      } catch (error) {
        console.warn('Failed to bootstrap Supabase auth session', error);
      } finally {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setIsAuthReady(true);
      }
    };
    void bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, authSession) => {
      setSession(authSession);
      if (!authSession) {
        setUserRole('pending');
        setIsRoleLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const currentId = session?.user?.id ?? null;
    if (currentId && sessionIdRef.current !== currentId) {
      sessionIdRef.current = currentId;
      setIsTwoFactorVerified(false);
    } else if (!currentId) {
      sessionIdRef.current = null;
      setIsTwoFactorVerified(false);
    }
  }, [session]);

  useEffect(() => {
    if (SUSPEND_TWO_FACTOR && session) {
      setIsTwoFactorVerified(true);
    }
  }, [session]);

  // Defensive check: if a session object exists but Supabase says user is missing, force sign-out.
  useEffect(() => {
    const validateSession = async () => {
      if (!isAuthReady || !session || isValidatingSessionRef.current) return;
      isValidatingSessionRef.current = true;
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          await supabase.auth.signOut();
          await supabaseAuth.signOut().catch(() => {});
          setSession(null);
          setUserRole('pending');
          setIsTwoFactorVerified(false);
        }
      } finally {
        isValidatingSessionRef.current = false;
      }
    };

    void validateSession();
  }, [isAuthReady, session]);

  useEffect(() => {
    let isMounted = true;
    if (!session) {
      setUserRole('pending');
      setIsRoleLoading(false);
      setRoleError(null);
      setHasTwoFactorEnabled(false);
      return () => {
        isMounted = false;
      };
    }

    const fetchUserRole = async () => {
      setIsRoleLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('user_role, two_factor_enabled, user_profiles ( user_id )')
          .eq('id', session.user.id)
          .single();

        if (error) {
          throw error;
        }

        if (isMounted) {
          const rawRole = data?.user_role ?? 'pending';
          const profileRows = Array.isArray((data as any)?.user_profiles)
            ? (data as any).user_profiles
            : [];
          const profile = profileRows.length ? profileRows[0] : null;

          // If a role is explicitly set, honor it and send user to their home.
          if (rawRole === 'farmer' || rawRole === 'buyer') {
            setUserRole(rawRole);
          } else {
            // If role missing but profile exists, infer role once to avoid looping on onboarding.
            const inferredRole: UserRole = profile
              ? (profile as any).farm_name
                ? 'farmer'
                : 'buyer'
              : 'pending';
            setUserRole(profile ? inferredRole : 'pending');
          }
          setHasTwoFactorEnabled(Boolean(data?.two_factor_enabled));
          setRoleError(null);
        }
      } catch (error) {
        if (isMounted) {
          setRoleError(error instanceof Error ? error.message : 'Unable to load account role.');
          setUserRole('pending');
          setHasTwoFactorEnabled(false);
        }
      } finally {
        if (isMounted) {
          setIsRoleLoading(false);
        }
      }
    };

    void fetchUserRole();

    return () => {
      isMounted = false;
    };
  }, [session, roleRefreshToken]);

  useEffect(() => {
    setCurrentView((prev) => {
      const allowedViews = allowedViewsByRole[userRole] ?? allowedViewsByRole.pending;
      if (!allowedViews.length) {
        return ViewState.DASHBOARD;
      }
      if (!allowedViews.includes(prev)) {
        return allowedViews[0];
      }
      return prev;
    });
  }, [userRole]);

  const renderView = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard language={language} setLanguage={setLanguage} isOnline={isOnline} />;
      case ViewState.CHAT:
        return <ChatInterface language={language} isOnline={isOnline} />;
      case ViewState.DOCTOR:
        return <CropDoctor language={language} isOnline={isOnline} />;
      case ViewState.MARKET:
        return <MarketView language={language} isOnline={isOnline} />;
      case ViewState.FARMER_HOME:
        return <FarmerHome />;
      case ViewState.BUYER_MARKETPLACE:
        return <BuyerMarketplace language={language} isOnline={isOnline} />;
      default:
        return <Dashboard language={language} setLanguage={setLanguage} isOnline={isOnline} />;
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-sm text-stone-500 animate-pulse">Loading your account...</p>
      </div>
    );
  }

  if (!session) {
    return <AuthForm />;
  }

  if (session && !isTwoFactorVerified && !SUSPEND_TWO_FACTOR) {
    const handleVerified = async () => {
      if (session?.user?.id && !hasTwoFactorEnabled) {
        try {
          await enable2FA(session.user.id);
          setHasTwoFactorEnabled(true);
        } catch (error) {
          console.warn('Failed to update 2FA flag', error);
        }
      }
      setIsTwoFactorVerified(true);
      setRoleRefreshToken((prev) => prev + 1);
    };

    const handleCancel = async () => {
      await supabase.auth.signOut();
    };

    return (
      <TwoFactorVerification
        email={session.user?.email || ''}
        onVerified={handleVerified}
        onCancel={handleCancel}
      />
    );
  }

  if (session && isRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-sm text-stone-500 animate-pulse">Preparing your personalized workspace...</p>
      </div>
    );
  }

  if (session && userRole === 'pending') {
    return <OnboardingPage onComplete={() => setRoleRefreshToken((prev) => prev + 1)} />;
  }

  return (
    <div className="max-w-md mx-auto bg-stone-50 min-h-screen relative shadow-2xl shadow-stone-300 font-sans flex flex-col">
      {/* Header with Offline Indicator */}
      {!isOnline && (
        <div className="bg-stone-800 text-white text-xs py-1 px-4 text-center flex items-center justify-center sticky top-0 z-50">
          <WifiOff size={12} className="mr-2" />
          <span>Offline Mode - Using cached data</span>
        </div>
      )}

      {roleError && (
        <div className="bg-amber-100 text-amber-800 text-xs py-2 px-4 text-center flex items-center justify-center">
          <span className="mr-2">{roleError}</span>
          <button
            type="button"
            onClick={() => setRoleRefreshToken((prev) => prev + 1)}
            className="underline font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top Bar with Language and User Account */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <label className="font-semibold">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="border border-stone-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            {SUPPORTED_LANGUAGES.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <UserAccount />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {renderView()}
      </main>

      {/* Navigation */}
      <Navigation currentView={currentView} setView={setCurrentView} language={language} userRole={userRole} />
    </div>
  );
};

export default App;

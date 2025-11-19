import React, { useState } from 'react';
import supabaseAuth from '../services/supabaseAuth';

type AuthMode = 'login' | 'register';

const COUNTRY_OPTIONS = [
  'Ghana',
  'Nigeria',
  'Kenya',
  'Uganda',
  'Tanzania',
  'Rwanda',
  'South Africa',
  'Ethiopia',
  'Côte d\'Ivoire',
  'Senegal',
  'Benin',
  'Togo',
  'Sierra Leone',
  'Liberia',
  'Zambia',
  'Zimbabwe',
];

const AuthForm: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState(COUNTRY_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await supabaseAuth.signIn({ email, password });
        setMessage('Welcome back! Redirecting you to your account.');
      } else {
        const result = await supabaseAuth.signUp({ email, password, country });
        if (result.session) {
          setMessage('Account created successfully!');
        } else {
          setMessage('Account created. Please confirm the link sent to your email to start using the app.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setError(null);
    setMessage('Redirecting to Google…');
    try {
      supabaseAuth.signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start Google sign in.');
      setMessage(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-emerald-100 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-emerald-100 border border-emerald-50 p-8 space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-600 font-semibold">AgriConnect Africa</p>
          <h1 className="text-2xl font-bold text-stone-800">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-stone-500">
            {mode === 'login'
              ? 'Sign in to access your personalised farming assistant.'
              : 'Register to unlock data-driven farming guidance.'}
          </p>
        </div>

        <div className="flex items-center justify-center space-x-4 text-sm">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`px-4 py-2 rounded-full border ${
              mode === 'login'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'border-stone-200 text-stone-500'
            } transition-colors`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`px-4 py-2 rounded-full border ${
              mode === 'register'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'border-stone-200 text-stone-500'
            } transition-colors`}
          >
            Register
          </button>
        </div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          className="w-full border border-stone-200 rounded-xl py-3 text-sm font-semibold text-stone-700 flex items-center justify-center space-x-2 hover:border-emerald-200 transition"
        >
          <span role="img" aria-hidden="true">
            🌍
          </span>
          <span>{mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}</span>
        </button>

        <div className="flex items-center space-x-3">
          <span className="h-px flex-1 bg-stone-200" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400">or</span>
          <span className="h-px flex-1 bg-stone-200" />
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs text-stone-500 font-semibold" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-stone-500 font-semibold" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={6}
            />
          </div>

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs text-stone-500 font-semibold" htmlFor="country">
                Country
              </label>
              <select
                id="country"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {COUNTRY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>}
          {message && !error && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-200 disabled:opacity-60"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <p className="text-[11px] text-center text-stone-400">
          By continuing you agree to receive essential account updates from AgriConnect Africa.
        </p>
      </div>
    </div>
  );
};

export default AuthForm;

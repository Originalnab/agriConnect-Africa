import React, { useState } from 'react';
import supabaseAuth from '../services/supabaseAuth';
import { Mail, Sprout, BarChart3, Users } from 'lucide-react';
import logo from './Assests/AgriConnnect.png';

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
        setMessage('Security check in progress. Check your email for the verification code to continue.');
      } else {
        const result = await supabaseAuth.signUp({ email, password, country });
        if (result.session) {
          setMessage('Account created! Check your email for the 6-digit verification code.');
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
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Infographics */}
        <div className="hidden lg:flex flex-col space-y-8">
          {/* Feature 1 */}
          <div className="flex gap-4 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-100">
                <Sprout className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-stone-800">Farm Management</h3>
              <p className="text-sm text-stone-600">Track crops, monitor weather, and get AI-powered insights</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex gap-4 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-blue-100">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-stone-800">Market Insights</h3>
              <p className="text-sm text-stone-600">Real-time pricing, trends, and direct buyer connections</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex gap-4 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-amber-100">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-stone-800">Connect & Grow</h3>
              <p className="text-sm text-stone-600">Build relationships with farmers, buyers, and experts</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="text-center p-4 bg-white rounded-xl shadow">
              <div className="text-2xl font-bold text-emerald-600">10K+</div>
              <div className="text-xs text-stone-600">Active Farmers</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl shadow">
              <div className="text-2xl font-bold text-blue-600">5K+</div>
              <div className="text-xs text-stone-600">Buyers</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl shadow">
              <div className="text-2xl font-bold text-amber-600">20+</div>
              <div className="text-xs text-stone-600">Countries</div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-emerald-100 border border-emerald-50 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex flex-col items-center space-y-1">
              <img src={logo} alt="AgriConnect Africa logo" className="h-16 w-auto" />
              <span className="text-[11px] text-stone-400">Powered by KasapaAi Digitals</span>
            </div>
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
              className={`px-4 py-2 rounded-full border ${mode === 'login'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'border-stone-200 text-stone-500'
                } transition-colors`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`px-4 py-2 rounded-full border ${mode === 'register'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'border-stone-200 text-stone-500'
                } transition-colors`}
            >
              Register
            </button>
          </div>

          {/* Google One Tap Sign In */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full border border-stone-200 rounded-xl py-3 text-sm font-semibold text-stone-700 flex items-center justify-center space-x-2 hover:border-emerald-200 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>{mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}</span>
          </button>

          <div className="flex items-center space-x-3">
            <span className="h-px flex-1 bg-stone-200" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400">or</span>
            <span className="h-px flex-1 bg-stone-200" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-xs text-stone-500 font-semibold flex items-center space-x-1" htmlFor="email">
                <Mail size={14} />
                <span>Email address</span>
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

            {/* 2FA Info Badge */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
              <span className="text-xl">🔐</span>
              <p className="text-xs text-emerald-700">
                <span className="font-semibold">2FA Enabled:</span> A verification code will be sent to your email.
              </p>
            </div>

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
    </div>
  );
};

export default AuthForm;

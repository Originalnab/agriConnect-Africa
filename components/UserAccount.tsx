import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Settings, User, ChevronDown } from 'lucide-react';
import supabaseAuth, { SupabaseAuthSession } from '../services/supabaseAuth';
import { supabase } from '../services/supabaseClient';

const UserAccount: React.FC = () => {
  const [session, setSession] = useState<SupabaseAuthSession | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeSession = async () => {
      const session = await supabaseAuth.getSession();
      setSession(session);
    };

    initializeSession();

    const unsubscribe = supabaseAuth.onAuthStateChange((newSession) => {
      setSession(newSession);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabaseAuth.signOut();
    } catch (error) {
      console.warn('Failed to sign out via supabaseAuth', error);
    }
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Failed to sign out via supabase client', error);
    }
    try {
      Object.keys(window.localStorage)
        .filter((key) => key.startsWith('sb-'))
        .forEach((key) => window.localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear cached Supabase sessions', error);
    }
    setSession(null);
    setIsOpen(false);
    setSigningOut(false);
    window.location.replace('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session) {
    return null; // Don't show if not logged in
  }

  const displayName =
    session.user?.user_metadata?.username ||
    session.user?.email?.split('@')[0] ||
    'User';
  const country = session.user?.user_metadata?.country;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Button in Top Right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-emerald-50 transition border border-emerald-200"
        title={session.user?.email}
      >
        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
          <span className="text-white text-sm font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="text-sm font-semibold text-stone-700 hidden sm:inline truncate max-w-[150px]">
          {displayName}
        </span>
        <ChevronDown
          size={16}
          className={`text-stone-500 transition transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 z-50 overflow-hidden">
          {/* User Info Header */}
          <div className="px-4 py-4 bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-base font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-stone-800 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-stone-500 truncate">
                  {session.user?.email}
                </p>
                {country && (
                  <p className="text-xs text-stone-500">📍 {country}</p>
                )}
              </div>
            </div>
          </div>

          {/* Menu Options */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to profile page
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-stone-700 hover:bg-emerald-50 transition"
            >
              <User size={16} className="text-emerald-600" />
              <span>View Profile</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to settings page
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-stone-700 hover:bg-emerald-50 transition"
            >
              <Settings size={16} className="text-emerald-600" />
              <span>Settings</span>
            </button>
          </div>

          {/* Sign Out */}
          <div className="border-t border-stone-100 py-2">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-60"
            >
              <LogOut size={16} />
              <span>{signingOut ? 'Signing out…' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAccount;

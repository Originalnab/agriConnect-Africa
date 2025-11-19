import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import supabaseAuth, { SupabaseAuthSession } from '../services/supabaseAuth';

interface UserAccountProps {
  session: SupabaseAuthSession;
}

const UserAccount: React.FC<UserAccountProps> = ({ session }) => {
  const [signingOut, setSigningOut] = useState(false);
  const country = session.user?.user_metadata?.country;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabaseAuth.signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="mx-4 mt-4 mb-2 bg-white/90 backdrop-blur-sm border border-stone-200 rounded-2xl p-4 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-wider text-stone-400">Signed in as</p>
        <p className="text-base font-semibold text-stone-800">{session.user.email}</p>
        {country && (
          <p className="text-sm text-stone-500 mt-1">
            Country: <span className="font-semibold text-stone-700">{country}</span>
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="flex items-center gap-2 text-sm text-emerald-700 font-semibold hover:text-emerald-900"
      >
        <LogOut size={16} />
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );
};

export default UserAccount;

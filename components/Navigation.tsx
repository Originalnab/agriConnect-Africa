import React, { useState } from 'react';
import { Home, MessageCircle, Camera, TrendingUp, ShoppingBag } from 'lucide-react';
import { ViewState, Language, UserRole } from '../types';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  language: Language;
  userRole: UserRole;
}

const labels: Record<Language, { home: string; chat: string; doc: string; mkt: string }> = {
  en: { home: 'Home', chat: 'Assistant', doc: 'Doctor', mkt: 'Market' },
  tw: { home: 'Fie', chat: 'Bisa', doc: 'Dokota', mkt: 'Egua' },
  ee: { home: 'Afeme', chat: 'Kpekpenyu', doc: 'Dokita', mkt: 'Asime' },
  ga: { home: 'Shia', chat: 'Wiemo', doc: 'Dokita', mkt: 'Jra' },
};

const Navigation: React.FC<NavigationProps> = ({ currentView, setView, language, userRole }) => {
  const [isOpen, setIsOpen] = useState(true);
  const t = labels[language] ?? labels.en;

  const defaultNav = [
    { id: ViewState.DASHBOARD, label: t.home, icon: Home },
    { id: ViewState.CHAT, label: t.chat, icon: MessageCircle },
    { id: ViewState.DOCTOR, label: t.doc, icon: Camera },
    { id: ViewState.MARKET, label: t.mkt, icon: TrendingUp },
  ];

  const farmerNav = [
    { id: ViewState.DASHBOARD, label: t.home, icon: Home },
    { id: ViewState.CHAT, label: t.chat, icon: MessageCircle },
    { id: ViewState.DOCTOR, label: t.doc, icon: Camera },
    { id: ViewState.MARKET, label: t.mkt, icon: TrendingUp },
  ];

  const buyerNav = [
    { id: ViewState.BUYER_MARKETPLACE, label: t.mkt, icon: ShoppingBag },
    { id: ViewState.CHAT, label: t.chat, icon: MessageCircle },
  ];

  const navItems =
    userRole === 'farmer' ? farmerNav : userRole === 'buyer' ? buyerNav : defaultNav;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none">
      <div className="flex justify-center mb-1 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="px-3 py-1 rounded-full bg-white shadow border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          {isOpen ? 'Hide Menu' : 'Show Menu'}
        </button>
      </div>
      {isOpen && (
        <div className="bg-white border-t border-gray-200 pb-safe safe-area-inset-bottom shadow-lg mx-auto w-full max-w-md rounded-t-2xl pointer-events-auto">
          <div className="flex justify-around items-center h-16">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                  currentView === item.id ? 'text-green-600' : 'text-gray-400 hover:text-green-500'
                }`}
              >
                <item.icon size={24} strokeWidth={currentView === item.id ? 2.5 : 2} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navigation;

import React from 'react';
import { Home, MessageCircle, Camera, TrendingUp } from 'lucide-react';
import { ViewState, Language } from '../types';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  language: Language;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView, language }) => {
  
  const labels = {
    en: { home: 'Home', chat: 'Assistant', doc: 'Doctor', mkt: 'Market' },
    tw: { home: 'Fie', chat: 'Bisa', doc: 'Dɔkota', mkt: 'Egua' },
    ee: { home: 'Aƒeme', chat: 'Kpekpeɖeŋu', doc: 'Dɔkita', mkt: 'Asime' },
    ga: { home: 'Shia', chat: 'Wiemɔ', doc: 'Dɔkita', mkt: 'Jra' }
  };

  const t = labels[language];

  const navItems = [
    { id: ViewState.DASHBOARD, label: t.home, icon: Home },
    { id: ViewState.CHAT, label: t.chat, icon: MessageCircle },
    { id: ViewState.DOCTOR, label: t.doc, icon: Camera },
    { id: ViewState.MARKET, label: t.mkt, icon: TrendingUp },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe safe-area-inset-bottom z-50 shadow-lg">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
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
  );
};

export default Navigation;

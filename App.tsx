import React, { useState, useEffect } from 'react';
import { ViewState, Language } from './types';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import CropDoctor from './components/CropDoctor';
import MarketView from './components/MarketView';
import { WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [language, setLanguage] = useState<Language>('en');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

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
      default:
        return <Dashboard language={language} setLanguage={setLanguage} isOnline={isOnline} />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-stone-50 min-h-screen relative shadow-2xl shadow-stone-300 font-sans">
      {!isOnline && (
        <div className="bg-stone-800 text-white text-xs py-1 px-4 text-center flex items-center justify-center sticky top-0 z-50">
          <WifiOff size={12} className="mr-2" />
          <span>Offline Mode - Using cached data</span>
        </div>
      )}
      <main className="h-full">
        {renderView()}
      </main>
      <Navigation currentView={currentView} setView={setCurrentView} language={language} />
    </div>
  );
};

export default App;
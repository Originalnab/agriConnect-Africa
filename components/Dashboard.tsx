
import React, { useEffect, useState } from 'react';
import { CloudSun, MapPin, Newspaper, Loader2, ArrowRight, Globe, Wind, Droplets, Thermometer, Edit2, Check, Calendar, Sprout, Database, Bug, AlertTriangle, ShieldCheck, MessageSquarePlus, X, Send } from 'lucide-react';
import { getLiveAgriUpdates, getWeatherForecast, getPlantingRecommendations, getPestRiskForecast } from '../services/geminiService';
import { Language, SUPPORTED_LANGUAGES, WeatherData, NewsResponse, PestForecast } from '../types';

interface DashboardProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  isOnline: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ language, setLanguage, isOnline }) => {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  const proxyUrl =
    env.VITE_GEMINI_PROXY_URL ??
    (env.VITE_SUPABASE_URL ? `${env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy` : undefined);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<NewsResponse | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [pestData, setPestData] = useState<PestForecast | null>(null);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showFullInsights, setShowFullInsights] = useState(false);
  
  // Location State
  const [location, setLocation] = useState("Accra, Ghana");
  const [isEditingLoc, setIsEditingLoc] = useState(false);
  const [tempLocation, setTempLocation] = useState("");

  // Planting Calendar State
  const [plantingRegion, setPlantingRegion] = useState('Southern/Coastal');
  const [plantingCrop, setPlantingCrop] = useState('Maize');
  const [plantingAdvice, setPlantingAdvice] = useState<{ text: string, fromCache?: boolean } | null>(null);
  const [loadingPlanting, setLoadingPlanting] = useState(false);

  // Feedback State
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Fetch Data based on current location and language
  const fetchData = async (loc: string) => {
    setLoading(true);
    if (!proxyUrl) {
      console.warn('Gemini proxy URL missing. Set VITE_GEMINI_PROXY_URL (or VITE_SUPABASE_URL) to enable AI insights.');
      setUpdates({
        text: 'AI insights are unavailable because the Gemini proxy URL is missing. Set VITE_GEMINI_PROXY_URL (or VITE_SUPABASE_URL) in your environment and redeploy.',
        links: [],
        fromCache: false,
      });
      setWeather(null);
      setPestData(null);
      setLoading(false);
      return;
    }
    try {
      // Fetch weather first to feed into pest forecast
      const weatherData = await getWeatherForecast(loc, language);
      setWeather(weatherData);

      // Parallel fetch for rest
      const [updatesData, pestRes] = await Promise.all([
        getLiveAgriUpdates(loc, language),
        getPestRiskForecast(weatherData.condition, loc, language)
      ]);
      
      setUpdates(updatesData);
      setPestData(pestRes);
    } catch (e) {
      console.error("Error fetching dashboard data:", e);
      if (!navigator.onLine) {
        setUpdates({
          text: 'Live insights are unavailable while offline. Reconnect to refresh AI content.',
          links: [],
          fromCache: true,
        });
      } else {
        setUpdates({
          text: 'Live insights are temporarily unavailable. Please check your connection or API credentials and try again.',
          links: [],
          fromCache: false,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(location);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]); // Refresh if language changes

  // Initial Geolocation
  useEffect(() => {
    if (isOnline && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const coords = `${latitude},${longitude}`;
          setLocation(coords); 
          fetchData(coords);
        },
        (error) => {
          console.log("Geolocation blocked or failed, using default:", error);
          fetchData("Accra, Ghana"); // Fallback
        }
      );
    } else {
      fetchData("Accra, Ghana");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const handleLocationSave = () => {
    if (!isOnline) return; 
    if (tempLocation.trim()) {
      setLocation(tempLocation);
      setIsEditingLoc(false);
      fetchData(tempLocation);
    }
  };

  const handleCheckPlanting = async () => {
    if (!isOnline) return;
    setLoadingPlanting(true);
    setPlantingAdvice(null);
    try {
      const advice = await getPlantingRecommendations(plantingRegion, plantingCrop, language);
      setPlantingAdvice(advice);
    } catch (e) {
      console.error(e);
      setPlantingAdvice({ text: "Failed to fetch data." });
    } finally {
      setLoadingPlanting(false);
    }
  };

  const handleFeedbackSubmit = () => {
    // Simulate submission
    setTimeout(() => {
      setFeedbackSubmitted(true);
      setFeedbackText('');
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackSubmitted(false);
      }, 2000);
    }, 500);
  };

  const toggleLangMenu = () => setShowLangMenu(!showLangMenu);

  const translations = {
    en: { 
      welcome: 'Akwaaba!', subtitle: 'Your farm at a glance', today: 'Current Weather', updates: 'Check updates below', insights: 'Live Insights & Alerts', enterLoc: 'Enter location',
      plantingTitle: 'Planting Calendar', checkBtn: 'Check Season', region: 'Region', crop: 'Crop',
      pestTitle: 'Pest & Disease Forecast', risk: 'Risk Level', feedback: 'Feedback',
      submit: 'Submit', feedbackPlace: 'Tell us how to improve...', sent: 'Thank you!', offline: 'Offline'
    },
    tw: { 
      welcome: 'Akwaaba!', subtitle: 'Wo afuo ho nsɛm', today: 'Wiem Tebea', updates: 'Hwɛ nsɛm a ɛwɔ aseɛ no', insights: 'Afuo ho Nsɛm', enterLoc: 'Kyerɛ wo kuro',
      plantingTitle: 'Dua Bere', checkBtn: 'Hwɛ Bere', region: 'Mantam', crop: 'Aduane',
      pestTitle: 'Mmoawa & Yareɛ', risk: 'Asiane', feedback: 'Adwene',
      submit: 'Mina', feedbackPlace: 'Kyerɛ yɛn w\'adwene...', sent: 'Medaase!', offline: 'Intanɛt Nni Hɔ'
    },
    ee: { 
      welcome: 'Woezor!', subtitle: 'Wò agble ŋuti nyawo', today: 'Yame ƒe nɔnɔme', updates: 'Kpɔ nuxlɔ̃amenyawo le te', insights: 'Nyanyuiwo tso agble ŋu', enterLoc: 'Ŋlɔ wò du ŋkɔ',
      plantingTitle: 'Do Ɣeyiɣi', checkBtn: 'Kpɔ Ɣeyiɣi', region: 'Nuto', crop: 'Nuku',
      pestTitle: 'Agble Nuwo & Dɔlele', risk: 'Afɔku', feedback: 'Nusɔsrɔ̃',
      submit: 'Ɖo ɖa', feedbackPlace: 'Gblɔ wò susuwo...', sent: 'Akpe!', offline: 'Intanɛt Melĩ O'
    },
    ga: { 
      welcome: 'Atuu!', subtitle: 'O ŋmɔ lɛ he sɛɛnamɔ', today: 'Kɔɔyɔɔ ŋmɛnɛ', updates: 'Kwɛmɔ shishigbɛ', insights: 'Sane kɛ ŋaawoo', enterLoc: 'Ŋma o maŋ gbɛi',
      plantingTitle: 'Dumɔ Be', checkBtn: 'Kwɛmɔ Be', region: 'Kpokpaa', crop: 'Niyenii',
      pestTitle: 'Gbiŋwolɔi & Helai', risk: 'Oshara', feedback: 'Jwɛŋmɔ',
      submit: 'Kɛyaha', feedbackPlace: 'Wiemɔ he ko...', sent: 'Oyiwala dɔŋŋ!', offline: 'Intanɛt Bɛ'
    },
  };

  const t = translations[language];

  const getRiskColor = (level: string) => {
    if (level === 'High') return 'bg-red-100 text-red-700 border-red-200';
    if (level === 'Medium') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  return (
    <div className="p-4 pb-24 space-y-6 bg-stone-50 min-h-screen relative">
      {/* Header */}
      <header className="flex justify-between items-center pt-2 relative z-20">
        <div>
          <h1 className="text-2xl font-bold text-green-900">{t.welcome}</h1>
          <p className="text-stone-500 text-sm">{t.subtitle}</p>
        </div>
        
        <div className="flex items-center space-x-2">
           <button 
             onClick={() => setShowFeedback(true)}
             className="bg-white p-2 rounded-full shadow-sm border border-gray-200 text-gray-600 hover:bg-green-50 hover:text-green-600 transition-colors"
             title="Send Feedback"
           >
             <MessageSquarePlus size={20} />
           </button>

          <div className="relative">
            <button 
              onClick={toggleLangMenu}
              className="flex items-center space-x-1 bg-white px-3 py-2 rounded-full shadow-sm border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Globe size={16} className="text-green-600" />
              <span>{SUPPORTED_LANGUAGES.find(l => l.id === language)?.label}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-30">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => {
                      setLanguage(lang.id);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-green-50 transition-colors ${
                      language === lang.id ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-green-900">{t.feedback}</h3>
              <button onClick={() => setShowFeedback(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            {feedbackSubmitted ? (
              <div className="py-8 text-center flex flex-col items-center animate-in zoom-in">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3">
                  <Check size={24} />
                </div>
                <p className="font-medium text-gray-800">{t.sent}</p>
              </div>
            ) : (
              <>
                <textarea
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[120px] mb-4 resize-none"
                  placeholder={t.feedbackPlace}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                ></textarea>
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={!feedbackText.trim()}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-green-700 disabled:opacity-50 disabled:bg-gray-300 transition-all flex justify-center items-center"
                >
                  <Send size={16} className="mr-2" /> {t.submit}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Weather Card */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-3xl p-6 text-white shadow-lg shadow-green-200 z-10 relative overflow-hidden">
        {weather?.fromCache && (
           <div className="absolute top-4 right-4 bg-black/20 px-2 py-0.5 rounded-full flex items-center space-x-1 backdrop-blur-md">
             <Database size={10} className="text-white/80" />
             <span className="text-[10px] font-medium text-white/80">Cached</span>
           </div>
        )}
        
        {/* Location Bar */}
        <div className="flex items-center space-x-2 opacity-90 mb-6 bg-white/10 inline-flex px-3 py-1 rounded-full backdrop-blur-sm">
          <MapPin size={14} />
          {isEditingLoc && isOnline ? (
            <div className="flex items-center">
              <input 
                type="text" 
                autoFocus
                value={tempLocation}
                onChange={(e) => setTempLocation(e.target.value)}
                placeholder={t.enterLoc}
                className="bg-transparent border-b border-white/50 text-sm focus:outline-none w-32 text-white placeholder-white/50"
                onKeyDown={(e) => e.key === 'Enter' && handleLocationSave()}
              />
              <button onClick={handleLocationSave} className="ml-2 text-green-200 hover:text-white">
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div 
              className={`flex items-center ${isOnline ? 'cursor-pointer' : 'cursor-default'}`} 
              onClick={() => {
                if(isOnline) {
                  setTempLocation(weather?.locationName || location);
                  setIsEditingLoc(true);
                }
              }}
            >
              <span className="text-sm font-medium mr-2">{weather?.locationName || location}</span>
              {isOnline && <Edit2 size={12} className="opacity-70" />}
            </div>
          )}
        </div>

        {loading && !weather ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="animate-spin w-8 h-8 opacity-50" />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-5xl font-bold mb-1 tracking-tighter">{weather?.temp || '--'}</h2>
                <p className="text-lg opacity-90 font-medium">{weather?.condition || 'Clear'}</p>
              </div>
              <CloudSun size={64} className="text-yellow-300 opacity-90 drop-shadow-lg" />
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-white/20 pt-4">
              <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 backdrop-blur-sm">
                <Droplets size={18} className="mb-1 text-blue-200" />
                <span className="text-xs opacity-70">Rain</span>
                <span className="font-bold text-sm">{weather?.precipitation || '--'}</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 backdrop-blur-sm">
                <Wind size={18} className="mb-1 text-gray-200" />
                <span className="text-xs opacity-70">Wind</span>
                <span className="font-bold text-sm">{weather?.wind || '--'}</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 backdrop-blur-sm">
                <Thermometer size={18} className="mb-1 text-red-200" />
                <span className="text-xs opacity-70">Temp</span>
                <span className="font-bold text-sm">{weather?.temp || '--'}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* AI Pest Forecast Card */}
      {pestData && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2 text-gray-800">
              <Bug size={20} className="text-red-500" />
              <h3 className="font-bold">{t.pestTitle}</h3>
            </div>
            <div className={`px-2 py-1 rounded-md text-xs font-bold border ${getRiskColor(pestData.riskLevel)}`}>
              {t.risk}: {pestData.riskLevel}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3 bg-gray-50 p-3 rounded-lg">
              <AlertTriangle size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700 leading-tight">{pestData.alert}</p>
            </div>
            <div className="flex items-start space-x-3 bg-green-50 p-3 rounded-lg">
              <ShieldCheck size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700 leading-tight">{pestData.preventiveAction}</p>
            </div>
          </div>
        </div>
      )}

      {/* Live AI Updates */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-green-800 justify-between">
          <div className="flex items-center space-x-2">
            <Newspaper size={20} />
            <h3 className="font-bold">{t.insights}</h3>
          </div>
          {updates?.fromCache && (
             <div className="flex items-center space-x-1 bg-stone-200 px-2 py-1 rounded-full">
               <Database size={10} className="text-stone-500" />
               <span className="text-[10px] text-stone-600 font-medium">Cached</span>
             </div>
          )}
        </div>

        {loading && !updates ? (
          <div className="bg-white rounded-xl p-8 flex flex-col items-center justify-center shadow-sm">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-2" />
            <p className="text-sm text-gray-500">Analyzing farm data...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="prose prose-green prose-sm max-w-none">
              {updates?.text ? (
                (() => {
                  const paragraphs = updates.text
                    .split('\n')
                    .map((p) => p.trim().replace(/\*/g, ''))
                    .filter(Boolean);
                  const visibleParagraphs = showFullInsights ? paragraphs : paragraphs.slice(0, 2);

                  return (
                    <>
                      {visibleParagraphs.map((paragraph, idx) => (
                        <p key={idx} className="text-gray-700 mb-2 leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                      {paragraphs.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setShowFullInsights((prev) => !prev)}
                          className="text-sm font-semibold text-green-600 hover:text-green-700 mt-2"
                        >
                          {showFullInsights ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </>
                  );
                })()
              ) : (
                <p className="text-gray-500 italic">Content unavailable offline.</p>
              )}
            </div>

            {updates?.links && updates.links.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Sources</h4>
                <ul className="space-y-2">
                  {updates.links.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-600 flex items-center hover:underline"
                      >
                        <span className="truncate flex-1">{link.title}</span>
                        <ArrowRight size={10} className="ml-1 flex-shrink-0" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Planting Calendar */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-green-100">
        <div className="flex items-center space-x-2 mb-4 text-green-800">
          <Calendar size={20} />
          <h3 className="font-bold">{t.plantingTitle}</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t.region}</label>
            <select 
              className="w-full bg-stone-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={plantingRegion}
              onChange={(e) => setPlantingRegion(e.target.value)}
            >
              <option value="Southern/Coastal">Southern/Coastal</option>
              <option value="Middle Belt">Middle Belt</option>
              <option value="Northern">Northern</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t.crop}</label>
            <select 
              className="w-full bg-stone-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={plantingCrop}
              onChange={(e) => setPlantingCrop(e.target.value)}
            >
              <option value="Maize">Maize</option>
              <option value="Cassava">Cassava</option>
              <option value="Yam">Yam</option>
              <option value="Rice">Rice</option>
              <option value="Cocoa">Cocoa</option>
              <option value="Tomato">Tomato</option>
              <option value="Plantain">Plantain</option>
              <option value="Pepper">Pepper</option>
              <option value="Groundnut">Groundnut</option>
              <option value="Millet">Millet</option>
              <option value="Sorghum">Sorghum</option>
              <option value="Cowpea">Cowpea</option>
              <option value="Soybean">Soybean</option>
              <option value="Bambara Beans">Bambara Beans</option>
              <option value="Cocoyam">Cocoyam</option>
              <option value="Sweet Potato">Sweet Potato</option>
              <option value="Okra">Okra</option>
              <option value="Garden Eggs">Garden Eggs</option>
              <option value="Cashew">Cashew</option>
              <option value="Shea Nut">Shea Nut</option>
              <option value="Mango">Mango</option>
            </select>
          </div>
        </div>

        <button 
          onClick={handleCheckPlanting}
          disabled={loadingPlanting || !isOnline}
          className={`w-full py-2 rounded-lg font-medium text-sm flex justify-center items-center transition-colors ${
            isOnline 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title={!isOnline ? t.offline : ''}
        >
          {loadingPlanting ? <Loader2 className="animate-spin w-4 h-4" /> : isOnline ? t.checkBtn : t.offline}
        </button>

        {plantingAdvice && (
          <div className="mt-4 p-3 bg-green-50 text-green-800 text-sm rounded-lg border border-green-100 flex flex-col items-start">
            <div className="flex items-start">
              <Sprout className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <p>{plantingAdvice.text}</p>
            </div>
            {plantingAdvice.fromCache && (
              <span className="text-[10px] text-stone-500 mt-1 ml-6 flex items-center">
                 <Database size={10} className="mr-1" /> Cached result
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;


import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, WifiOff, Mic, MicOff, Image as ImageIcon, Volume2, Search, X } from 'lucide-react';
import { ChatMessage, Language } from '../types';
import { sendChatMessage, generateFarmingVisual } from '../services/geminiService';

interface ChatInterfaceProps {
  language: Language;
  isOnline: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ language, isOnline }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load voices on mount
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    
    // Chrome loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('chat_history');
    if (saved) {
      try {
        const parsed: ChatMessage[] = JSON.parse(saved).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp) // Rehydrate date object
        }));
        setMessages(parsed);
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    }

    // Cleanup speech recognition on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Save history to localStorage on change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  // Initialize welcome message if empty history
  useEffect(() => {
    const getWelcomeMessage = (lang: Language) => {
      switch (lang) {
        case 'tw': return 'Maakye! Me din de AgriGuide. Mɛtumi aboa wo wɔ wo afuo ho? Bisa me asɛm biara.';
        case 'ee': return 'Woezor! AgriGuide enye ŋkɔnye. Aleke mateŋ akpe ɖe ŋuwò le wò agble ŋu? Biam naneke.';
        case 'ga': return 'Awula! AgriGuide ji mi. Te mafee tɛŋŋ maye mabua bo yɛ o ŋmɔ lɛ he? Bi mi nɔ fɛɛ nɔ.';
        default: return 'Hello! I am AgriGuide. How can I help you with your farm today? Ask me about crops, pests, or weather patterns in Ghana.';
      }
    };

    setMessages(prev => {
      if (prev.length === 0) {
        return [{
          id: 'welcome',
          role: 'model',
          text: getWelcomeMessage(language),
          timestamp: new Date()
        }];
      }
      return prev;
    });
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!searchTerm) {
      scrollToBottom();
    }
  }, [messages, searchTerm]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!isOnline) {
      alert("Voice input requires an internet connection.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Google Chrome or a supported mobile browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = false;

    // Attempt to map to closest supported locale
    let langCode = 'en-GH';
    switch (language) {
      case 'tw': langCode = 'ak-GH'; break; // Akan (Twi) if supported
      case 'ee': langCode = 'ee-GH'; break; // Ewe if supported
      case 'ga': langCode = 'gaa-GH'; break; // Ga if supported
      case 'en': default: langCode = 'en-GH'; break;
    }
    recognition.lang = langCode;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSend = async (type: 'text' | 'image' = 'text') => {
    if (!input.trim() || !isOnline) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSearchTerm(''); // Clear search to show new message
    setIsLoading(true);

    try {
      if (type === 'image') {
        // Generative Image Mode
        const imageUrl = await generateFarmingVisual(userMsg.text);
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: "Here is a visual aid based on your description:",
          imageUrl: imageUrl,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        // Standard Chat Mode
        const history = messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

        const responseText = await sendChatMessage(history, userMsg.text, language);

        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: responseText,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I'm having trouble connecting right now. Please check your internet connection.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop previous
      const utterance = new SpeechSynthesisUtterance(text);
      
      // --- Voice Selection Logic ---
      // Priorities:
      // 1. African English Female (NG, ZA, GH, KE)
      // 2. Generic English Female (Samantha, Zira, Google US English)
      // 3. Any African English
      // 4. Default
      
      const africanLocales = ['en-NG', 'en-GH', 'en-ZA', 'en-KE'];
      
      // Try finding an African female voice first
      let selectedVoice = voices.find(v => 
        africanLocales.some(loc => v.lang.includes(loc)) && 
        (v.name.includes('Female') || v.name.includes('Women') || !v.name.includes('Male'))
      );

      // If no African female, try generic female English
      if (!selectedVoice) {
        selectedVoice = voices.find(v => 
          v.lang.startsWith('en') && 
          (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Google US English'))
        );
      }

      // If still nothing, try any African accent
      if (!selectedVoice) {
        selectedVoice = voices.find(v => africanLocales.some(loc => v.lang.includes(loc)));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        // If we picked a generic voice, lowering pitch slightly can sometimes make it sound warmer/less robotic
        if (!africanLocales.some(loc => selectedVoice!.lang.includes(loc))) {
           utterance.pitch = 0.9;
        }
      }

      // Clean text from Markdown symbols for cleaner speech
      utterance.text = text.replace(/[*#_`]/g, '');
      window.speechSynthesis.speak(utterance);
    }
  };

  const filteredMessages = messages.filter(m => 
    m.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-stone-50">
      <div className="bg-green-700 text-white p-4 shadow-md">
        <h2 className="text-lg font-bold">AgriGuide Assistant</h2>
        <p className="text-xs text-green-100 mb-2">
          {language === 'tw' ? 'Afuo ho ŋaawoo' : 
           language === 'ee' ? 'Agble ŋuti aɖaŋuɖoɖo' : 
           language === 'ga' ? 'Ŋaawoo kɛha ŋmɔ' : 
           'AI-Powered Farming Advice'}
        </p>

        {/* Search Bar */}
        <div className="relative">
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search history..."
            className="w-full bg-green-800/50 text-white placeholder-green-200 text-sm rounded-lg px-9 py-2 border border-green-600 focus:outline-none focus:bg-green-800 focus:border-green-400 transition-colors"
          />
          <Search size={16} className="absolute left-3 top-2.5 text-green-300" />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-green-300 hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {filteredMessages.length === 0 && searchTerm ? (
           <div className="text-center py-10 text-gray-400">
             <p>No messages found for "{searchTerm}"</p>
           </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white rounded-br-none'
                    : msg.isError 
                      ? 'bg-red-100 text-red-800 rounded-bl-none'
                      : 'bg-white text-gray-800 rounded-bl-none'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                
                {msg.imageUrl && (
                  <div className="mt-3 rounded-lg overflow-hidden">
                    <img src={msg.imageUrl} alt="AI Generated Visual" className="w-full h-auto object-cover" />
                    <span className="text-[10px] text-gray-400 mt-1 block">AI Generated Image</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] ${msg.role === 'user' ? 'text-green-100' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.role === 'model' && !msg.isError && (
                    <button 
                      onClick={() => speakText(msg.text)} 
                      className="text-gray-400 hover:text-green-600 transition-colors p-1"
                      title="Read Aloud (Lady Voice)"
                    >
                      <Volume2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-green-600" />
              <span className="text-sm text-gray-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white p-3 border-t border-gray-200 sticky bottom-0 z-30 shadow-lg">
        <div className={`flex items-center space-x-2 rounded-full px-3 py-2 ${isOnline ? 'bg-gray-100' : 'bg-gray-200'}`}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend('text')}
            placeholder={
              !isOnline ? "You are offline" :
              language === 'tw' ? 'Bisa asɛm...' : 
              language === 'ee' ? 'Biam naneke...' :
              language === 'ga' ? 'Bi mi nɔ ko...' :
              "Ask about crops..."
            }
            className="flex-1 bg-transparent outline-none text-sm text-gray-800 min-w-0"
            disabled={isLoading || !isOnline}
          />
          
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              onClick={toggleListening}
              disabled={!isOnline || isLoading}
              className={`p-2 rounded-full transition-colors ${
                isListening 
                  ? 'bg-red-100 text-red-600 animate-pulse' 
                  : !isOnline ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
              }`}
              title={!isOnline ? "Offline" : "Voice Input"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <button
              onClick={() => handleSend('image')}
              disabled={!isOnline || isLoading || !input.trim()}
              className="p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={!isOnline ? "Offline" : "Generate Visual Aid"}
            >
              <ImageIcon size={18} />
            </button>

            <button 
               onClick={() => handleSend('text')}
               disabled={isLoading || !input.trim() || !isOnline}
               className="p-2 bg-green-600 rounded-full text-white hover:bg-green-700 disabled:opacity-50 disabled:bg-gray-400 transition-colors disabled:cursor-not-allowed"
               title={!isOnline ? "Offline" : "Send"}
            >
              {!isOnline ? <WifiOff size={18} /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

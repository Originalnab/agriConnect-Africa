
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader2, CheckCircle, AlertCircle, X, WifiOff, BookOpen, Sprout, Bug, Calendar, Sun, Search, ArrowRight, Droplet, HeartHandshake, StickyNote, RotateCw, ChevronRight, ExternalLink } from 'lucide-react';
import { analyzeCropHealth, getCropDetails, getCropRotationAdvice } from '../services/geminiService';
import { Language, CropInfo, AnalysisResult, RotationAdvice } from '../types';

interface CropDoctorProps {
  language: Language;
  isOnline: boolean;
}

type DoctorView = 'DIAGNOSE' | 'LIBRARY' | 'ROTATION';

const CropDoctor: React.FC<CropDoctorProps> = ({ language, isOnline }) => {
  const [view, setView] = useState<DoctorView>('DIAGNOSE');
  
  // --- DIAGNOSIS STATE ---
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- LIBRARY STATE ---
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [cropInfo, setCropInfo] = useState<CropInfo | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // For comparison
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<CropInfo[]>([]);
  const [comparisonNotes, setComparisonNotes] = useState<Record<string, string>>({});
  const [isLoadingCompare, setIsLoadingCompare] = useState(false);
  // For notes
  const [noteText, setNoteText] = useState('');
  const [showSaveToast, setShowSaveToast] = useState(false);

  // --- ROTATION ADVISOR STATE ---
  const [rotationHistory, setRotationHistory] = useState<string[]>([]);
  const [rotationAdvice, setRotationAdvice] = useState<RotationAdvice | null>(null);
  const [loadingRotation, setLoadingRotation] = useState(false);

  const commonCrops = [
    'Maize', 'Cocoa', 'Cassava', 'Yam', 
    'Plantain', 'Tomato', 'Pepper', 'Rice', 'Groundnut', 'Cowpea',
    'Okra', 'Garden Eggs', 'Watermelon', 'Pineapple'
  ];

  const filteredCrops = commonCrops.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- HANDLERS: DIAGNOSIS ---

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOnline) return;
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setImage(base64String);
        handleAnalysis(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalysis = async (base64Data: string) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await analyzeCropHealth(base64Data, language);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      // Fallback error state handled in UI
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setImage(null);
    setAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- HANDLERS: LIBRARY ---

  const handleCropSelect = async (crop: string) => {
    if (compareMode) {
      if (selectedForCompare.includes(crop)) {
        setSelectedForCompare(prev => prev.filter(c => c !== crop));
      } else if (selectedForCompare.length < 3) {
        setSelectedForCompare(prev => [...prev, crop]);
      }
      return;
    }

    setSelectedCrop(crop);
    setCropInfo(null);
    setIsLoadingInfo(true);
    
    // Load note
    const savedNote = localStorage.getItem(`note_${crop}`);
    setNoteText(savedNote || '');

    try {
      const info = await getCropDetails(crop, language);
      setCropInfo(info);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const saveNote = () => {
    if (selectedCrop) {
      localStorage.setItem(`note_${selectedCrop}`, noteText);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    }
  };

  const handleCompare = async () => {
    setIsLoadingCompare(true);
    setComparisonData([]);
    setComparisonNotes({});
    
    try {
      const promises = selectedForCompare.map(crop => getCropDetails(crop, language));
      const results = await Promise.all(promises);
      setComparisonData(results);

      // Load notes for all selected crops
      const notesMap: Record<string, string> = {};
      selectedForCompare.forEach(c => {
        notesMap[c] = localStorage.getItem(`note_${c}`) || '';
      });
      setComparisonNotes(notesMap);

    } catch (error) {
      console.error("Comparison failed", error);
    } finally {
      setIsLoadingCompare(false);
    }
  };

  const handleCompareNoteChange = (crop: string, text: string) => {
    setComparisonNotes(prev => ({ ...prev, [crop]: text }));
  };

  const handleCompareNoteSave = (crop: string) => {
    localStorage.setItem(`note_${crop}`, comparisonNotes[crop]);
    // Optional: small feedback or just auto-save logic could work
  };

  // --- HANDLERS: ROTATION ---

  const toggleRotationCrop = (crop: string) => {
    if (rotationHistory.includes(crop)) {
      setRotationHistory(prev => prev.filter(c => c !== crop));
    } else {
      setRotationHistory(prev => [...prev, crop]);
    }
  };

  const getRotationAdvice = async () => {
    if (rotationHistory.length === 0) return;
    setLoadingRotation(true);
    try {
      const result = await getCropRotationAdvice("Ghana", rotationHistory, language);
      setRotationAdvice(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingRotation(false);
    }
  };

  const labels = {
    en: { 
      title: 'Crop Care', tabDiag: 'Doctor', tabLib: 'Library', tabRot: 'Rotation',
      search: 'Search crops...', compare: 'Compare', notes: 'My Notes', save: 'Save Note',
      soil: 'Soil Needs', companion: 'Companions', disease: 'Diseases', 
      rotTitle: 'Crop Rotation Advisor', rotSub: 'Select previous crops to get advice.',
      getAdvice: 'Get Advice', viewLib: 'View in Library',
      noRes: 'No crops found', identified: 'Identified Issues'
    },
    tw: { 
      title: 'Afuo Hwɛ', tabDiag: 'Dɔkota', tabLib: 'Nwoma', tabRot: 'Nsesa',
      search: 'Hwehwɛ...', compare: 'Toto Ho', notes: 'Me Nsɛm', save: 'Sie',
      soil: 'Asase Ho', companion: 'Bokafoɔ', disease: 'Yareɛ',
      rotTitle: 'Afuo Nsesa', rotSub: 'Kyerɛ nea woduaa ɛ kane.',
      getAdvice: 'Gye Afutuo', viewLib: 'Hwɛ Nwoma No',
      noRes: 'Hwee nni hɔ', identified: 'Haw A Yɛahu'
    },
    // ... (Simplified for brevity, ideally complete for all langs)
  };

  const t = labels[language as keyof typeof labels] || labels.en;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col pb-20 relative">
      
      {/* Toast Notification */}
      {showSaveToast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center z-50 animate-in slide-in-from-bottom-4 fade-in">
          <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
          <span className="font-medium">Note saved successfully</span>
        </div>
      )}

      {/* Sticky Header & Tabs */}
      <div className="sticky top-0 z-20 bg-stone-50 pt-4 px-4 pb-2 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-green-800">{t.title}</h1>
        </div>
        
        <div className="flex p-1 bg-gray-200 rounded-xl">
          <button
            onClick={() => setView('DIAGNOSE')}
            className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-medium transition-all ${
              view === 'DIAGNOSE' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'
            }`}
          >
            <Camera size={14} className="mr-1" /> {t.tabDiag}
          </button>
          <button
            onClick={() => setView('LIBRARY')}
            className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-medium transition-all ${
              view === 'LIBRARY' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'
            }`}
          >
            <BookOpen size={14} className="mr-1" /> {t.tabLib}
          </button>
          <button
            onClick={() => setView('ROTATION')}
            className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-medium transition-all ${
              view === 'ROTATION' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'
            }`}
          >
            <RotateCw size={14} className="mr-1" /> {t.tabRot}
          </button>
        </div>
      </div>

      <div className="p-4 flex-1">
        {/* --- DIAGNOSE VIEW --- */}
        {view === 'DIAGNOSE' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {!image ? (
              <div className={`flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-2xl transition-colors ${isOnline ? 'border-green-300 bg-green-50/50' : 'border-gray-300 bg-gray-100'}`}>
                <div className="text-center p-6">
                  {isOnline ? (
                    <>
                      <Camera className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="hidden"
                        id="camera-input"
                      />
                      <label
                        htmlFor="camera-input"
                        className="bg-green-600 text-white px-6 py-3 rounded-full font-medium shadow-lg active:scale-95 transition-transform cursor-pointer inline-flex items-center"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Select Image
                      </label>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-500 font-medium">Offline Mode</p>
                      <p className="text-xs text-gray-400 mt-2">Diagnosis requires internet</p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Image Display with Overlay */}
                <div className="relative rounded-2xl overflow-hidden shadow-lg max-h-80 w-full bg-black">
                  <img src={image} alt="Crop" className="w-full h-full object-contain" />
                  
                  {/* Bounding Box Overlays */}
                  {analysis?.issues?.map((issue, idx) => {
                    if (issue.box_2d) {
                      const [ymin, xmin, ymax, xmax] = issue.box_2d;
                      // Convert 0-1000 scale to percentages
                      const top = ymin / 10;
                      const left = xmin / 10;
                      const height = (ymax - ymin) / 10;
                      const width = (xmax - xmin) / 10;
                      return (
                        <div 
                          key={idx}
                          className="absolute border-2 border-red-500 bg-red-500/30 flex items-end justify-center z-10 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                          style={{ top: `${top}%`, left: `${left}%`, height: `${height}%`, width: `${width}%` }}
                        >
                           <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 mb-[-20px] rounded shadow-sm whitespace-nowrap z-20">{issue.label}</span>
                        </div>
                      );
                    }
                    return null;
                  })}

                  <button 
                    onClick={resetAnalysis}
                    className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 z-30 backdrop-blur-sm"
                  >
                    <X size={20} />
                  </button>
                </div>

                {isAnalyzing ? (
                  <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center text-center animate-pulse">
                    <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-3" />
                    <p className="text-gray-600 font-medium">Analyzing your crop...</p>
                  </div>
                ) : analysis ? (
                  <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center">
                          <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                          <h3 className="font-bold text-lg text-gray-800">{analysis.cropName}</h3>
                       </div>
                       {commonCrops.map(c => c.toLowerCase()).includes(analysis.cropName.toLowerCase()) && (
                         <button 
                           onClick={() => {
                             setView('LIBRARY');
                             handleCropSelect(commonCrops.find(c => c.toLowerCase() === analysis.cropName.toLowerCase()) || analysis.cropName);
                           }}
                           className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full flex items-center hover:bg-green-200 font-medium"
                         >
                           {t.viewLib} <ArrowRight size={12} className="ml-1"/>
                         </button>
                       )}
                    </div>
                    
                    <p className="text-gray-700 text-sm mb-6 leading-relaxed bg-gray-50 p-3 rounded-lg">{analysis.diagnosis}</p>
                    
                    {/* Identified Issues List with Links */}
                    {analysis.issues && analysis.issues.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-bold text-gray-800 text-sm mb-3">{t.identified}:</h4>
                        <div className="grid gap-2">
                          {analysis.issues.map((issue, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-red-50 p-3 rounded-lg border border-red-100">
                              <div className="flex items-center">
                                 <AlertCircle size={16} className="text-red-500 mr-2 flex-shrink-0" />
                                 <span className="text-sm font-medium text-gray-800">{issue.label}</span>
                              </div>
                              {commonCrops.map(c => c.toLowerCase()).includes(analysis.cropName.toLowerCase()) && (
                                 <button
                                    onClick={() => {
                                        setView('LIBRARY');
                                        handleCropSelect(commonCrops.find(c => c.toLowerCase() === analysis.cropName.toLowerCase()) || analysis.cropName);
                                    }}
                                    className="text-xs text-green-700 hover:text-green-800 underline flex items-center flex-shrink-0 ml-2"
                                 >
                                    Library <ChevronRight size={12} />
                                 </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <h4 className="font-bold text-gray-800 text-sm mb-2">Treatment:</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-2 mb-4">
                      {analysis.treatment?.map((step, i) => (
                        <li key={i} className="leading-relaxed">{step}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                   <div className="text-center text-gray-500">Could not analyze. Try again.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- LIBRARY VIEW --- */}
        {view === 'LIBRARY' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {!selectedCrop && comparisonData.length === 0 ? (
              <>
                <div className="flex space-x-2 mb-4 sticky top-16 z-10 bg-stone-50 pb-2">
                  <div className="flex-1 bg-white rounded-lg border border-gray-200 flex items-center px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-green-500">
                    <Search size={18} className="text-gray-400 mr-2" />
                    <input 
                      type="text"
                      placeholder={t.search}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 outline-none text-sm bg-transparent"
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm('')} className="text-gray-400">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <button 
                     onClick={() => {
                       setCompareMode(!compareMode);
                       setSelectedForCompare([]);
                     }}
                     className={`px-3 rounded-lg text-xs font-bold transition-colors shadow-sm ${compareMode ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                  >
                    {compareMode ? 'Done' : t.compare}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-20 min-h-[200px]">
                  {filteredCrops.length > 0 ? (
                    filteredCrops.map(crop => (
                      <button
                        key={crop}
                        onClick={() => handleCropSelect(crop)}
                        className={`p-4 rounded-xl shadow-sm border flex flex-col items-center justify-center transition-all active:scale-95 ${
                           selectedForCompare.includes(crop) 
                           ? 'bg-green-100 border-green-500 ring-2 ring-green-500'
                           : 'bg-white border-gray-100 hover:border-green-300 hover:bg-green-50'
                        }`}
                      >
                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                          <Sprout size={20} />
                        </div>
                        <span className="font-medium text-gray-800 text-center">{crop}</span>
                        {compareMode && selectedForCompare.includes(crop) && <CheckCircle size={16} className="text-green-600 mt-1" />}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-2 flex flex-col items-center justify-center text-gray-400 py-10">
                      <Sprout size={48} className="mb-3 opacity-20" />
                      <p>{t.noRes} "{searchTerm}"</p>
                    </div>
                  )}
                </div>

                {/* Comparison Floating Action */}
                {compareMode && selectedForCompare.length > 1 && (
                   <div className="fixed bottom-24 left-0 right-0 px-4 flex justify-center z-30">
                      <button 
                        onClick={handleCompare}
                        className="bg-green-800 text-white px-6 py-3 rounded-full shadow-xl font-bold flex items-center animate-bounce"
                      >
                        Compare ({selectedForCompare.length}) <ArrowRight size={18} className="ml-2" />
                      </button>
                   </div>
                )}
              </>
            ) : comparisonData.length > 0 ? (
              // COMPARISON VIEW
              <div className="space-y-4">
                <button 
                  onClick={() => setComparisonData([])}
                  className="text-sm text-green-600 font-medium flex items-center hover:underline mb-2"
                >
                  <ChevronRight size={16} className="rotate-180 mr-1" /> Back
                </button>
                <div className="overflow-x-auto pb-4">
                  <table className="min-w-full bg-white rounded-xl shadow-sm text-sm border-collapse">
                    <thead>
                      <tr className="bg-green-50 border-b border-green-100">
                        <th className="p-3 text-left text-green-800 sticky left-0 bg-green-50 z-10 shadow-r border-r border-green-100">Feature</th>
                        {comparisonData.map(c => <th key={c.name} className="p-3 text-left text-green-900 font-bold min-w-[150px]">{c.name}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                         <td className="p-3 font-medium text-gray-500 sticky left-0 bg-white shadow-r border-r border-gray-100">Season</td>
                         {comparisonData.map(c => <td key={c.name} className="p-3 align-top">{c.plantingSeason}</td>)}
                      </tr>
                      <tr>
                         <td className="p-3 font-medium text-gray-500 sticky left-0 bg-white shadow-r border-r border-gray-100">Soil</td>
                         {comparisonData.map(c => <td key={c.name} className="p-3 align-top">{c.soilRequirements}</td>)}
                      </tr>
                      <tr>
                         <td className="p-3 font-medium text-gray-500 sticky left-0 bg-white shadow-r border-r border-gray-100">Pests</td>
                         {comparisonData.map(c => (
                           <td key={c.name} className="p-3 align-top">
                             <ul className="list-disc list-inside text-xs space-y-1">
                               {c.commonPests.slice(0,3).map((p,i) => <li key={i}>{p}</li>)}
                             </ul>
                           </td>
                         ))}
                      </tr>
                      <tr>
                         <td className="p-3 font-medium text-gray-500 sticky left-0 bg-white shadow-r border-r border-gray-100">Care</td>
                         {comparisonData.map(c => <td key={c.name} className="p-3 text-xs align-top line-clamp-4">{c.careTips}</td>)}
                      </tr>
                      {/* Notes Row */}
                      <tr className="bg-yellow-50/30">
                        <td className="p-3 font-bold text-yellow-700 sticky left-0 bg-yellow-50 shadow-r border-r border-gray-200 align-top">
                           <div className="flex items-center"><StickyNote size={14} className="mr-1"/> Notes</div>
                        </td>
                        {comparisonData.map(c => (
                          <td key={c.name} className="p-2 align-top">
                             <textarea
                               className="w-full text-xs p-2 rounded border border-yellow-200 bg-yellow-50 focus:ring-1 focus:ring-yellow-400 focus:outline-none resize-none"
                               rows={4}
                               placeholder={`Notes for ${c.name}...`}
                               value={comparisonNotes[c.name] || ''}
                               onChange={(e) => handleCompareNoteChange(c.name, e.target.value)}
                               onBlur={() => handleCompareNoteSave(c.name)}
                             />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // DETAIL VIEW
              <div className="space-y-4">
                <button 
                  onClick={() => setSelectedCrop(null)}
                  className="text-sm text-green-600 font-medium flex items-center hover:underline mb-2"
                >
                  <ChevronRight size={16} className="rotate-180 mr-1" /> Back to list
                </button>

                {isLoadingInfo ? (
                   <div className="bg-white p-8 rounded-xl shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                     <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-4" />
                     <p className="text-gray-500 text-sm">Fetching detailed guide...</p>
                   </div>
                ) : cropInfo ? (
                   <div className="space-y-4 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="bg-green-600 text-white p-5 rounded-xl shadow-md relative overflow-hidden">
                        <div className="relative z-10">
                          <h2 className="text-3xl font-bold flex items-center mb-1">
                             {cropInfo.name}
                          </h2>
                          <p className="text-green-100 text-sm opacity-90">Complete Farming Guide</p>
                        </div>
                        <Sprout className="absolute -right-6 -bottom-6 w-32 h-32 text-green-500 opacity-30 rotate-12" />
                     </div>

                     {/* Key Details Grid */}
                     <div className="grid grid-cols-1 gap-3">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                           <h3 className="font-bold text-green-800 flex items-center mb-2">
                              <Calendar className="w-4 h-4 mr-2" /> Planting
                           </h3>
                           <p className="text-sm text-gray-700">{cropInfo.plantingSeason}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                           <h3 className="font-bold text-amber-700 flex items-center mb-2">
                              <Droplet className="w-4 h-4 mr-2" /> {t.soil}
                           </h3>
                           <p className="text-sm text-gray-700">{cropInfo.soilRequirements}</p>
                        </div>
                     </div>

                     <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-green-800 flex items-center mb-2">
                           <Sun className="w-5 h-5 mr-2" /> Care Tips
                        </h3>
                        <p className="text-gray-700 text-sm leading-relaxed">{cropInfo.careTips}</p>
                     </div>

                     <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-blue-600 flex items-center mb-2">
                           <HeartHandshake className="w-5 h-5 mr-2" /> {t.companion}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                           {cropInfo.companionPlants?.map((p, i) => (
                              <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md border border-blue-100">{p}</span>
                           ))}
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                           <h3 className="font-bold text-red-600 flex items-center mb-2">
                              <Bug className="w-4 h-4 mr-2" /> Pests
                           </h3>
                           <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                              {cropInfo.commonPests.slice(0,5).map((p,i) => <li key={i}>{p}</li>)}
                           </ul>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                           <h3 className="font-bold text-orange-600 flex items-center mb-2">
                              <AlertCircle className="w-4 h-4 mr-2" /> {t.disease}
                           </h3>
                           <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                              {cropInfo.commonDiseases?.slice(0,5).map((p,i) => <li key={i}>{p}</li>)}
                           </ul>
                        </div>
                     </div>

                     {/* Personal Notes */}
                     <div className="bg-yellow-50 p-5 rounded-xl shadow-sm border border-yellow-100">
                        <h3 className="font-bold text-yellow-800 flex items-center mb-2">
                           <StickyNote className="w-5 h-5 mr-2" /> {t.notes}
                        </h3>
                        <textarea
                           className="w-full p-3 bg-white rounded-lg text-sm border border-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-shadow"
                           rows={3}
                           placeholder="Add your own observations here..."
                           value={noteText}
                           onChange={(e) => setNoteText(e.target.value)}
                        />
                        <div className="flex justify-end mt-2">
                           <button 
                             onClick={saveNote}
                             className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-yellow-500 transition-colors shadow-sm"
                           >
                             {t.save}
                           </button>
                        </div>
                     </div>
                   </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">Info unavailable.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- ROTATION ADVISOR VIEW --- */}
        {view === 'ROTATION' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-lg font-bold text-gray-800 mb-1">{t.rotTitle}</h2>
            <p className="text-sm text-gray-500 mb-4">{t.rotSub}</p>

            {!rotationAdvice ? (
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">Select crops you planted recently:</p>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {commonCrops.map(crop => (
                    <button
                      key={crop}
                      onClick={() => toggleRotationCrop(crop)}
                      className={`text-sm py-2 px-3 rounded-lg border text-left flex justify-between items-center transition-all ${
                        rotationHistory.includes(crop)
                        ? 'bg-green-100 border-green-500 text-green-800'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      {crop}
                      {rotationHistory.includes(crop) && <CheckCircle size={14} />}
                    </button>
                  ))}
                </div>
                
                <button
                   onClick={getRotationAdvice}
                   disabled={rotationHistory.length === 0 || loadingRotation || !isOnline}
                   className={`w-full py-3 rounded-xl font-bold shadow-lg flex justify-center items-center transition-colors ${
                      isOnline 
                      ? 'bg-green-700 text-white hover:bg-green-800' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                   }`}
                   title={!isOnline ? "Requires internet connection" : ""}
                >
                   {loadingRotation ? <Loader2 className="animate-spin mr-2" /> : t.getAdvice}
                </button>
              </div>
            ) : (
               <div className="space-y-4">
                 <button 
                    onClick={() => setRotationAdvice(null)}
                    className="text-sm text-gray-500 flex items-center hover:text-green-600"
                 >
                   <RotateCw size={14} className="mr-1" /> Reset
                 </button>

                 <div className="bg-green-50 border border-green-200 p-5 rounded-xl shadow-sm animate-in zoom-in-95 duration-300">
                    <h3 className="text-green-800 font-bold text-lg mb-2">Recommended:</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {rotationAdvice.recommendedCrops.map(c => (
                        <span key={c} className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm flex items-center">
                          <Sprout size={12} className="mr-1"/> {c}
                        </span>
                      ))}
                    </div>
                    <h4 className="font-bold text-sm text-gray-700 mt-4">Why?</h4>
                    <p className="text-sm text-gray-600 leading-relaxed bg-white p-3 rounded-lg border border-green-100 mt-1">{rotationAdvice.reasoning}</p>
                    
                    <h4 className="font-bold text-sm text-gray-700 mt-4">Soil Benefit:</h4>
                    <p className="text-sm text-gray-600 leading-relaxed bg-white p-3 rounded-lg border border-green-100 mt-1">{rotationAdvice.soilBenefits}</p>
                 </div>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CropDoctor;

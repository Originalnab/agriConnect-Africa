
import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Minus, History, Download, Filter, ArrowUpDown, ShoppingBag, Plus, MapPin, Star, User, Phone, CreditCard, Loader2, CheckCircle, Search, X, Smartphone } from 'lucide-react';
import { MarketItem, Language, MarketplaceItem } from '../types';

interface MarketViewProps {
  language: Language;
  isOnline: boolean;
}

type Tab = 'trends' | 'marketplace';
type PaymentMethod = 'momo' | 'card';

const MarketView: React.FC<MarketViewProps> = ({ language, isOnline }) => {
  const [activeTab, setActiveTab] = useState<Tab>('marketplace');
  
  // Trends State
  const [selectedHistoryCrop, setSelectedHistoryCrop] = useState('Maize');
  const [trendFilter, setTrendFilter] = useState<'all' | 'up' | 'down' | 'stable'>('all');
  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');

  // Marketplace State
  const [searchMarket, setSearchMarket] = useState('');
  const [showSellModal, setShowSellModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('momo');
  const [paymentStep, setPaymentStep] = useState<'select' | 'input' | 'processing' | 'success'>('select');
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  // --- MOCK DATA ---

  // Market Trends Data
  const marketData: MarketItem[] = [
    { name: 'Maize', price: 250, unit: '100kg bag', trend: 'up' },
    { name: 'Yam', price: 1800, unit: '100 tubers', trend: 'stable' },
    { name: 'Cocoa', price: 1300, unit: '64kg bag', trend: 'up' },
    { name: 'Cassava', price: 120, unit: 'Max bag', trend: 'down' },
    { name: 'Tomato', price: 2200, unit: 'Crate', trend: 'up' },
    { name: 'Plantain', price: 45, unit: 'Bunch', trend: 'down' },
    { name: 'Rice', price: 400, unit: '50kg bag', trend: 'stable' },
  ];

  const historyDataMap: Record<string, { month: string; price: number }[]> = {
    'Maize': [{ month: 'Jan', price: 210 }, { month: 'Feb', price: 215 }, { month: 'Mar', price: 230 }, { month: 'Apr', price: 225 }, { month: 'May', price: 240 }, { month: 'Jun', price: 250 }],
    'Yam': [{ month: 'Jan', price: 1600 }, { month: 'Feb', price: 1650 }, { month: 'Mar', price: 1700 }, { month: 'Apr', price: 1750 }, { month: 'May', price: 1800 }, { month: 'Jun', price: 1800 }],
  };

  // Marketplace Listings Data
  const [listings, setListings] = useState<MarketplaceItem[]>([
    { id: '1', name: 'Organic Pona Yams', price: 1200, unit: '50 Tubers', sellerName: 'Kwame Mensah', rating: 4.8, reviews: 24, location: 'Tamale', category: 'Tubers', isVerified: true },
    { id: '2', name: 'Fresh Tomatoes', price: 1500, unit: 'Large Crate', sellerName: 'Ama Serwaa', rating: 4.5, reviews: 12, location: 'Navrongo', category: 'Vegetables', isVerified: true },
    { id: '3', name: 'Local Brown Rice', price: 450, unit: '50kg Bag', sellerName: 'Northern Star Farms', rating: 4.9, reviews: 56, location: 'Bolgatanga', category: 'Grains' },
    { id: '4', name: 'Ripe Plantain', price: 40, unit: 'Bunch', sellerName: 'Kofi & Sons', rating: 4.2, reviews: 8, location: 'Kumasi', category: 'Fruits' },
    { id: '5', name: 'Dry Maize', price: 240, unit: '100kg Bag', sellerName: 'Techiman Co-op', rating: 4.7, reviews: 110, location: 'Techiman', category: 'Grains', isVerified: true },
  ]);

  // --- LOGIC ---

  const filteredTrends = marketData
    .filter(item => trendFilter === 'all' || item.trend === trendFilter)
    .sort((a, b) => {
      if (sortOrder === 'default') return 0;
      return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    });

  const filteredListings = listings.filter(item => 
    item.name.toLowerCase().includes(searchMarket.toLowerCase()) ||
    item.location.toLowerCase().includes(searchMarket.toLowerCase())
  );

  const handleBuyClick = (item: MarketplaceItem) => {
    setSelectedItem(item);
    setPaymentStep('select');
    setShowPaymentModal(true);
  };

  const handleProcessPayment = () => {
    setPaymentStep('processing');
    setTimeout(() => {
      setPaymentStep('success');
    }, 2000);
  };

  const handleSellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const newItem: MarketplaceItem = {
      id: Date.now().toString(),
      name: formData.get('name') as string,
      price: Number(formData.get('price')),
      unit: formData.get('unit') as string,
      location: formData.get('location') as string,
      category: formData.get('category') as string,
      sellerName: 'You', // Simplified
      rating: 5.0,
      reviews: 0,
      isVerified: true,
      image: newImagePreviews[0] || undefined,
    };

    setListings([newItem, ...listings]);
    setNewImagePreviews([]);
    setShowSellModal(false);
  };

  const handleImageChange = (files?: FileList | null) => {
    if (!files || files.length === 0) {
      setNewImagePreviews([]);
      return;
    }
    const selected = Array.from(files).slice(0, 7); // limit to 7 images
    const readers = selected.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.readAsDataURL(file);
        }),
    );
    Promise.all(readers).then((previews) => {
      setNewImagePreviews(previews.filter(Boolean));
    });
  };

  // --- TRANSLATIONS ---
  const translations = {
    en: { 
      trends: 'Market Trends', market: 'Farm Connect',
      buyTitle: 'Buy Fresh Produce', buySub: 'Connect directly with farmers',
      sellBtn: 'Sell Produce', searchPlace: 'Search crops, locations...',
      payVia: 'Pay with', momo: 'Mobile Money', card: 'Visa / Mastercard',
      enterMomo: 'Enter Mobile Number', enterCard: 'Enter Card Details',
      payNow: 'Pay Now', processing: 'Processing Transaction...',
      success: 'Payment Successful!', successMsg: 'The seller has been notified. Rate them after delivery.',
      rateSeller: 'Rate Seller', close: 'Close'
    },
    tw: { 
      trends: 'Egua Mu Nsɛm', market: 'Afuo Egua',
      buyTitle: 'Tɔ Aduane Foforo', buySub: 'Tɔ tẽẽ firi akuafoɔ hɔ',
      sellBtn: 'Tɔn Wo Deɛ', searchPlace: 'Hwehwɛ aduane, kuro...',
      payVia: 'Tua ka fa', momo: 'Mobile Money', card: 'Visa / Mastercard',
      enterMomo: 'Bɔ wo namba', enterCard: 'Bɔ wo kaade namba',
      payNow: 'Tua Seesei', processing: 'Yɛretua...',
      success: 'Akatua no akɔ!', successMsg: 'Yɛbɔɔ tɔnfoɔ no amanneɛ. Wo nsa ka a, kyerɛ nea ɔyɛɛ ne ho.',
      rateSeller: 'Kyerɛ Nea Ɔyɛɛ Ne Ho', close: 'To Mu'
    },
    // (Adding simplified fallbacks for others to save space)
    ee: { trends: 'Asi Nyawo', market: 'Agble Asi', buyTitle: 'Ƒle Nuwo', sellBtn: 'Dzra Nu', payVia: 'Tua Fe', momo: 'Mobile Money', card: 'Card', payNow: 'Tua Fifia', success: 'Woatuae!', rateSeller: 'Kafui', close: 'Tu Eme' },
    ga: { trends: 'Jra Nɔ Nii', market: 'Ŋmɔ Jra', buyTitle: 'Hé Niyenii', sellBtn: 'Hɔɔ Nii', payVia: 'Wo He Nyiɛ', momo: 'Mobile Money', card: 'Card', payNow: 'Wo Amli', success: 'Nyitfumɔ lɛ ewie!', rateSeller: 'Kaimɔ Lɛ', close: 'Ŋamɔ' }
  };
  const t = translations[language] || translations.en;

  // --- RENDER HELPERS ---
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={12} className={`${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        ))}
        <span className="text-xs text-gray-500 ml-1">({rating})</span>
      </div>
    );
  };

  return (
    <div className="bg-stone-50 min-h-screen flex flex-col relative">
      
      {/* TOP NAVIGATION TABS */}
      <div className="bg-white p-4 pb-0 shadow-sm z-10 sticky top-0">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-green-900">AgriMarket</h1>
          <button 
             onClick={() => setShowSellModal(true)}
             className="bg-green-600 text-white p-2 rounded-full shadow-lg hover:bg-green-700 transition-all active:scale-95"
             title={t.sellBtn}
          >
             <Plus size={24} />
          </button>
        </div>
        
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center ${
              activeTab === 'trends' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'
            }`}
          >
            <TrendingUp size={16} className="mr-2" /> {t.trends}
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center ${
              activeTab === 'marketplace' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'
            }`}
          >
            <ShoppingBag size={16} className="mr-2" /> {t.market}
          </button>
        </div>
      </div>

      <div className="p-4 pb-24 flex-1 overflow-y-auto">
        
        {/* --- TAB 1: MARKET TRENDS (Existing Logic) --- */}
        {activeTab === 'trends' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-start mb-6">
               <div>
                 <h2 className="font-bold text-gray-800">Price Analytics</h2>
                 <p className="text-xs text-gray-500">Track wholesale prices</p>
               </div>
               <button className="text-xs bg-white border border-green-200 text-green-700 px-2 py-1 rounded flex items-center">
                 <Download size={12} className="mr-1"/> Export
               </button>
            </div>

            {/* Charts Section */}
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
               <div className="h-48 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={filteredTrends}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
                     <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                     <Tooltip cursor={{fill: '#f0fdf4'}} contentStyle={{borderRadius: '8px'}} />
                     <Bar dataKey="price" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={30} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* List Section */}
            <div className="flex justify-between items-center mb-3">
               <h3 className="font-bold text-gray-700">Commodities</h3>
               <div className="flex space-x-2">
                  <select 
                    onChange={(e) => setTrendFilter(e.target.value as any)}
                    className="text-xs bg-white border-gray-200 rounded-md p-1"
                  >
                    <option value="all">All Trends</option>
                    <option value="up">Rising</option>
                    <option value="down">Falling</option>
                  </select>
               </div>
            </div>

            <div className="space-y-3">
              {filteredTrends.map((item, index) => (
                <div key={index} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                    <p className="text-[10px] text-gray-500">Per {item.unit}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-700 text-sm">₵{item.price.toLocaleString()}</div>
                    <div className={`text-[10px] flex items-center justify-end ${
                      item.trend === 'up' ? 'text-red-500' : item.trend === 'down' ? 'text-green-500' : 'text-gray-400'
                    }`}>
                      {item.trend === 'up' ? <TrendingUp size={10} className="mr-1" /> : 
                       item.trend === 'down' ? <TrendingDown size={10} className="mr-1" /> : <Minus size={10} className="mr-1" />}
                      {item.trend}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 2: FARM CONNECT MARKETPLACE (New) --- */}
        {activeTab === 'marketplace' && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-300">
            
            {/* Search Header */}
            <div className="relative mb-6">
              <input 
                type="text" 
                placeholder={t.searchPlace}
                value={searchMarket}
                onChange={(e) => setSearchMarket(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 shadow-sm text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            </div>

            {/* Categories (Pill Scroll) */}
            <div className="flex space-x-2 overflow-x-auto no-scrollbar mb-6 pb-1">
               {['All', 'Tubers', 'Grains', 'Vegetables', 'Fruits', 'Livestock'].map(cat => (
                 <button key={cat} className="whitespace-nowrap px-4 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors">
                   {cat}
                 </button>
               ))}
            </div>

            <div className="mb-4">
              <h2 className="font-bold text-gray-800">{t.buyTitle}</h2>
              <p className="text-xs text-gray-500">{t.buySub}</p>
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-2 gap-3">
              {filteredListings.map(item => (
                 <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full">
                    {/* Product Image */}
                    <div className="h-28 bg-gray-100 relative">
                       {item.image ? (
                         <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                       ) : (
                         <div className="absolute inset-0 flex items-center justify-center text-green-200">
                           <ShoppingBag size={32} />
                         </div>
                       )}
                       <div className="absolute top-2 left-2 bg-white/90 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-600">
                          {item.category}
                       </div>
                    </div>
                    
                    <div className="p-3 flex-1 flex flex-col">
                       <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-sm text-gray-800 leading-tight">{item.name}</h3>
                          {item.isVerified && <CheckCircle size={12} className="text-blue-500 flex-shrink-0 ml-1" />}
                       </div>
                       
                       <div className="text-xs text-gray-500 mb-2 flex items-center">
                          <MapPin size={10} className="mr-1" /> {item.location}
                       </div>

                       <div className="flex items-center justify-between mt-auto mb-2">
                          <div className="text-green-700 font-bold text-sm">₵{item.price}</div>
                          <div className="text-[10px] text-gray-400">/{item.unit}</div>
                       </div>

                       <div className="flex items-center justify-between border-t border-gray-50 pt-2">
                          <div className="flex flex-col">
                             <span className="text-[10px] text-gray-600 truncate max-w-[60px]">{item.sellerName}</span>
                             {renderStars(item.rating)}
                          </div>
                          <button 
                            onClick={() => handleBuyClick(item)}
                            className="bg-green-600 text-white p-1.5 rounded-lg hover:bg-green-700 shadow-sm"
                          >
                             <ShoppingBag size={14} />
                          </button>
                       </div>
                    </div>
                 </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- SELL MODAL --- */}
      {showSellModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-6 animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-gray-800">{t.sellBtn}</h3>
              <button onClick={() => setShowSellModal(false)} className="text-gray-400"><X size={24} /></button>
            </div>
            <form onSubmit={handleSellSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Crop Name</label>
                <input name="name" required className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="e.g. Watermelon" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Price (GHS)</label>
                  <input name="price" type="number" required className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Per Unit</label>
                  <input name="unit" required className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="Bag, Kg..." />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Category</label>
                <select name="category" className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white">
                  <option>Vegetables</option>
                  <option>Tubers</option>
                  <option>Grains</option>
                  <option>Fruits</option>
                  <option>Livestock</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input name="location" required className="w-full border border-gray-200 rounded-lg p-3 pl-10 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="Town or City" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Upload Images (max 7)</label>
                <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 hover:border-green-400 transition flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageChange(e.target.files)}
                    className="w-full text-sm"
                  />
                  <p className="text-[11px] text-gray-500">Add up to 7 photos to help buyers see quality.</p>
                  {newImagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {newImagePreviews.map((src, idx) => (
                        <div key={idx} className="h-16 rounded-lg overflow-hidden border border-gray-200">
                          <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button type="submit" className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-md mt-2">
                Post Ad
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- PAYMENT MODAL --- */}
      {showPaymentModal && selectedItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden">
              
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-lg text-gray-800">
                   {paymentStep === 'success' ? 'Order Confirmed' : 'Checkout'}
                 </h3>
                 {paymentStep !== 'success' && paymentStep !== 'processing' && (
                   <button onClick={() => setShowPaymentModal(false)} className="text-gray-400"><X size={20} /></button>
                 )}
              </div>

              {/* Step 1: Select Method */}
              {paymentStep === 'select' && (
                <div className="space-y-4">
                   <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800">{selectedItem.name}</p>
                        <p className="text-xs text-gray-500">{selectedItem.unit} • {selectedItem.sellerName}</p>
                      </div>
                      <div className="text-green-700 font-bold">₵{selectedItem.price}</div>
                   </div>

                   <p className="text-xs font-bold text-gray-500 uppercase mt-4">{t.payVia}</p>
                   
                   <button 
                     onClick={() => { setPaymentMethod('momo'); setPaymentStep('input'); }}
                     className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition-all group"
                   >
                      <div className="flex items-center">
                         <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-900 mr-3 group-hover:scale-110 transition-transform">
                            <Smartphone size={20} />
                         </div>
                         <div className="text-left">
                           <p className="font-bold text-gray-800">{t.momo}</p>
                           <p className="text-[10px] text-gray-500">MTN, Telecel, AT</p>
                         </div>
                      </div>
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 group-hover:border-yellow-500"></div>
                   </button>

                   <button 
                     onClick={() => { setPaymentMethod('card'); setPaymentStep('input'); }}
                     className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
                   >
                      <div className="flex items-center">
                         <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white mr-3 group-hover:scale-110 transition-transform">
                            <CreditCard size={20} />
                         </div>
                         <div className="text-left">
                           <p className="font-bold text-gray-800">{t.card}</p>
                           <p className="text-[10px] text-gray-500">Visa, Mastercard</p>
                         </div>
                      </div>
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 group-hover:border-blue-500"></div>
                   </button>
                </div>
              )}

              {/* Step 2: Input Details */}
              {paymentStep === 'input' && (
                 <div className="space-y-4 animate-in slide-in-from-right-8">
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                       <button onClick={() => setPaymentStep('select')} className="hover:text-green-600">Change Method</button>
                    </div>

                    {paymentMethod === 'momo' ? (
                      <div>
                         <label className="block text-xs font-bold text-gray-600 mb-2">{t.enterMomo}</label>
                         <div className="flex space-x-2">
                            <select className="bg-gray-100 rounded-lg text-sm px-2">
                               <option>MTN</option>
                               <option>Telecel</option>
                               <option>AT</option>
                            </select>
                            <input type="tel" className="flex-1 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-400 outline-none" placeholder="024 XXX XXXX" autoFocus />
                         </div>
                      </div>
                    ) : (
                      <div>
                         <label className="block text-xs font-bold text-gray-600 mb-2">{t.enterCard}</label>
                         <input className="w-full border border-gray-300 rounded-lg p-3 mb-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Card Number" />
                         <div className="flex space-x-3">
                            <input className="w-1/2 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="MM/YY" />
                            <input className="w-1/2 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="CVV" />
                         </div>
                      </div>
                    )}
                    
                    <div className="pt-4">
                       <div className="flex justify-between text-sm mb-4">
                          <span className="text-gray-500">Total to pay</span>
                          <span className="font-bold text-xl text-green-700">₵{selectedItem.price}</span>
                       </div>
                       <button 
                          onClick={handleProcessPayment}
                          className="w-full bg-green-800 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-green-900 active:scale-[0.98] transition-transform"
                       >
                          {t.payNow}
                       </button>
                    </div>
                 </div>
              )}

              {/* Step 3: Processing */}
              {paymentStep === 'processing' && (
                 <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in">
                    <Loader2 className="w-16 h-16 text-green-600 animate-spin mb-4" />
                    <p className="text-gray-600 font-medium">{t.processing}</p>
                    <p className="text-xs text-gray-400 mt-2">Please authorize on your phone</p>
                 </div>
              )}

              {/* Step 4: Success */}
              {paymentStep === 'success' && (
                 <div className="flex flex-col items-center justify-center py-4 text-center animate-in zoom-in">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                       <CheckCircle size={40} />
                    </div>
                    <h4 className="text-xl font-bold text-green-800 mb-2">{t.success}</h4>
                    <p className="text-sm text-gray-500 mb-6">{t.successMsg}</p>
                    
                    <button className="flex items-center justify-center space-x-2 text-yellow-600 bg-yellow-50 px-4 py-2 rounded-lg font-bold text-sm mb-4 w-full">
                       <Star size={16} className="fill-yellow-600" />
                       <span>{t.rateSeller}</span>
                    </button>

                    <button 
                       onClick={() => setShowPaymentModal(false)}
                       className="text-gray-500 text-sm hover:text-gray-800"
                    >
                       {t.close}
                    </button>
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default MarketView;

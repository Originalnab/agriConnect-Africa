import React, { useState } from 'react';
import {
  ShoppingBag,
  Filter,
  MapPin,
  Star,
  Shield,
  Truck,
  MessageCircle,
  Phone,
  Sparkles,
  Wallet,
  CreditCard,
} from 'lucide-react';
import { Language, MarketplaceItem } from '../types';

interface BuyerMarketplaceProps {
  language: Language;
  isOnline: boolean;
}

const copy: Record<Language, { title: string; subtitle: string }> = {
  en: {
    title: 'Marketplace',
    subtitle: 'Verified farmer supply, curated for retail and export buyers.',
  },
  tw: { title: 'Egua', subtitle: 'Hu akuafo supply papa ma won a wope bulk.' },
  ee: { title: 'Asime', subtitle: 'Nya dzifa tso akuafo siwo xo nudu me.' },
  ga: { title: 'Jra', subtitle: 'Fa shika to shia tse akuafo ame nunya.' },
};

const supplierListings: MarketplaceItem[] = [
  {
    id: '1',
    name: 'Premium Maize Bulk',
    price: 245,
    unit: '100kg bag',
    sellerName: 'Kumasi Agro Hub',
    rating: 4.9,
    reviews: 42,
    location: 'Techiman, Ghana',
    category: 'grains',
    isVerified: true,
  },
  {
    id: '2',
    name: 'Organic Pineapples',
    price: 680,
    unit: '100 pieces',
    sellerName: 'Ekuona Farms',
    rating: 4.7,
    reviews: 31,
    location: 'Cape Coast, Ghana',
    category: 'fruits',
    isVerified: true,
  },
  {
    id: '3',
    name: 'Fresh Tomatoes',
    price: 1450,
    unit: 'Large crate',
    sellerName: 'Navrongo Growers',
    rating: 4.5,
    reviews: 18,
    location: 'Navrongo, Ghana',
    category: 'vegetables',
  },
  {
    id: '4',
    name: 'Cassava Chips',
    price: 410,
    unit: '50kg sack',
    sellerName: 'Sunyani Collective',
    rating: 4.4,
    reviews: 12,
    location: 'Sunyani, Ghana',
    category: 'processed',
    isVerified: true,
  },
];

const BuyerMarketplace: React.FC<BuyerMarketplaceProps> = ({ language, isOnline }) => {
  const labels = copy[language] ?? copy.en;
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

  const categories = ['all', 'grains', 'vegetables', 'fruits', 'processed'];

  const filteredListings = supplierListings.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const orderStats = [
    { label: 'Open Orders', value: '08', icon: Truck, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Awaiting Payment', value: '04', icon: Wallet, color: 'bg-amber-50 text-amber-700' },
    { label: 'Messages', value: '12', icon: MessageCircle, color: 'bg-sky-50 text-sky-700' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-emerald-50/40 to-emerald-100/30 pb-24">
      <div className="px-4 py-6 space-y-6">
        <section className="bg-white border border-emerald-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-600 text-xs font-semibold uppercase tracking-[0.2em] mb-2">
                Buyer Workspace
              </p>
              <h1 className="text-2xl font-bold text-stone-900 flex items-center space-x-2">
                <ShoppingBag className="text-emerald-500" size={22} />
                <span>{labels.title}</span>
              </h1>
              <p className="text-sm text-stone-500 mt-2">{labels.subtitle}</p>
            </div>
            {!isOnline && (
              <span className="text-[10px] uppercase font-semibold tracking-wide text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                Offline Mode
              </span>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full border border-stone-200 rounded-2xl py-3 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Search produce, region, supplier..."
                />
                <Filter size={16} className="text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="border border-stone-200 rounded-2xl px-4 text-sm font-semibold text-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map((cat) => (
                  <option value={cat} key={cat}>
                    {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {orderStats.map((stat) => (
                <div
                  key={stat.label}
                  className={`rounded-2xl px-3 py-3 flex flex-col ${stat.color}`}
                >
                  <stat.icon size={16} className="mb-2 opacity-70" />
                  <span className="text-xl font-bold">{stat.value}</span>
                  <span className="text-[11px] uppercase tracking-wide font-semibold mt-1">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold text-emerald-500 tracking-[0.2em]">
                Live supply
              </p>
              <h2 className="text-lg font-semibold text-stone-900">Ready to ship</h2>
            </div>
            <button className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Sparkles size={14} />
              Smart match
            </button>
          </div>

          <div className="space-y-3">
            {filteredListings.map((item) => (
              <article
                key={item.id}
                className="bg-white border border-stone-200 rounded-3xl p-4 shadow-sm hover:border-emerald-200 transition cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                      {item.name}
                      {item.isVerified && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Shield size={10} />
                          Verified
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-stone-500 mt-1 flex items-center gap-1">
                      <MapPin size={14} className="text-emerald-500" />
                      {item.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-stone-900">
                      GHS {item.price}
                      <span className="text-sm text-stone-500 font-medium ml-1">/ {item.unit}</span>
                    </p>
                    <p className="text-xs text-stone-400 uppercase tracking-wide mt-1">
                      {item.category}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 text-xs text-stone-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Star size={12} className="text-amber-500" />
                      {item.rating.toFixed(1)} ({item.reviews})
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-emerald-500" />
                      {item.sellerName}
                    </span>
                  </div>
                  <button className="text-emerald-600 font-semibold flex items-center gap-1">
                    <MessageCircle size={14} />
                    Message
                  </button>
                </div>
              </article>
            ))}

            {!filteredListings.length && (
              <div className="bg-white border border-dashed border-stone-300 rounded-3xl p-6 text-center text-sm text-stone-500">
                No suppliers found. Try another category or keyword.
              </div>
            )}
          </div>
        </section>

        <section className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold text-stone-500 tracking-[0.2em]">
                Quick actions
              </p>
              <h2 className="text-lg font-semibold text-stone-900">Stay on top of negotiations</h2>
            </div>
            {selectedItem && (
              <span className="text-xs font-semibold text-emerald-600">
                Viewing {selectedItem.name}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="border border-stone-200 rounded-2xl p-4 text-left hover:border-emerald-200 transition">
              <p className="text-sm font-semibold text-stone-900">Confirm Purchase</p>
              <p className="text-xs text-stone-500 mt-1">Lock pricing and delivery window</p>
            </button>
            <button className="border border-stone-200 rounded-2xl p-4 text-left hover:border-emerald-200 transition">
              <p className="text-sm font-semibold text-stone-900">Schedule Logistics</p>
              <p className="text-xs text-stone-500 mt-1">Integrated hauling partners</p>
            </button>
            <button className="border border-stone-200 rounded-2xl p-4 text-left hover:border-emerald-200 transition">
              <p className="text-sm font-semibold text-stone-900">Request Samples</p>
              <p className="text-xs text-stone-500 mt-1">Quality assurance support</p>
            </button>
            <button className="border border-stone-200 rounded-2xl p-4 text-left hover:border-emerald-200 transition">
              <p className="text-sm font-semibold text-stone-900">Share Requirements</p>
              <p className="text-xs text-stone-500 mt-1">Auto-match with farmers</p>
            </button>
          </div>

          {selectedItem && (
            <div className="border border-emerald-100 rounded-2xl p-4 bg-emerald-50/60">
              <p className="text-xs uppercase font-semibold text-emerald-600 tracking-[0.2em] mb-2">
                Active conversation
              </p>
              <p className="text-sm text-stone-700">
                Chat with <span className="font-semibold">{selectedItem.sellerName}</span> to confirm
                <span className="font-semibold"> {selectedItem.unit}</span> at{' '}
                <span className="font-semibold">GHS {selectedItem.price}</span>.
              </p>
              <div className="flex items-center gap-3 mt-3">
                <button className="flex-1 bg-emerald-600 text-white rounded-2xl py-2 text-sm font-semibold flex items-center justify-center gap-2">
                  <MessageCircle size={16} />
                  Continue chat
                </button>
                <button className="flex-1 bg-white text-emerald-600 border border-emerald-200 rounded-2xl py-2 text-sm font-semibold flex items-center justify-center gap-2">
                  <CreditCard size={16} />
                  Send offer
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default BuyerMarketplace;

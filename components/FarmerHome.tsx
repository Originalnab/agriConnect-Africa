import React, { useState, useEffect } from 'react';
import { BarChart3, Droplets, AlertCircle, TrendingUp, Calendar, DollarSign, Cloud, Leaf } from 'lucide-react';
import supabaseAuth from '../services/supabaseAuth';

interface FarmData {
    id: string;
    farm_name: string;
    farm_size_hectares: number;
    soil_type: string;
    climate_zone: string;
    phone: string;
    address: string;
}

const FarmerHome: React.FC = () => {
    const [farmData, setFarmData] = useState<FarmData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState<'overview' | 'crops' | 'market' | 'weather'>('overview');

    useEffect(() => {
        const fetchFarmData = async () => {
            try {
                const session = await supabaseAuth.getSession();
                if (!session?.user?.id) {
                    setLoading(false);
                    return;
                }

                const VITE_SUPABASE_URL =
                    ((import.meta as unknown as { env?: { VITE_SUPABASE_URL?: string } }).env
                        ?.VITE_SUPABASE_URL as string | undefined) ?? '';
                const VITE_SUPABASE_ANON_KEY =
                    ((import.meta as unknown as { env?: { VITE_SUPABASE_ANON_KEY?: string } }).env
                        ?.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';
                if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
                    console.error('Supabase environment variables are missing.');
                    setLoading(false);
                    return;
                }
                const response = await fetch(
                    `${VITE_SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.${session.user.id}`,
                    {
                        method: 'GET',
                        headers: {
                            apikey: VITE_SUPABASE_ANON_KEY,
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    }
                );

                if (response.ok) {
                    const data = (await response.json()) as FarmData[];
                    if (Array.isArray(data) && data.length > 0) {
                        setFarmData(data[0]);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch farm data:', error);
            } finally {
                setLoading(false);
            }
        };

        void fetchFarmData();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 py-8">
            <div className="max-w-7xl mx-auto px-4 space-y-8">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-stone-800">Farm Dashboard</h1>
                    <p className="text-stone-600">Welcome back! Here's your farming overview.</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-emerald-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-stone-600 text-sm">Farm Size</p>
                                <p className="text-3xl font-bold text-emerald-600">{farmData?.farm_size_hectares || '--'} ha</p>
                            </div>
                            <Leaf className="w-10 h-10 text-emerald-200" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-stone-600 text-sm">Soil Type</p>
                                <p className="text-lg font-bold text-blue-600">{farmData?.soil_type || 'Not set'}</p>
                            </div>
                            <Droplets className="w-10 h-10 text-blue-200" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-amber-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-stone-600 text-sm">Climate Zone</p>
                                <p className="text-lg font-bold text-amber-600">{farmData?.climate_zone || 'Not set'}</p>
                            </div>
                            <Cloud className="w-10 h-10 text-amber-200" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-stone-600 text-sm">Health Status</p>
                                <p className="text-lg font-bold text-green-600">Good</p>
                            </div>
                            <AlertCircle className="w-10 h-10 text-green-200" />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-stone-200">
                    <button
                        onClick={() => setSelectedTab('overview')}
                        className={`px-4 py-3 font-semibold border-b-2 transition ${selectedTab === 'overview'
                                ? 'border-emerald-600 text-emerald-600'
                                : 'border-transparent text-stone-600 hover:text-stone-800'
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setSelectedTab('crops')}
                        className={`px-4 py-3 font-semibold border-b-2 transition ${selectedTab === 'crops'
                                ? 'border-emerald-600 text-emerald-600'
                                : 'border-transparent text-stone-600 hover:text-stone-800'
                            }`}
                    >
                        Crops
                    </button>
                    <button
                        onClick={() => setSelectedTab('market')}
                        className={`px-4 py-3 font-semibold border-b-2 transition ${selectedTab === 'market'
                                ? 'border-emerald-600 text-emerald-600'
                                : 'border-transparent text-stone-600 hover:text-stone-800'
                            }`}
                    >
                        Market Prices
                    </button>
                    <button
                        onClick={() => setSelectedTab('weather')}
                        className={`px-4 py-3 font-semibold border-b-2 transition ${selectedTab === 'weather'
                                ? 'border-emerald-600 text-emerald-600'
                                : 'border-transparent text-stone-600 hover:text-stone-800'
                            }`}
                    >
                        Weather
                    </button>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    {selectedTab === 'overview' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-stone-800">Farm Overview</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Farm Info Card */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-stone-700">Farm Information</h3>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <p className="text-stone-600">Farm Name</p>
                                            <p className="font-semibold text-stone-800">{farmData?.farm_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-stone-600">Address</p>
                                            <p className="font-semibold text-stone-800">{farmData?.address || 'Not set'}</p>
                                        </div>
                                        <div>
                                            <p className="text-stone-600">Contact</p>
                                            <p className="font-semibold text-stone-800">{farmData?.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-stone-700">Recent Activity</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                                            <span className="text-stone-700">Farm metrics updated</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                            <Calendar className="w-4 h-4 text-blue-600" />
                                            <span className="text-stone-700">Crop planted</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                                            <BarChart3 className="w-4 h-4 text-amber-600" />
                                            <span className="text-stone-700">Market prices updated</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedTab === 'crops' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-stone-800">Your Crops</h2>
                            <div className="text-center py-12">
                                <Leaf className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                                <p className="text-stone-600">No crops planted yet</p>
                                <button className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                                    Add Crop
                                </button>
                            </div>
                        </div>
                    )}

                    {selectedTab === 'market' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-stone-800">Market Prices</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['Maize', 'Rice', 'Cassava', 'Tomato'].map((crop) => (
                                    <div key={crop} className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                                        <div>
                                            <p className="font-semibold text-stone-800">{crop}</p>
                                            <p className="text-sm text-stone-600">Price per unit</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-5 h-5 text-emerald-600" />
                                            <p className="text-xl font-bold text-emerald-600">${Math.floor(Math.random() * 100) + 50}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedTab === 'weather' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-stone-800">Weather Forecast</h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {['Today', 'Tomorrow', 'Day 3', 'Day 4'].map((day, idx) => (
                                    <div key={day} className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 text-center">
                                        <p className="font-semibold text-stone-800">{day}</p>
                                        <Cloud className="w-8 h-8 text-blue-500 mx-auto my-2" />
                                        <p className="text-sm text-stone-600">Partly Cloudy</p>
                                        <p className="text-lg font-bold text-blue-600 mt-2">{25 + idx} C</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* CTA Section */}
                <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-8 text-white shadow-lg">
                    <h2 className="text-2xl font-bold mb-2">Optimize Your Farm</h2>
                    <p className="mb-6 text-emerald-50">Get personalized farming recommendations from our AI assistant</p>
                    <button className="px-6 py-3 bg-white text-emerald-600 font-semibold rounded-lg hover:bg-emerald-50 transition">
                        Ask AgriGuide
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FarmerHome;

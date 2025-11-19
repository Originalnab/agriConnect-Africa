import React, { useEffect, useState } from 'react';
import { MapPin, Phone, Award, ShoppingCart } from 'lucide-react';
import supabaseAuth from '../services/supabaseAuth';
import { supabase } from '../services/supabaseClient';

type OnboardingRole = 'farmer' | 'buyer';

interface FarmerForm {
    name: string;
    phone: string;
    country: string;
    farmName: string;
    address: string;
    gpsLatitude: string;
    gpsLongitude: string;
}

interface BuyerForm {
    name: string;
    phone: string;
    country: string;
    address: string;
    gpsLatitude: string;
    gpsLongitude: string;
}

interface OnboardingPageProps {
    onComplete: () => void;
}

const COUNTRY_OPTIONS = [
    'Ghana',
    'Nigeria',
    'Kenya',
    'Uganda',
    'Tanzania',
    'Rwanda',
    'South Africa',
    'Ethiopia',
    'Côte d\'Ivoire',
    'Senegal',
    'Benin',
    'Togo',
    'Sierra Leone',
    'Liberia',
    'Zambia',
    'Zimbabwe',
];

const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
    const [role, setRole] = useState<OnboardingRole | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [sessionError, setSessionError] = useState<string | null>(null);
    const [activeSession, setActiveSession] = useState<any>(null);

    const [farmerForm, setFarmerForm] = useState<FarmerForm>({
        name: '',
        phone: '',
        country: COUNTRY_OPTIONS[0],
        farmName: '',
        address: '',
        gpsLatitude: '',
        gpsLongitude: '',
    });

    const [buyerForm, setBuyerForm] = useState<BuyerForm>({
        name: '',
        phone: '',
        country: COUNTRY_OPTIONS[0],
        address: '',
        gpsLatitude: '',
        gpsLongitude: '',
    });

    const handleFarmerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFarmerForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleBuyerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setBuyerForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const validateFarmerForm = (): boolean => {
        if (!farmerForm.name.trim()) {
            setError('Name is required');
            return false;
        }
        if (!farmerForm.phone.trim()) {
            setError('Phone number is required');
            return false;
        }
        if (!farmerForm.country) {
            setError('Country is required');
            return false;
        }
        if (!farmerForm.farmName.trim()) {
            setError('Farm name is required');
            return false;
        }
        setError(null);
        return true;
    };

    const validateBuyerForm = (): boolean => {
        if (!buyerForm.name.trim()) {
            setError('Name is required');
            return false;
        }
        if (!buyerForm.phone.trim()) {
            setError('Phone number is required');
            return false;
        }
        if (!buyerForm.country) {
            setError('Country is required');
            return false;
        }
        setError(null);
        return true;
    };

    const handleReturnToLogin = async () => {
        try {
            await supabaseAuth.signOut();
        } catch (err) {
            console.warn('Failed to sign out via supabaseAuth', err);
        }
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.warn('Failed to sign out via supabase client', err);
        }
        // Clear known Supabase local storage keys to avoid stale sessions redirecting back to onboarding.
        try {
            Object.keys(window.localStorage)
                .filter((key) => key.startsWith('sb-'))
                .forEach((key) => window.localStorage.removeItem(key));
        } catch (err) {
            console.warn('Failed to clear cached Supabase session', err);
        }
        window.location.replace('/');
    };

    useEffect(() => {
        const cleanBadOAuthState = () => {
            if (typeof window === 'undefined') return;
            const url = new URL(window.location.href);
            if (url.searchParams.get('error_code') === 'bad_oauth_state') {
                url.searchParams.delete('error');
                url.searchParams.delete('error_code');
                url.searchParams.delete('error_description');
                window.history.replaceState(null, document.title, url.pathname + url.hash);
            }
        };

        const hydrateSession = async () => {
            try {
                let session = await supabaseAuth.getSession();
                if (!session) {
                    const { data } = await supabase.auth.getSession();
                    session = data.session as any;
                }
                if (session && (!session.user || !session.user.id)) {
                    const { data: userData } = await supabase.auth.getUser();
                    if (userData?.user) {
                        session = { ...session, user: userData.user };
                    }
                }
                if (!session?.user?.id) {
                    setSessionError('Your session expired. Please log in again.');
                    setActiveSession(null);
                    return;
                }
                setActiveSession(session);
                setSessionError(null);
            } catch (err) {
                setSessionError('Unable to load your session. Please log in again.');
                setActiveSession(null);
                console.warn('Onboarding session hydrate failed', err);
            }
        };

        cleanBadOAuthState();
        void hydrateSession();
    }, []);

    const ensureSession = async () => {
        if (activeSession?.user?.id) return activeSession;
        try {
            let session = await supabaseAuth.getSession();
            if (!session) {
                const { data } = await supabase.auth.getSession();
                session = data.session as any;
            }
            if (session && (!session.user || !session.user.id)) {
                const { data: userData } = await supabase.auth.getUser();
                if (userData?.user) {
                    session = { ...session, user: userData.user };
                }
            }
            if (!session?.user?.id) {
                throw new Error('Session missing user data.');
            }
            setActiveSession(session);
            setSessionError(null);
            return session;
        } catch (err) {
            setSessionError('Your session expired. Please log in again.');
            throw err;
        }
    };

    const handleFarmerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateFarmerForm()) return;

        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const session = await ensureSession();

            // Save farmer profile to Supabase
            const response = await fetch(
                `${(import.meta as any).env.VITE_SUPABASE_URL}/rest/v1/user_profiles?on_conflict=user_id`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': (import.meta as any).env.VITE_SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${session.access_token}`,
                        Prefer: 'resolution=merge-duplicates',
                    },
                    body: JSON.stringify({
                        user_id: session.user.id,
                        phone: farmerForm.phone,
                        address: farmerForm.address,
                        gps_latitude: farmerForm.gpsLatitude ? parseFloat(farmerForm.gpsLatitude) : null,
                        gps_longitude: farmerForm.gpsLongitude ? parseFloat(farmerForm.gpsLongitude) : null,
                        farm_name: farmerForm.farmName,
                        is_verified: true,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save farmer profile');
            }

            // Update user role to farmer
            const updateResponse = await fetch(
                `${(import.meta as any).env.VITE_SUPABASE_URL}/rest/v1/users?id=eq.${session.user.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': (import.meta as any).env.VITE_SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ user_role: 'farmer' }),
                }
            );

            if (!updateResponse.ok) {
                throw new Error('Failed to update user role');
            }

            setMessage('Welcome, Farmer! Redirecting to home page...');
            setTimeout(() => {
                onComplete();
            }, 1500);
        } catch (err) {
            const friendlyMessage = err instanceof Error ? err.message : 'Session unavailable. Please log in again.';
            setError(friendlyMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleBuyerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateBuyerForm()) return;

        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const session = await ensureSession();

            // Save buyer profile to Supabase
            const response = await fetch(
                `${(import.meta as any).env.VITE_SUPABASE_URL}/rest/v1/user_profiles?on_conflict=user_id`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': (import.meta as any).env.VITE_SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${session.access_token}`,
                        Prefer: 'resolution=merge-duplicates',
                    },
                    body: JSON.stringify({
                        user_id: session.user.id,
                        phone: buyerForm.phone,
                        address: buyerForm.address,
                        gps_latitude: buyerForm.gpsLatitude ? parseFloat(buyerForm.gpsLatitude) : null,
                        gps_longitude: buyerForm.gpsLongitude ? parseFloat(buyerForm.gpsLongitude) : null,
                        is_verified: true,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save buyer profile');
            }

            // Update user role to buyer
            const updateResponse = await fetch(
                `${(import.meta as any).env.VITE_SUPABASE_URL}/rest/v1/users?id=eq.${session.user.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': (import.meta as any).env.VITE_SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ user_role: 'buyer' }),
                }
            );

            if (!updateResponse.ok) {
                throw new Error('Failed to update user role');
            }

            setMessage('Welcome, Buyer! Redirecting to marketplace...');
            setTimeout(() => {
                onComplete();
            }, 1500);
        } catch (err) {
            const friendlyMessage = err instanceof Error ? err.message : 'Session unavailable. Please log in again.';
            setError(friendlyMessage);
        } finally {
            setLoading(false);
        }
    };

    // Role Selection Screen
    if (!role) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-emerald-100 to-white flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-4xl space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-bold text-stone-800">Welcome to AgriConnect Africa</h1>
                        <p className="text-lg text-stone-600">Let's set up your account. How would you like to use AgriConnect?</p>
                    </div>

                    {/* Reset Session / Login */}
                    <div className="flex justify-center">
                        <button
                            type="button"
                            onClick={handleReturnToLogin}
                            className="px-4 py-2 rounded-lg border border-stone-200 text-sm font-semibold text-stone-700 bg-white shadow-sm hover:border-stone-300 hover:text-stone-900 transition"
                        >
                            Return to Login (reset session)
                        </button>
                    </div>

                    {/* Role Selection Cards */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Farmer Card */}
                        <button
                            onClick={() => setRole('farmer')}
                            className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all p-8 text-left hover:scale-105 border-2 border-transparent hover:border-emerald-500"
                        >
                            <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-6 group-hover:bg-emerald-500 transition">
                                <Award className="w-8 h-8 text-emerald-600 group-hover:text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-stone-800 mb-2">I'm a Farmer</h2>
                            <p className="text-stone-600 mb-4">
                                Manage your farm, track crops, get expert advice, and connect with buyers.
                            </p>
                            <ul className="space-y-2 text-sm text-stone-500">
                                <li>✓ Farm management tools</li>
                                <li>✓ Crop tracking & analysis</li>
                                <li>✓ AI farming assistant</li>
                                <li>✓ Direct buyer connections</li>
                            </ul>
                        </button>

                        {/* Buyer Card */}
                        <button
                            onClick={() => setRole('buyer')}
                            className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all p-8 text-left hover:scale-105 border-2 border-transparent hover:border-blue-500"
                        >
                            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6 group-hover:bg-blue-500 transition">
                                <ShoppingCart className="w-8 h-8 text-blue-600 group-hover:text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-stone-800 mb-2">I'm a Buyer</h2>
                            <p className="text-stone-600 mb-4">
                                Browse fresh produce, connect with farmers, and build your supply chain.
                            </p>
                            <ul className="space-y-2 text-sm text-stone-500">
                                <li>✓ Browse marketplace</li>
                                <li>✓ Direct farmer connections</li>
                                <li>✓ Quality assurance</li>
                                <li>✓ Pricing insights</li>
                            </ul>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Farmer Onboarding Form
    if (role === 'farmer') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-emerald-100 to-white flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mx-auto mb-4">
                            <Award className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-stone-800">Farmer Profile</h1>
                        <p className="text-stone-600 mt-2">Let's set up your farming profile</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleFarmerSubmit} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="text-xs font-semibold text-stone-600">Full Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={farmerForm.name}
                                onChange={handleFarmerChange}
                                required
                                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Your full name"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="text-xs font-semibold text-stone-600">Phone Number * <Phone size={12} className="inline" /></label>
                            <input
                                type="tel"
                                name="phone"
                                value={farmerForm.phone}
                                onChange={handleFarmerChange}
                                required
                                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="+1234567890"
                            />
                        </div>

                        {/* Country */}
                        <div>
                            <label className="text-xs font-semibold text-stone-600">Country *</label>
                            <select
                                name="country"
                                value={farmerForm.country}
                                onChange={handleFarmerChange}
                                required
                                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                            >
                                {COUNTRY_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Farm Name */}
                        <div>
                            <label className="text-xs font-semibold text-stone-600">Farm Name *</label>
                            <input
                                type="text"
                                name="farmName"
                                value={farmerForm.farmName}
                                onChange={handleFarmerChange}
                                required
                                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="e.g., Green Valley Farm"
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="text-xs font-semibold text-stone-600">Farm Address</label>
                            <input
                                type="text"
                                name="address"
                                value={farmerForm.address}
                                onChange={handleFarmerChange}
                                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Street address"
                            />
                        </div>

                        {/* GPS Coordinates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-stone-600">Latitude <MapPin size={12} className="inline" /></label>
                                <input
                                    type="number"
                                    name="gpsLatitude"
                                    value={farmerForm.gpsLatitude}
                                    onChange={handleFarmerChange}
                                    step="0.0001"
                                    className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="e.g., 5.6037"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-stone-600">Longitude</label>
                                <input
                                    type="number"
                                    name="gpsLongitude"
                                    value={farmerForm.gpsLongitude}
                                    onChange={handleFarmerChange}
                                    step="0.0001"
                                    className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="e.g., -0.1870"
                                />
                            </div>
                        </div>

                        {/* Messages */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                                {error}
                            </div>
                        )}
                    {sessionError && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 space-y-2">
                            <p>{sessionError}</p>
                            <button
                                type="button"
                                onClick={handleReturnToLogin}
                                className="w-full px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition"
                            >
                                Return to Login
                            </button>
                        </div>
                    )}
                    {message && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600">
                                {message}
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setRole(null)}
                                disabled={loading}
                                className="flex-1 px-4 py-3 border border-stone-200 rounded-xl text-sm font-semibold text-stone-700 hover:border-stone-300 disabled:opacity-60"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {loading ? 'Setting up...' : 'Continue as Farmer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // Buyer Onboarding Form
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-white flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mx-auto mb-4">
                        <ShoppingCart className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-stone-800">Buyer Profile</h1>
                    <p className="text-stone-600 mt-2">Let's set up your buyer account</p>
                </div>

                {/* Form */}
                <form onSubmit={handleBuyerSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-xs font-semibold text-stone-600">Full Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={buyerForm.name}
                            onChange={handleBuyerChange}
                            required
                            className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Your full name"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="text-xs font-semibold text-stone-600">Phone Number * <Phone size={12} className="inline" /></label>
                        <input
                            type="tel"
                            name="phone"
                            value={buyerForm.phone}
                            onChange={handleBuyerChange}
                            required
                            className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="+1234567890"
                        />
                    </div>

                    {/* Country */}
                    <div>
                        <label className="text-xs font-semibold text-stone-600">Country *</label>
                        <select
                            name="country"
                            value={buyerForm.country}
                            onChange={handleBuyerChange}
                            required
                            className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            {COUNTRY_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="text-xs font-semibold text-stone-600">Business Address</label>
                        <input
                            type="text"
                            name="address"
                            value={buyerForm.address}
                            onChange={handleBuyerChange}
                            className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Street address"
                        />
                    </div>

                    {/* GPS Coordinates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-stone-600">Latitude <MapPin size={12} className="inline" /></label>
                            <input
                                type="number"
                                name="gpsLatitude"
                                value={buyerForm.gpsLatitude}
                                onChange={handleBuyerChange}
                                step="0.0001"
                                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., 5.6037"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-stone-600">Longitude</label>
                            <input
                                type="number"
                                name="gpsLongitude"
                                value={buyerForm.gpsLongitude}
                                onChange={handleBuyerChange}
                                step="0.0001"
                                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., -0.1870"
                            />
                        </div>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-600">
                            {message}
                        </div>
                    )}
                    {sessionError && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 space-y-2">
                            <p>{sessionError}</p>
                            <button
                                type="button"
                                onClick={handleReturnToLogin}
                                className="w-full px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition"
                            >
                                Return to Login
                            </button>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setRole(null)}
                            disabled={loading}
                            className="flex-1 px-4 py-3 border border-stone-200 rounded-xl text-sm font-semibold text-stone-700 hover:border-stone-300 disabled:opacity-60"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                        >
                            {loading ? 'Setting up...' : 'Continue as Buyer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OnboardingPage;

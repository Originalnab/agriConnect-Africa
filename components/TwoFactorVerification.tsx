import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { verifyCode, resendVerificationCode, sendVerificationEmail } from '../services/twoFactorAuth';

interface TwoFactorVerificationProps {
    email: string;
    onVerified: () => void;
    onCancel: () => void;
}

const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
    email,
    onVerified,
    onCancel,
}) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [codeExpired, setCodeExpired] = useState(false);
    const [sendingCode, setSendingCode] = useState(true);

    // Send initial verification code
    useEffect(() => {
        const sendCode = async () => {
            const result = await sendVerificationEmail();
            if (result.success) {
                setMessage(result.message);
            } else {
                setError(result.message);
            }
            setSendingCode(false);
        };

        sendCode();
    }, []);

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setCodeExpired(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setLoading(true);

        if (code.length !== 6) {
            setError('Code must be 6 digits');
            setLoading(false);
            return;
        }

        try {
            const result = await verifyCode(code);

            if (result.verified) {
                setMessage('✅ Email verified successfully!');
                setTimeout(() => onVerified(), 1500);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Verification failed. Please try again.');
            console.error('Verification error:', err);
        }

        setLoading(false);
    };

    const handleResend = async () => {
        setLoading(true);
        setError(null);
        setMessage(null);

        const result = await resendVerificationCode();

        if (result.success) {
            setMessage(result.message);
            setTimeLeft(300);
            setCodeExpired(false);
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-emerald-100 to-white flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-emerald-100 border border-emerald-50 p-8 space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <Mail className="w-12 h-12 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-stone-800">Verify Your Email</h1>
                    <p className="text-sm text-stone-500">
                        We've sent a 6-digit code to <span className="font-semibold">{email}</span>
                    </p>
                </div>

                {/* Code Input */}
                <form onSubmit={handleVerify} className="space-y-4">
                    <div>
                        <label className="text-xs text-stone-500 font-semibold">Verification Code</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            className="w-full border border-stone-200 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            disabled={loading || codeExpired || sendingCode}
                        />
                    </div>

                    {/* Timer */}
                    <div className="flex items-center justify-center space-x-2 text-sm">
                        <Clock size={16} className={codeExpired ? 'text-red-500' : 'text-emerald-600'} />
                        <span className={codeExpired ? 'text-red-600 font-semibold' : 'text-stone-600'}>
                            {codeExpired ? 'Code expired' : `Expires in ${formatTime(timeLeft)}`}
                        </span>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="flex items-center space-x-2 px-4 py-2 bg-red-50 border border-red-100 rounded-xl">
                            <AlertCircle size={16} className="text-red-600" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {message && !error && (
                        <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                            <CheckCircle size={16} className="text-emerald-600" />
                            <p className="text-sm text-emerald-600">{message}</p>
                        </div>
                    )}

                    {sendingCode && (
                        <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                            <Clock size={16} className="text-blue-600 animate-spin" />
                            <p className="text-sm text-blue-600">Sending verification code...</p>
                        </div>
                    )}

                    {/* Verify Button */}
                    <button
                        type="submit"
                        disabled={loading || code.length !== 6 || codeExpired || sendingCode}
                        className="w-full bg-emerald-600 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
                    >
                        {loading ? 'Verifying…' : 'Verify Email'}
                    </button>
                </form>

                {/* Resend / Cancel */}
                <div className="flex items-center space-x-3">
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={loading || !codeExpired || sendingCode}
                        className="flex-1 text-sm text-emerald-600 font-semibold hover:text-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        Didn't receive code? Resend
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading || sendingCode}
                        className="flex-1 text-sm text-stone-500 font-semibold hover:text-stone-700 disabled:opacity-60"
                    >
                        Cancel
                    </button>
                </div>

                <p className="text-[11px] text-center text-stone-400">
                    Your code is valid for 5 minutes. Check your spam folder if you don't see the email.
                </p>
            </div>
        </div>
    );
};

export default TwoFactorVerification;

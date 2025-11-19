import supabaseAuth from './supabaseAuth';

export interface TwoFactorSetup {
    email: string;
    codeExpiry: number;
}

interface VerificationResponse {
    success: boolean;
    message: string;
    verified: boolean;
}

// Twilio credentials from environment
const getTwilioCredentials = () => {
    const env = (import.meta as any).env;
    return {
        accountSid: env.VITE_TWILIO_ACCOUNT_SID,
        authToken: env.VITE_TWILIO_AUTH_TOKEN,
    };
};

const TWILIO_VERIFY_SERVICE_SID = 'VA99c91dfb587135d3d343c8a7dce5d8d4';

/**
 * Generate Basic Auth header for Twilio API
 */
const getTwilioAuth = (): string => {
    const { accountSid, authToken } = getTwilioCredentials();
    const credentials = `${accountSid}:${authToken}`;
    const encoded = btoa(credentials);
    return `Basic ${encoded}`;
};/**
 * Send verification code to user's email via Twilio Verify
 */
export const sendVerificationEmail = async (
    email: string
): Promise<{ success: boolean; message: string; sid?: string }> => {
    try {
        // Twilio Verify API endpoint
        const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': getTwilioAuth(),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                To: email,
                Channel: 'email', // Send via email
            }).toString(),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Twilio Verify error:', errorData);
            return {
                success: false,
                message: 'Failed to send verification code. Please try again.',
            };
        }

        const data = await response.json();
        console.log('Verification email sent via Twilio:', data);
        return {
            success: true,
            message: `Verification code sent to ${email}. Check your inbox.`,
            sid: data.sid,
        };
    } catch (error) {
        console.error('Failed to send verification email:', error);
        return {
            success: false,
            message: 'Failed to send verification code. Please try again.',
        };
    }
};

/**
 * Verify the code entered by user via Twilio Verify
 */
export const verifyCode = async (
    email: string,
    enteredCode: string
): Promise<VerificationResponse> => {
    try {
        // Twilio Verify Check API endpoint
        const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': getTwilioAuth(),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                To: email,
                Code: enteredCode,
            }).toString(),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Twilio Verify check error:', errorData);
            return {
                success: false,
                message: 'Failed to verify code. Please try again.',
                verified: false,
            };
        }

        const data = await response.json();
        console.log('Twilio verification response:', data);

        if (data.status === 'approved') {
            return {
                success: true,
                message: 'Email verified successfully!',
                verified: true,
            };
        } else if (data.status === 'pending') {
            return {
                success: false,
                message: 'Invalid verification code. Please try again.',
                verified: false,
            };
        } else {
            return {
                success: false,
                message: 'Verification failed. Please request a new code.',
                verified: false,
            };
        }
    } catch (error) {
        console.error('Failed to verify code:', error);
        return {
            success: false,
            message: 'Verification failed. Please try again.',
            verified: false,
        };
    }
};

/**
 * Resend verification code
 */
export const resendVerificationCode = async (
    email: string
): Promise<{ success: boolean; message: string }> => {
    return sendVerificationEmail(email);
};

/**
 * Enable 2FA for user account in Supabase
 */
export const enable2FA = async (userId: string): Promise<boolean> => {
    try {
        const env = (import.meta as any).env;
        const supabaseUrl = env.VITE_SUPABASE_URL;
        const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

        // Update user's 2FA status in database
        const response = await fetch(
            `${supabaseUrl}/rest/v1/users?id=eq.${userId}`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${supabaseAuth.getSession()?.access_token}`,
                },
                body: JSON.stringify({ two_factor_enabled: true }),
            }
        );

        return response.ok;
    } catch (error) {
        console.error('Failed to enable 2FA:', error);
        return false;
    }
};

/**
 * Check if user has 2FA enabled
 */
export const check2FAEnabled = async (userId: string): Promise<boolean> => {
    try {
        const env = (import.meta as any).env;
        const supabaseUrl = env.VITE_SUPABASE_URL;
        const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(
            `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=two_factor_enabled`,
            {
                method: 'GET',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${supabaseAuth.getSession()?.access_token}`,
                },
            }
        );

        if (!response.ok) return false;

        const data = await response.json();
        return data[0]?.two_factor_enabled || false;
    } catch (error) {
        console.error('Failed to check 2FA status:', error);
        return false;
    }
};

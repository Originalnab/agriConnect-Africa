import { supabase } from './supabaseClient';

export interface VerificationResponse {
    success: boolean;
    message: string;
    verified: boolean;
}

export const sendVerificationEmail = async (): Promise<{ success: boolean; message: string }> => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            success: false,
            message: 'Could not determine user email. Please log in again.',
        };
    }

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email!,
    });

    if (error) {
        return {
            success: false,
            message: error.message,
        };
    }

    return {
        success: true,
        message: `Verification code sent to ${user.email}. Check your inbox.`,
    };
};

export const verifyCode = async (
    enteredCode: string
): Promise<VerificationResponse> => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            success: false,
            message: 'Could not determine user email. Please log in again.',
            verified: false,
        };
    }

    const { error } = await supabase.auth.verifyOtp({
        email: user.email!,
        token: enteredCode,
        type: 'signup',
    });

    if (error) {
        return {
            success: false,
            message: error.message,
            verified: false,
        };
    }

    return {
        success: true,
        message: 'Email verified successfully!',
        verified: true,
    };
};

export const resendVerificationCode = async (): Promise<{ success: boolean; message: string }> => {
    return sendVerificationEmail();
};

export const enable2FA = async (userId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('users')
        .update({ two_factor_enabled: true })
        .eq('id', userId);

    if (error) {
        console.error('Failed to enable 2FA:', error);
        return false;
    }

    return true;
};

export const check2FAEnabled = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
        .from('users')
        .select('two_factor_enabled')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Failed to check 2FA status:', error);
        return false;
    }

    return data?.two_factor_enabled || false;
};

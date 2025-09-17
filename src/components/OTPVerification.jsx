import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const OTPVerification = ({ phoneNumber, onVerificationComplete, onBack }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);
    const [canResend, setCanResend] = useState(false);

    const { signInWithPhone, setupRecaptcha } = useAuth();

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [timeLeft]);

    const handleOtpChange = (index, value) => {
        if (value.length <= 1) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            // Auto-focus next input
            if (value && index < 5) {
                const nextInput = document.getElementById(`otp-${index + 1}`);
                if (nextInput) nextInput.focus();
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // This would typically use the confirmationResult from phone auth
            await onVerificationComplete(otpString);
        } catch (err) {
            setError('Invalid OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            setCanResend(false);
            setTimeLeft(30);
            setError('');

            // Resend OTP logic
            const recaptchaVerifier = setupRecaptcha('recaptcha-container-resend');
            await signInWithPhone(phoneNumber, recaptchaVerifier);
        } catch (err) {
            setError('Failed to resend OTP. Please try again.');
            setCanResend(true);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl">
            <div className="text-center mb-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
                    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Phone</h2>
                <p className="text-gray-600">
                    We've sent a 6-digit code to{' '}
                    <span className="font-medium text-gray-900">{phoneNumber}</span>
                </p>
            </div>

            {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-sm text-center">{error}</p>
                </div>
            )}

            <div className="mb-6">
                <div className="flex justify-center space-x-2">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            maxLength="1"
                        />
                    ))}
                </div>
            </div>

            <button
                onClick={handleVerifyOtp}
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="mt-6 text-center">
                {!canResend ? (
                    <p className="text-sm text-gray-600">
                        Resend code in <span className="font-medium text-indigo-600">{timeLeft}s</span>
                    </p>
                ) : (
                    <button
                        onClick={handleResendOtp}
                        className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                        Resend OTP
                    </button>
                )}
            </div>

            <div id="recaptcha-container-resend"></div>

            <div className="mt-4 text-center">
                <button
                    onClick={onBack}
                    className="text-sm text-gray-600 hover:text-gray-800"
                >
                    ← Change phone number
                </button>
            </div>
        </div>
    );
};

export default OTPVerification;
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    EyeIcon,
    EyeSlashIcon,
    EnvelopeIcon,
    LockClosedIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import PasswordChange from '../components/PasswordChange';
import ForgotPassword from '../components/ForgotPassword';

const AuthPage = () => {
    const navigate = useNavigate();
    const {
        login,
        signup,
        signInWithGoogle,
        signInWithFacebook
    } = useAuth();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Cleanup any global state if needed
    };
  }, []);  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            if (isLoginMode) {
                await login(formData.email, formData.password);
                navigate('/');
            } else {
                if (formData.password !== formData.confirmPassword) {
                    throw new Error('Passwords do not match');
                }
                await signup(formData.email, formData.password);
                setSuccess('Account created successfully! Please check your email for verification.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialAuth = async (provider) => {
        setIsLoading(true);
        setError('');

        try {
            if (provider === 'google') {
                await signInWithGoogle();
            } else if (provider === 'facebook') {
                await signInWithFacebook();
            }
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
            <div className="max-w-md w-full">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-indigo-600 mb-2">TiffinAdmin</h1>
                    <p className="text-gray-600">Manage your tiffin business efficiently</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Toggle between Login/Signup */}
                    <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                        <button
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${isLoginMode
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setIsLoginMode(true)}
                        >
                            Sign In
                        </button>
                        <button
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${!isLoginMode
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setIsLoginMode(false)}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-green-700 text-sm">{success}</p>
                        </div>
                    )}

                    {/* Email Authentication Form */}
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                            {!isLoginMode && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <UserIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="Enter your full name"
                                            required={!isLoginMode}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? (
                                            <EyeSlashIcon className="h-5 w-5" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {!isLoginMode && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <LockClosedIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="Confirm your password"
                                            required={!isLoginMode}
                                        />
                                    </div>
                                </div>
                            )}

                            {isLoginMode && (
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="text-sm text-indigo-600 hover:text-indigo-500"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? 'Processing...' : (isLoginMode ? 'Sign In' : 'Create Account')}
                            </button>
                        </form>
                    )}

                    {/* Phone Authentication Form */}
                    {authMethod === 'phone' && (
                        <form onSubmit={handlePhoneAuth} className="space-y-4">
                            {!showOtpInput ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone Number
                                        </label>
                                        <div className="relative">
                                            <PhoneIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="+919876543210"
                                                required
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Include country code (e.g., +91 for India, +1 for US)
                                        </p>
                                    </div>

                                    <div id="recaptcha-container"></div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isLoading ? 'Sending OTP...' : 'Send OTP'}
                                    </button>
                                </>
                            ) : (
                                <OTPVerification
                                    phoneNumber={formData.phone}
                                    onVerifyOTP={async (otp) => {
                                        try {
                                            setIsLoading(true);
                                            const result = await confirmationResult.confirm(otp);
                                            navigate('/');
                                        } catch (err) {
                                            setError(err.message);
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    }}
                                    onResendOTP={async () => {
                                        try {
                                            const recaptchaVerifier = setupRecaptcha('recaptcha-container');
                                            const result = await signInWithPhone(formData.phone, recaptchaVerifier);
                                            setConfirmationResult(result);
                                            setSuccess('New OTP sent to your phone number');
                                        } catch (err) {
                                            setError(err.message);
                                        }
                                    }}
                                    onBack={() => setShowOtpInput(false)}
                                    isLoading={isLoading}
                                />
                            )}
                        </form>

                    {/* Social Authentication */}
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>
                    </div>

                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleSocialAuth('google')}
                                    disabled={isLoading}
                                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                                        <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span className="ml-2">Google</span>
                                </button>

                                <button
                                    onClick={() => handleSocialAuth('facebook')}
                                    disabled={isLoading}
                                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                                    </svg>
                                    <span className="ml-2">Facebook</span>
                                </button>
                            </div>
                </div>

                {/* Password Change Modal */}
                {showPasswordChange && (
                    <PasswordChange onClose={() => setShowPasswordChange(false)} />
                )}

                {/* Forgot Password Modal */}
                {showForgotPassword && (
                    <ForgotPassword onClose={() => setShowForgotPassword(false)} />
                )}
            </div>
        </div>
    );
};

export default AuthPage;
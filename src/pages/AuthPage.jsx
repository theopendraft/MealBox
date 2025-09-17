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
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import PasswordChange from '../components/PasswordChange';
import ForgotPassword from '../components/ForgotPassword';

const AuthPage = () => {
    const navigate = useNavigate();
    const {
        currentUser,
        login,
        signup,
        signInWithGoogle,
        signInWithFacebook,
        resendVerificationEmail
    } = useAuth();

    const [isLoginMode, setIsLoginMode] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showResendVerification, setShowResendVerification] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: ''
    });

    // Auto-redirect when user is authenticated (handles COOP policy edge cases)
    useEffect(() => {
        if (currentUser) {
            navigate('/dashboard');
        }
    }, [currentUser, navigate]);

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            // Cleanup any global state if needed
        };
    }, []);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            if (isLoginMode) {
                await login(formData.email, formData.password);
                setSuccess('Successfully signed in! Redirecting...');
                setTimeout(() => navigate('/dashboard'), 1000);
            } else {
                if (formData.password !== formData.confirmPassword) {
                    throw new Error('Passwords do not match');
                }
                await signup(formData.email, formData.password);
                setSuccess('Account created successfully! A verification email has been sent to your email address. Please check your inbox (and spam folder) to verify your account.');
                setShowResendVerification(true);
            }
        } catch (err) {
            // Handle specific Firebase errors for better user experience
            let errorMessage = err.message;

            if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'An account with this email already exists. Please try logging in instead.';
            } else if (err.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Please use at least 6 characters with a mix of letters, numbers, and symbols.';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (err.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email address. Please check your email or sign up for a new account.';
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again or reset your password.';
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please wait a moment before trying again.';
            } else if (err.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (err.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialAuth = async (provider) => {
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            if (provider === 'google') {
                await signInWithGoogle();
                setSuccess('Successfully signed in with Google! Redirecting...');
            } else if (provider === 'facebook') {
                await signInWithFacebook();
                setSuccess('Successfully signed in with Facebook! Redirecting...');
            }
            setTimeout(() => navigate('/dashboard'), 1000);
        } catch (err) {
            let errorMessage = err.message;

            if (err.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Sign-in was cancelled. Please try again.';
            } else if (err.code === 'auth/popup-blocked') {
                errorMessage = 'Pop-up was blocked by your browser. Please allow pop-ups and try again.';
            } else if (err.code === 'auth/cancelled-popup-request') {
                errorMessage = 'Only one sign-in request allowed at a time.';
            } else if (err.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (err.message.includes('Cross-Origin-Opener-Policy')) {
                // Handle COOP policy issues gracefully
                errorMessage = 'Authentication completed but with a browser policy warning. You should be signed in successfully.';
                // Still try to navigate as the authentication might have succeeded
                setTimeout(() => navigate('/dashboard'), 2000);
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerification = async () => {
        if (!formData.email || !formData.password) {
            setError('Please enter your email and password to resend verification email.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await resendVerificationEmail(formData.email, formData.password);
            setSuccess('Verification email has been resent! Please check your inbox (and spam folder).');
            setShowResendVerification(false);
        } catch (err) {
            setError('Failed to resend verification email. Please check your credentials and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 animate-fade-in">
                {/* Logo/Brand Section */}
                <div className="text-center">
                    <div className="mx-auto h-20 w-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg transform hover:scale-105 transition-transform duration-300">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        MealBox
                    </h1>
                    <p className="text-gray-600 text-lg">Manage your tiffin business efficiently</p>
                </div>

                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
                    <CardContent className="p-8">
                        {/* Toggle between Login/Signup */}
                        <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
                            <button
                                className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${isLoginMode
                                    ? 'bg-white text-indigo-600 shadow-md transform scale-105'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                onClick={() => setIsLoginMode(true)}
                            >
                                Sign In
                            </button>
                            <button
                                className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${!isLoginMode
                                    ? 'bg-white text-indigo-600 shadow-md transform scale-105'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                onClick={() => setIsLoginMode(false)}
                            >
                                Sign Up
                            </button>
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-slide-down">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-red-700 text-sm font-medium">{error}</p>
                                </div>
                            </div>
                        )}
                        {success && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl animate-slide-down">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-green-700 text-sm font-medium">{success}</p>
                                        {showResendVerification && (
                                            <button
                                                onClick={handleResendVerification}
                                                disabled={isLoading}
                                                className="mt-3 text-sm text-indigo-600 hover:text-indigo-500 underline disabled:opacity-50 font-medium transition-colors"
                                            >
                                                {isLoading ? (
                                                    <span className="flex items-center">
                                                        <LoadingSpinner size="sm" />
                                                        <span className="ml-2">Sending...</span>
                                                    </span>
                                                ) : (
                                                    "Didn't receive the email? Click to resend"
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Email Authentication Form */}
                        <form onSubmit={handleEmailAuth} className="space-y-6">
                            {!isLoginMode && (
                                <div className="transform transition-all duration-300 animate-slide-down">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <div className="relative group">
                                        <UserIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3 transition-colors group-focus-within:text-indigo-500" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-gray-400"
                                            placeholder="Enter your full name"
                                            required={!isLoginMode}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3 transition-colors group-focus-within:text-indigo-500" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-gray-400"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative group">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3 transition-colors group-focus-within:text-indigo-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-gray-400"
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
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
                                <div className="transform transition-all duration-300 animate-slide-down">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative group">
                                        <LockClosedIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3 transition-colors group-focus-within:text-indigo-500" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-gray-400"
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
                                        className="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <LoadingSpinner size="sm" />
                                        <span className="ml-2">Processing...</span>
                                    </span>
                                ) : (
                                    isLoginMode ? 'Sign In' : 'Create Account'
                                )}
                            </button>
                        </form>

                        {/* Social Authentication */}
                        <div className="mt-8">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleSocialAuth('google')}
                                disabled={isLoading}
                                className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-md transform hover:scale-105"
                            >
                                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Google
                            </button>

                            <button
                                onClick={() => handleSocialAuth('facebook')}
                                disabled={isLoading}
                                className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-md transform hover:scale-105"
                            >
                                <svg className="h-5 w-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                                </svg>
                                Facebook
                            </button>
                        </div>
                    </CardContent>
                </Card>

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
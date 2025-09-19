import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    UserCircleIcon,
    EnvelopeIcon,
    PhoneIcon,
    CalendarIcon,
    ShieldCheckIcon,
    KeyIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import PasswordChange from '../components/PasswordChange';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const UserProfile = () => {
    const { currentUser, logout, sendVerificationEmail } = useAuth();
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleSendVerification = async () => {
        if (!currentUser || currentUser.emailVerified) return;

        setIsLoading(true);
        try {
            await sendVerificationEmail();
            setMessage('Verification email sent! Please check your inbox.');
        } catch (error) {
            setMessage('Error sending verification email: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Not available';
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getProviderName = (providerId) => {
        switch (providerId) {
            case 'google.com':
                return 'Google';
            case 'facebook.com':
                return 'Facebook';
            case 'phone':
                return 'Phone';
            case 'password':
                return 'Email/Password';
            default:
                return providerId;
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 animate-fade-in">
            {/* Header Card */}
            <Card className="overflow-hidden mb-8">
                <div className="rounded-md bg-gradient-to-r from-red-600 to-orange-600 px-8 py-12 text-white">
                    <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                        <div className="relative">
                            {currentUser?.photoURL ? (
                                <img
                                    src={currentUser.photoURL}
                                    alt="Profile"
                                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                                />
                            ) : (
                                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                                    <UserCircleIcon className="w-20 h-20 text-white" />
                                </div>
                            )}
                            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                                {currentUser?.emailVerified ? (
                                    <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                                ) : (
                                    <ShieldCheckIcon className="w-6 h-6 text-yellow-500" />
                                )}
                            </div>
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-4xl font-bold mb-2">
                                {currentUser?.displayName || 'User Profile'}
                            </h1>
                            <p className="text-xl text-red-100 mb-4">
                                {currentUser?.email || currentUser?.phoneNumber}
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-2 sm:space-y-0 sm:space-x-6">
                                <div className="flex items-center">
                                    <ShieldCheckIcon className="w-5 h-5 mr-2" />
                                    <span className={`text-sm font-medium ${currentUser?.emailVerified ? 'text-green-200' : 'text-yellow-200'}`}>
                                        {currentUser?.emailVerified ? 'Verified Account' : 'Unverified Account'}
                                    </span>
                                </div>
                                <div className="flex items-center text-red-200">
                                    <CalendarIcon className="w-5 h-5 mr-2" />
                                    <span className="text-sm">
                                        Member since {formatDate(currentUser?.metadata?.creationTime)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col space-y-3">
                            <Button
                                onClick={() => setShowPasswordChange(!showPasswordChange)}
                                variant="outline"
                                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                            >
                                <KeyIcon className="w-4 h-4 mr-2" />
                                Change Password
                            </Button>
                            <Button
                                onClick={handleLogout}
                                variant="outline"
                                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                            >
                                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Message Display */}
            {message && (
                <Card className={`mb-6 border-l-4 ${message.includes('Error')
                    ? 'border-l-red-500 bg-red-50'
                    : 'border-l-green-500 bg-green-50'
                    }`}>
                    <CardContent className="p-4">
                        <p className={`${message.includes('Error') ? 'text-red-700' : 'text-green-700'}`}>
                            {message}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Password Change Modal */}
            {showPasswordChange && (
                <PasswordChange onClose={() => setShowPasswordChange(false)} />
            )}

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Account Information */}
                <Card className="border-l-4 border-l-red-500">
                    <CardHeader>
                        <CardTitle className="text-red-700 flex items-center">
                            <UserCircleIcon className="w-5 h-5 mr-2" />
                            Account Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {currentUser?.email && (
                                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="bg-red-100 p-2 rounded-lg">
                                        <EnvelopeIcon className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-600">Email Address</p>
                                        <p className="text-gray-900 font-medium">{currentUser.email}</p>
                                        <div className="flex items-center mt-1">
                                            {currentUser.emailVerified ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                                    <ShieldCheckIcon className="w-3 h-3 mr-1" />
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                                    ⚠️ Unverified
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentUser?.phoneNumber && (
                                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="bg-green-100 p-2 rounded-lg">
                                        <PhoneIcon className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-600">Phone Number</p>
                                        <p className="text-gray-900 font-medium">{currentUser.phoneNumber}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <div className="bg-orange-100 p-2 rounded-lg">
                                    <CalendarIcon className="w-5 h-5 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-600">Account Created</p>
                                    <p className="text-gray-900 font-medium">{formatDate(currentUser?.metadata?.creationTime)}</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <div className="bg-red-100 p-2 rounded-lg">
                                    <CalendarIcon className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-600">Last Sign In</p>
                                    <p className="text-gray-900 font-medium">{formatDate(currentUser?.metadata?.lastSignInTime)}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Security */}
                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader>
                        <CardTitle className="text-orange-700 flex items-center">
                            <ShieldCheckIcon className="w-5 h-5 mr-2" />
                            Account Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Authentication Providers */}
                            <div className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <p className="text-sm font-semibold text-gray-600 mb-3 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                    Authentication Methods
                                </p>
                                <div className="space-y-2">
                                    {currentUser?.providerData?.map((provider, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <span className="text-gray-900 font-medium">{getProviderName(provider.providerId)}</span>
                                            </div>
                                            <span className="text-xs text-green-600 bg-green-100 px-3 py-1 rounded-full font-medium">
                                                Connected
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Email Verification */}
                            {currentUser?.email && !currentUser?.emailVerified && (
                                <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                                    <div className="flex items-start space-x-3">
                                        <div className="bg-yellow-100 p-2 rounded-lg">
                                            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-yellow-800 mb-2">
                                                Email Verification Required
                                            </p>
                                            <p className="text-sm text-yellow-700 mb-3">
                                                Your email address needs to be verified for security purposes.
                                            </p>
                                            <Button
                                                onClick={handleSendVerification}
                                                disabled={isLoading}
                                                variant="outline"
                                                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                                            >
                                                {isLoading ? 'Sending...' : 'Send Verification Email'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Security Actions */}
                            <div className="space-y-3">
                                {currentUser?.providerData?.some(p => p.providerId === 'password') && (
                                    <button
                                        onClick={() => setShowPasswordChange(!showPasswordChange)}
                                        className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-700 transition-colors group"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-red-100 p-2 rounded-lg group-hover:bg-red-200 transition-colors">
                                                <KeyIcon className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-semibold">Change Password</p>
                                                <p className="text-sm text-red-600">Update your account password</p>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-red-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-700 transition-colors group"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-red-100 p-2 rounded-lg group-hover:bg-red-200 transition-colors">
                                            <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold">Sign Out</p>
                                            <p className="text-sm text-red-600">End your current session</p>
                                        </div>
                                    </div>
                                    <svg className="w-5 h-5 text-red-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};


export default UserProfile;
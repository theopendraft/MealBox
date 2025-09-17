import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';

const PasswordChange = ({ onClose }) => {
    const { changePassword, sendVerificationEmail, currentUser } = useAuth();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords({
            ...showPasswords,
            [field]: !showPasswords[field]
        });
    };

    const validatePassword = (password) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength) {
            return 'Password must be at least 8 characters long';
        }
        if (!hasUpperCase) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!hasLowerCase) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!hasNumbers) {
            return 'Password must contain at least one number';
        }
        if (!hasSpecialChar) {
            return 'Password must contain at least one special character';
        }
        return null;
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        // Validate new password
        const passwordError = validatePassword(formData.newPassword);
        if (passwordError) {
            setError(passwordError);
            setIsLoading(false);
            return;
        }

        // Check if passwords match
        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            await changePassword(formData.newPassword);
            setSuccess('Password changed successfully!');

            // Send verification email if email is not verified
            if (!currentUser.emailVerified) {
                await sendVerificationEmail();
                setSuccess('Password changed successfully! Verification email sent.');
            }

            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const PasswordStrengthIndicator = ({ password }) => {
        const checks = [
            { test: password.length >= 8, label: 'At least 8 characters' },
            { test: /[A-Z]/.test(password), label: 'One uppercase letter' },
            { test: /[a-z]/.test(password), label: 'One lowercase letter' },
            { test: /\d/.test(password), label: 'One number' },
            { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), label: 'One special character' }
        ];

        const passedChecks = checks.filter(check => check.test).length;
        const strength = passedChecks === 0 ? 0 : (passedChecks / checks.length) * 100;

        const getStrengthColor = () => {
            if (strength < 40) return 'bg-red-500';
            if (strength < 80) return 'bg-yellow-500';
            return 'bg-green-500';
        };

        const getStrengthText = () => {
            if (strength < 40) return 'Weak';
            if (strength < 80) return 'Medium';
            return 'Strong';
        };

        return (
            <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">Password Strength</span>
                    <span className={`text-xs font-medium ${strength < 40 ? 'text-red-600' :
                        strength < 80 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                        {getStrengthText()}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${strength}%` }}
                    ></div>
                </div>
                <div className="mt-2 space-y-1">
                    {checks.map((check, index) => (
                        <div key={index} className="flex items-center text-xs">
                            <div className={`w-2 h-2 rounded-full mr-2 ${check.test ? 'bg-green-500' : 'bg-gray-300'
                                }`}></div>
                            <span className={check.test ? 'text-green-600' : 'text-gray-500'}>
                                {check.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="max-w-md w-full animate-scale-in">
                <Card className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-white text-xl font-bold flex items-center">
                                <LockClosedIcon className="w-6 h-6 mr-2" />
                                Change Password
                            </CardTitle>
                            <Button
                                onClick={onClose}
                                variant="ghost"
                                className="text-white hover:bg-white/20 p-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </Button>
                        </div>
                        <p className="text-blue-100 mt-1">
                            Update your account password for better security
                        </p>
                    </CardHeader>

                    <CardContent className="p-6">
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border-l-4 border-l-red-500 rounded-lg">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-red-700 font-medium">{error}</p>
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 p-4 bg-green-50 border-l-4 border-l-green-500 rounded-lg">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-green-700 font-medium">{success}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handlePasswordChange} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                    <input
                                        type={showPasswords.current ? 'text' : 'password'}
                                        name="currentPassword"
                                        value={formData.currentPassword}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Enter current password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('current')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPasswords.current ? (
                                            <EyeSlashIcon className="h-5 w-5" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                    <input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Enter new password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('new')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPasswords.new ? (
                                            <EyeSlashIcon className="h-5 w-5" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                {formData.newPassword && (
                                    <PasswordStrengthIndicator password={formData.newPassword} />
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                    <input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Confirm new password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('confirm')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPasswords.confirm ? (
                                            <EyeSlashIcon className="h-5 w-5" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <Button
                                    type="button"
                                    onClick={onClose}
                                    variant="secondary"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    loading={isLoading}
                                    className="flex-1"
                                >
                                    {isLoading ? 'Changing...' : 'Change Password'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PasswordChange;
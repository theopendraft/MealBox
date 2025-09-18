// src/components/ui/Toast.jsx
import { useState, useEffect } from 'react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const Toast = ({
    type = 'info',
    message,
    isVisible,
    onClose,
    duration = 5000,
    className = ''
}) => {
    useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    const types = {
        success: {
            icon: CheckCircleIcon,
            bgColor: 'bg-orange-50 border-orange-200',
            iconColor: 'text-orange-600',
            textColor: 'text-orange-800'
        },
        error: {
            icon: XCircleIcon,
            bgColor: 'bg-red-50 border-red-200',
            iconColor: 'text-red-600',
            textColor: 'text-red-800'
        },
        warning: {
            icon: ExclamationTriangleIcon,
            bgColor: 'bg-yellow-50 border-yellow-200',
            iconColor: 'text-yellow-600',
            textColor: 'text-yellow-800'
        },
        info: {
            icon: InformationCircleIcon,
            bgColor: 'bg-red-50 border-red-200',
            iconColor: 'text-red-600',
            textColor: 'text-red-800'
        }
    };

    const config = types[type];
    const Icon = config.icon;

    return (
        <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${isVisible
                ? 'translate-x-0 opacity-100 scale-100'
                : 'translate-x-full opacity-0 scale-95 pointer-events-none'
            } ${className}`}>
            <div className={`max-w-sm w-full border rounded-lg shadow-lg p-4 ${config.bgColor}`}>
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <Icon className={`h-5 w-5 ${config.iconColor}`} />
                    </div>
                    <div className="ml-3 flex-1">
                        <p className={`text-sm font-medium ${config.textColor}`}>
                            {message}
                        </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={onClose}
                            className={`rounded-md inline-flex ${config.textColor} hover:bg-opacity-20 hover:bg-current focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-current transition-colors`}
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Toast Context and Hook for managing toasts globally
import { createContext, useContext } from 'react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = (toast) => {
        const id = Date.now();
        setToasts(prev => [...prev, { ...toast, id }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const showSuccess = (message) => addToast({ type: 'success', message });
    const showError = (message) => addToast({ type: 'error', message });
    const showWarning = (message) => addToast({ type: 'warning', message });
    const showInfo = (message) => addToast({ type: 'info', message });

    return (
        <ToastContext.Provider value={{ showSuccess, showError, showWarning, showInfo }}>
            {children}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        {...toast}
                        isVisible={true}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export { Toast };
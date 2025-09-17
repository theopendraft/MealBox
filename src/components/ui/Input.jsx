// src/components/ui/Input.jsx
import { forwardRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

const Input = forwardRef(({
    className = '',
    type = 'text',
    loading = false,
    icon: Icon,
    error,
    ...props
}, ref) => {
    const baseClasses = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200';

    const errorClasses = error
        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500';

    return (
        <div className="relative">
            {Icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon className="h-5 w-5 text-gray-400" />
                </div>
            )}
            <input
                ref={ref}
                type={type}
                className={`${baseClasses} ${errorClasses} ${Icon ? 'pl-10' : ''} ${loading ? 'pr-10' : ''} ${className}`}
                disabled={loading}
                {...props}
            />
            {loading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <LoadingSpinner size="sm" className="text-gray-400" />
                </div>
            )}
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export { Input };
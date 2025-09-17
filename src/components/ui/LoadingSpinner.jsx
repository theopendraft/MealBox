// src/components/ui/LoadingSpinner.jsx
export const LoadingSpinner = ({ size = 'default', className = '' }) => {
    const sizes = {
        sm: 'h-4 w-4',
        default: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12'
    };

    return (
        <div className={`animate-spin ${sizes[size]} ${className}`}>
            <svg fill="none" viewBox="0 0 24 24">
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
        </div>
    );
};

// Loading Skeleton Component
export const LoadingSkeleton = ({ className = '', children, loading = true }) => {
    if (!loading) return children;

    return (
        <div className={`animate-pulse ${className}`}>
            <div className="bg-gray-200 rounded h-4 w-full"></div>
        </div>
    );
};

// Full Page Loading
export const PageLoader = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
            <LoadingSpinner size="xl" className="text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
        </div>
    </div>
);

// Card Loading State
export const CardLoader = () => (
    <div className="animate-pulse bg-white p-6 rounded-xl shadow-md">
        <div className="flex items-center space-x-4 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
        </div>
        <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        </div>
    </div>
);

// Table Loading State
export const TableLoader = ({ rows = 5 }) => (
    <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left">
                        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </th>
                    <th className="px-6 py-3 text-left">
                        <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </th>
                    <th className="px-6 py-3 text-left">
                        <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                    </th>
                    <th className="px-6 py-3 text-left">
                        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </th>
                    <th className="px-6 py-3"></th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(rows)].map((_, index) => (
                    <tr key={index} className="animate-pulse">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                                <div>
                                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded w-28"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex space-x-2 justify-end">
                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// Form Field Loading State
export const FormFieldLoader = () => (
    <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>
);
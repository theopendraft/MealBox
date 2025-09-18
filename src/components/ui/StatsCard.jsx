// src/components/ui/StatsCard.jsx
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { Card } from './Card';

export const StatsCard = ({
    title,
    value,
    change,
    changeType = 'positive',
    icon: Icon,
    variant = 'default',
    subtitle,
    loading = false
}) => {
    if (loading) {
        return (
            <Card className="animate-pulse p-4 sm:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="h-3 sm:h-4 bg-gray-200 rounded w-16 sm:w-20 mb-2 sm:mb-3"></div>
                        <div className="h-6 sm:h-8 bg-gray-200 rounded w-12 sm:w-16 mb-1 sm:mb-2"></div>
                        <div className="h-2 sm:h-3 bg-gray-200 rounded w-10 sm:w-12"></div>
                    </div>
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-200 rounded-xl"></div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100 bg-white">
            <div className="p-4 sm:p-6">
                <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row space-y-3 sm:space-y-0">
                    <div className="flex-1 w-full">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <h3 className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">
                                {title}
                            </h3>
                            {Icon && (
                                <div className={`
                                    p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-colors duration-200
                                    ${variant === 'primary'
                                        ? 'bg-red-50 text-red-600 group-hover:bg-red-100'
                                        : 'bg-gray-50 text-gray-600 group-hover:bg-gray-100'
                                    }
                                `}>
                                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <p className={`text-2xl sm:text-3xl font-bold transition-colors duration-200 ${variant === 'primary'
                                ? 'text-gray-900 group-hover:text-red-600'
                                : 'text-gray-900'
                                }`}>
                                {value}
                            </p>

                            {subtitle && (
                                <p className="text-xs sm:text-sm text-gray-500 font-medium">
                                    {subtitle}
                                </p>
                            )}

                            {change && (
                                <div className={`flex items-center text-xs sm:text-sm font-medium ${changeType === 'positive'
                                    ? 'text-emerald-600'
                                    : 'text-red-500'
                                    }`}>
                                    {changeType === 'positive' ? (
                                        <ArrowUpIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    ) : (
                                        <ArrowDownIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    )}
                                    <span>{change}</span>
                                    <span className="text-gray-400 ml-1 hidden sm:inline">from last month</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtle bottom accent */}
            <div className={`h-1 w-full transition-all duration-300 ${variant === 'primary'
                ? 'bg-gradient-to-r from-red-500 to-orange-500'
                : 'bg-gradient-to-r from-gray-200 to-gray-300 group-hover:from-red-500 group-hover:to-orange-500'
                }`}></div>
        </Card>
    );
};
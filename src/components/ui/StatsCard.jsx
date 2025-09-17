// src/components/ui/StatsCard.jsx
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { Card } from './Card';

export const StatsCard = ({
    title,
    value,
    change,
    changeType = 'positive',
    icon: Icon,
    color = 'indigo',
    subtitle,
    loading = false
}) => {
    const colorClasses = {
        indigo: 'from-indigo-500 to-indigo-600 text-indigo-100',
        green: 'from-green-500 to-green-600 text-green-100',
        blue: 'from-blue-500 to-blue-600 text-blue-100',
        purple: 'from-purple-500 to-purple-600 text-purple-100',
        orange: 'from-orange-500 to-orange-600 text-orange-100',
        red: 'from-red-500 to-red-600 text-red-100'
    };

    const iconColorClasses = {
        indigo: 'text-indigo-200',
        green: 'text-green-200',
        blue: 'text-blue-200',
        purple: 'text-purple-200',
        orange: 'text-orange-200',
        red: 'text-red-200'
    };

    if (loading) {
        return (
            <Card className="animate-pulse">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                </div>
            </Card>
        );
    }

    return (
        <Card
            hover
            className={`bg-gradient-to-r ${colorClasses[color]} text-white overflow-hidden relative`}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[length:20px_20px]"></div>

            <div className="relative flex items-center justify-between">
                <div className="flex-1">
                    <h3 className={`text-sm font-medium ${colorClasses[color].split(' ')[2]} opacity-90`}>
                        {title}
                    </h3>
                    <p className="text-2xl font-bold text-white mt-1">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-white/70 mt-1">
                            {subtitle}
                        </p>
                    )}
                    {change && (
                        <div className={`flex items-center text-xs mt-1 ${changeType === 'positive' ? 'text-white/80' : 'text-white/80'
                            }`}>
                            {changeType === 'positive' ? (
                                <ArrowUpIcon className="h-3 w-3 mr-1" />
                            ) : (
                                <ArrowDownIcon className="h-3 w-3 mr-1" />
                            )}
                            <span>{change}</span>
                        </div>
                    )}
                </div>

                {Icon && (
                    <div className="ml-4">
                        <Icon className={`h-8 w-8 ${iconColorClasses[color]}`} />
                    </div>
                )}
            </div>
        </Card>
    );
};
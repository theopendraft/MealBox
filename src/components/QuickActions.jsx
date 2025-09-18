// src/components/QuickActions.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import AddClientModal from './AddClientModal';
import {
    UserPlusIcon,
    ClockIcon,
    TruckIcon,
    CurrencyRupeeIcon,
    UsersIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

export default function QuickActions() {
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('subscribed');

    const handleAddClient = (mode) => {
        setModalMode(mode);
        setIsAddClientModalOpen(true);
    };

    const quickActions = [
        {
            title: 'Add Subscription',
            description: 'New recurring customer',
            icon: UserPlusIcon,
            action: () => handleAddClient('subscribed'),
            primary: true
        },
        {
            title: 'Quick Order',
            description: 'One-time delivery',
            icon: ClockIcon,
            action: () => handleAddClient('ondemand')
        },
        {
            title: 'Today\'s Deliveries',
            description: 'View delivery schedule',
            icon: TruckIcon,
            link: '/deliveries'
        },
        {
            title: 'Generate Bills',
            description: 'Create customer bills',
            icon: CurrencyRupeeIcon,
            link: '/billing'
        },
        {
            title: 'All Customers',
            description: 'Manage database',
            icon: UsersIcon,
            link: '/clients'
        },
        {
            title: 'Analytics',
            description: 'View reports',
            icon: ChartBarIcon,
            link: '/billing'
        }
    ];

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {quickActions.map((action, index) => {
                    const ActionComponent = action.link ? Link : 'button';
                    const actionProps = action.link
                        ? { to: action.link }
                        : { onClick: action.action };

                    return (
                        <ActionComponent
                            key={index}
                            {...actionProps}
                            className={`
                                group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 
                                transition-all duration-200 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5
                                ${action.primary ? 'ring-2 ring-red-500/20 border-red-200 bg-red-50/30' : ''}
                                ${action.link ? '' : 'w-full text-left'}
                            `}
                        >
                            {/* Background accent for primary action */}
                            {action.primary && (
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5"></div>
                            )}

                            <div className="relative">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`
                                        p-3 rounded-xl transition-colors duration-200
                                        ${action.primary
                                            ? 'bg-red-100 text-red-600 group-hover:bg-red-200'
                                            : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                        }
                                    `}>
                                        <action.icon className="h-6 w-6" />
                                    </div>

                                    {action.primary && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            Popular
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <h3 className={`font-semibold transition-colors duration-200 ${action.primary
                                            ? 'text-gray-900 group-hover:text-red-700'
                                            : 'text-gray-900 group-hover:text-gray-700'
                                        }`}>
                                        {action.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        {action.description}
                                    </p>
                                </div>

                                {/* Hover arrow indicator */}
                                <div className="mt-4 flex items-center justify-between">
                                    <div className={`
                                        w-0 h-0.5 transition-all duration-200 group-hover:w-8
                                        ${action.primary ? 'bg-red-500' : 'bg-gray-400'}
                                    `}></div>
                                    <svg
                                        className={`
                                            h-5 w-5 transition-all duration-200 transform translate-x-1 opacity-0 
                                            group-hover:translate-x-0 group-hover:opacity-100
                                            ${action.primary ? 'text-red-500' : 'text-gray-400'}
                                        `}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </ActionComponent>
                    );
                })}
            </div>

            {/* Add Client Modal */}
            {isAddClientModalOpen && (
                <AddClientModal
                    isOpen={isAddClientModalOpen}
                    onClose={() => setIsAddClientModalOpen(false)}
                    onSuccess={() => {
                        setIsAddClientModalOpen(false);
                        // Could add a success notification here
                    }}
                    mode={modalMode}
                />
            )}
        </>
    );
}
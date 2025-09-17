// src/components/QuickActions.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import AddClientModal from './AddClientModal';

export default function QuickActions() {
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('subscribed');

    const handleAddClient = (mode) => {
        setModalMode(mode);
        setIsAddClientModalOpen(true);
    };

    const quickActions = [
        {
            title: 'Add Subscription Client',
            description: 'Add a new recurring customer',
            icon: '👥',
            color: 'bg-green-500 hover:bg-green-600',
            action: () => handleAddClient('subscribed')
        },
        {
            title: 'Add On-Demand Client',
            description: 'Add a one-time order customer',
            icon: '🍱',
            color: 'bg-blue-500 hover:bg-blue-600',
            action: () => handleAddClient('ondemand')
        },
        {
            title: 'View Today\'s Deliveries',
            description: 'Check today\'s delivery schedule',
            icon: '🚚',
            color: 'bg-purple-500 hover:bg-purple-600',
            link: '/deliveries'
        },
        {
            title: 'Generate Bills',
            description: 'Create bills for customers',
            icon: '💰',
            color: 'bg-yellow-500 hover:bg-yellow-600',
            link: '/billing'
        },
        {
            title: 'View All Clients',
            description: 'Manage customer database',
            icon: '📋',
            color: 'bg-indigo-500 hover:bg-indigo-600',
            link: '/clients'
        },
        {
            title: 'Analytics',
            description: 'View detailed reports',
            icon: '📊',
            color: 'bg-pink-500 hover:bg-pink-600',
            link: '/billing' // Could be a future analytics page
        }
    ];

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {quickActions.map((action, index) => (
                    <div key={index}>
                        {action.link ? (
                            <Link
                                to={action.link}
                                className={`${action.color} text-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 block`}
                            >
                                <div className="flex items-center mb-2">
                                    <span className="text-2xl mr-3">{action.icon}</span>
                                    <h3 className="font-semibold text-sm">{action.title}</h3>
                                </div>
                                <p className="text-xs opacity-90">{action.description}</p>
                            </Link>
                        ) : (
                            <button
                                onClick={action.action}
                                className={`${action.color} text-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 w-full text-left`}
                            >
                                <div className="flex items-center mb-2">
                                    <span className="text-2xl mr-3">{action.icon}</span>
                                    <h3 className="font-semibold text-sm">{action.title}</h3>
                                </div>
                                <p className="text-xs opacity-90">{action.description}</p>
                            </button>
                        )}
                    </div>
                ))}
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
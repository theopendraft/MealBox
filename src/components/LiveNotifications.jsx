import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { BellIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const LiveNotifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    // Set up real-time listeners for different events
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Listen for new bills
    const billsUnsubscribe = onSnapshot(
      query(
        collection(db, 'bills'),
        where('createdAt', '>=', today),
        orderBy('createdAt', 'desc'),
        limit(10)
      ),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const bill = change.doc.data();
            addNotification({
              id: `bill-${change.doc.id}`,
              type: 'success',
              title: 'New Bill Generated',
              message: `Bill for ${bill.clientName || 'Client'} - ₹${bill.totalAmount}`,
              timestamp: new Date(),
              action: 'View Bill'
            });
          }
        });
      }
    );

    // Listen for new clients
    const clientsUnsubscribe = onSnapshot(
      query(
        collection(db, 'clients'),
        where('createdAt', '>=', today),
        orderBy('createdAt', 'desc'),
        limit(5)
      ),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const client = change.doc.data();
            addNotification({
              id: `client-${change.doc.id}`,
              type: 'info',
              title: 'New Client Registered',
              message: `${client.name} joined as ${client.clientType} client`,
              timestamp: new Date(),
              action: 'View Client'
            });
          }
        });
      }
    );

    // Simulate notifications after a short delay
    // const timer = setTimeout(simulateNotifications, 2000);

    return () => {
      billsUnsubscribe();
      clientsUnsubscribe();
      // clearTimeout(timer);
    };
  }, [currentUser]);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 10));
    setUnreadCount(prev => prev + 1);

    // Auto-remove notification after 30 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 30000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return CheckCircleIcon;
      case 'warning':
        return ExclamationCircleIcon;
      case 'info':
        return InformationCircleIcon;
      default:
        return InformationCircleIcon;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = Math.floor((now - timestamp) / 1000); // difference in seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => {
          setShowNotifications(!showNotifications);
          if (!showNotifications) markAllAsRead();
        }}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${getNotificationColor(notification.type)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm text-gray-800 truncate">
                            {notification.title}
                          </p>
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="text-gray-400 hover:text-gray-600 ml-2"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                          {notification.action && (
                            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                              {notification.action}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-500">
                <BellIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs mt-1">New updates will appear here</p>
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setNotifications([])}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-800"
              >
                Clear All Notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};

export default LiveNotifications;
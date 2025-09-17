// src/components/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  TruckIcon,
  CurrencyRupeeIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  UsersIcon as UsersIconSolid,
  TruckIcon as TruckIconSolid,
  CurrencyRupeeIcon as CurrencyRupeeIconSolid,
  UserIcon as UserIconSolid,
  CogIcon as CogIconSolid
} from '@heroicons/react/24/solid';

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { currentUser, logout } = useAuth();

  const navLinks = [
    {
      name: 'Dashboard',
      path: '/',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      description: 'Overview & quick stats'
    },
    {
      name: 'Analytics',
      path: '/dashboard/analytics',
      icon: ChartBarIcon,
      iconSolid: ChartBarIconSolid,
      description: 'Business insights'
    },
    {
      name: 'Clients',
      path: '/clients',
      icon: UsersIcon,
      iconSolid: UsersIconSolid,
      description: 'Manage customers'
    },
    {
      name: 'Daily Deliveries',
      path: '/deliveries',
      icon: TruckIcon,
      iconSolid: TruckIconSolid,
      description: 'Today\'s deliveries'
    },
    {
      name: 'Billing',
      path: '/billing',
      icon: CurrencyRupeeIcon,
      iconSolid: CurrencyRupeeIconSolid,
      description: 'Invoices & payments'
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: UserIcon,
      iconSolid: UserIconSolid,
      description: 'Account settings'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 
        text-white z-30 transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0
        shadow-2xl border-r border-gray-700
      `}>

        {/* Header Section */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                MealBox
              </h2>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-700 transition-colors duration-200"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center space-x-3 flex-1">
                    {isActive ? (
                      <link.iconSolid className="h-5 w-5 text-white" />
                    ) : (
                      <link.icon className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors duration-200" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{link.name}</div>
                      <div className={`text-xs transition-colors duration-200 ${isActive ? 'text-indigo-100' : 'text-gray-500 group-hover:text-gray-300'
                        }`}>
                        {link.description}
                      </div>
                    </div>
                  </div>
                  <ChevronRightIcon className={`h-4 w-4 transition-all duration-200 ${isActive ? 'text-white opacity-100' : 'text-gray-500 opacity-0 group-hover:opacity-100'
                    }`} />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-800/50 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {currentUser?.displayName || currentUser?.email || 'User'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {currentUser?.email}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <NavLink
              to="/profile"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
            >
              <CogIcon className="h-4 w-4" />
              <span>Settings</span>
            </NavLink>

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-200 group"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
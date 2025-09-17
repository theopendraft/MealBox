// src/components/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LiveNotifications from './LiveNotifications';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  UserIcon,
  ChevronDownIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  ChevronRightIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

export default function Navbar({ setSidebarOpen }) {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Breadcrumb generation
  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Dashboard', path: '/', icon: HomeIcon }];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      let name = segment.charAt(0).toUpperCase() + segment.slice(1);

      // Custom naming for specific routes
      if (segment === 'dashboard' && pathSegments[index + 1] === 'analytics') return;
      if (segment === 'analytics') name = 'Analytics';
      if (segment === 'clients') name = 'Clients';
      if (segment === 'deliveries') name = 'Daily Deliveries';
      if (segment === 'billing') name = 'Billing';
      if (segment === 'profile') name = 'Profile';

      breadcrumbs.push({ name, path: currentPath });
    });

    return breadcrumbs;
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUserDropdownOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className={`backdrop-blur-md border-b shadow-sm sticky top-0 z-10 transition-colors duration-300 ${isDark
        ? 'bg-gray-900/80 border-gray-700'
        : 'bg-white/80 border-gray-200'
      }`}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
          >
            <Bars3Icon className="h-6 w-6 text-gray-600 group-hover:text-gray-900" />
          </button>

          {/* Breadcrumbs */}
          <nav className="hidden md:flex items-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center">
                {index > 0 && (
                  <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
                )}
                <Link
                  to={crumb.path}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors duration-200 ${index === breadcrumbs.length - 1
                    ? 'text-indigo-600 bg-indigo-50 font-medium'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                >
                  {crumb.icon && <crumb.icon className="h-4 w-4" />}
                  <span>{crumb.name}</span>
                </Link>
              </div>
            ))}
          </nav>
        </div>

        {/* Center Section - Search */}
        <div className="hidden lg:flex flex-1 max-w-lg mx-8">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search clients, deliveries, bills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 transition-all duration-200 hover:bg-white focus:bg-white"
            />
            {searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                <div className="p-3 text-sm text-gray-500">
                  Search functionality coming soon...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          {/* <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <SunIcon className="h-5 w-5 text-gray-600 group-hover:text-yellow-500 transition-colors duration-200" />
            ) : (
              <MoonIcon className="h-5 w-5 text-gray-600 group-hover:text-indigo-600 transition-colors duration-200" />
            )}
          </button> */}

          {/* Notifications */}
          <div className="relative">
            <LiveNotifications />
          </div>

          {/* Mobile Search */}
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-600" />
          </button>

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-gray-900">
                  {currentUser?.displayName || 'User'}
                </div>
                <div className="text-xs text-gray-500">
                  {currentUser?.email}
                </div>
              </div>
              <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''
                }`} />
            </button>

            {/* Dropdown Menu */}
            <div className={`absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 transform transition-all duration-200 origin-top-right ${userDropdownOpen
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              }`}>
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {currentUser?.displayName || currentUser?.email}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {currentUser?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <Link
                  to="/profile"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>View Profile</span>
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  <CogIcon className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 py-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 group"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
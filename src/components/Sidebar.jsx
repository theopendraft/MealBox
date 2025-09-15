// src/components/Sidebar.jsx
import { NavLink } from 'react-router-dom';

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const navLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'Clients', path: '/clients' },
    { name: 'Daily Deliveries', path: '/deliveries' },
    { name: 'Billing', path: '/billing' },
    // Add new links here in the future
  ];

  return (
    <>
      {/* Sidebar for mobile */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)}></div>
      <div className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white p-4 z-30 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out`}>
        <h2 className="text-2xl font-bold mb-8">MealBox</h2>
        <nav>
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}
// src/components/BottomNavBar.jsx
import { NavLink } from 'react-router-dom';

const LEFT_ITEMS  = [
  { path: '/kitchen',    label: 'Kitchen',   emoji: '🍳' },
  { path: '/deliveries', label: 'Delivery',  emoji: '🚚' },
];
const RIGHT_ITEMS = [
  { path: '/clients',  label: 'Customers', emoji: '👥' },
  { path: '/billing',  label: 'Billing',   emoji: '₹'  },
];

const NavItem = ({ item }) => (
  <NavLink
    to={item.path}
    className={({ isActive }) =>
      `flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors active:scale-95 ${
        isActive ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'
      }`
    }
  >
    <span className="text-xl leading-none">{item.emoji}</span>
    <span className="font-medium">{item.label}</span>
  </NavLink>
);

export default function BottomNavBar({ onFabPress }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200/60 md:hidden z-30 safe-area-pb">
      {/* FAB — centered, elevated above nav */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2">
        <button
          onClick={onFabPress}
          className="w-14 h-14 rounded-full bg-red-600 text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform duration-150 focus:outline-none"
          aria-label="Add new client"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Nav items: 2 | spacer-for-FAB | 2 */}
      <div className="flex h-16">
        {LEFT_ITEMS.map(item => <NavItem key={item.path} item={item} />)}

        {/* spacer that sits under the FAB */}
        <div className="w-20 flex-shrink-0" />

        {RIGHT_ITEMS.map(item => <NavItem key={item.path} item={item} />)}
      </div>
    </nav>
  );
}

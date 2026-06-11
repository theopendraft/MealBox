// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collectionGroup, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings';

// ── helpers ───────────────────────────────────────────────────
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
};
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};
const fullDate = () =>
  new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
const timeAgo = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};
const fmt = (n) => `₹${Number(n||0).toLocaleString('en-IN')}`;

// ── quick nav tiles ────────────────────────────────────────────
const NAV = [
  { label:'Kitchen',   hint:'Pack today\'s tiffins',   icon:'🍳', to:'/kitchen',  bg:'bg-orange-50', border:'border-orange-100' },
  { label:'Delivery',  hint:'Mark deliveries done',    icon:'🚚', to:'/delivery', bg:'bg-sky-50',    border:'border-sky-100'    },
  { label:'Customers', hint:'Add & manage clients',    icon:'👥', to:'/clients',  bg:'bg-emerald-50',border:'border-emerald-100'},
  { label:'Billing',   hint:'Generate & collect',      icon:'₹',  to:'/billing',  bg:'bg-violet-50', border:'border-violet-100' },
];

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { settings }    = useSettings();

  const [stats,         setStats]         = useState(null);
  const [recentClients, setRecentClients] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const today = todayStr();
      const month = currentMonth();

      try {
        const [recordsSnap, clientsSnap, allCyclesSnap] = await Promise.all([
          // today's daily records
          getDocs(query(
            collectionGroup(db, 'dailyRecords'),
            where('ownerId', '==', currentUser.uid),
            where('date', '==', today)
          )),
          // all clients (to split active count)
          getDocs(query(
            collection(db, 'clients'),
            where('ownerId', '==', currentUser.uid)
          )),
          // ALL cycles across all months (for accurate outstanding)
          getDocs(query(
            collectionGroup(db, 'cycles'),
            where('ownerId', '==', currentUser.uid)
          )),
        ]);

        const cycles = allCyclesSnap.docs.map(d => d.data());

        // Outstanding = every unpaid cycle regardless of month
        const outstanding = cycles
          .filter(c => c.status === 'open' || c.status === 'settled')
          .reduce((s, c) => s + (c.totalAmount || 0), 0);

        // Collected = paid cycles this month only
        const collectedThisMonth = cycles
          .filter(c => c.status === 'paid' && c.month === month)
          .reduce((s, c) => s + (c.totalAmount || 0), 0);

        const clients = clientsSnap.docs.map(d => d.data());
        const activeCount = clients.filter(c => c.status === 'active').length;

        const todayTiffins = recordsSnap.docs
          .map(d => d.data())
          .filter(r => r.status !== 'skipped').length;

        if (!cancelled) {
          setStats({ todayTiffins, activeCount, outstanding, collectedThisMonth });
        }

        // 3 most recently added clients
        const recentSnap = await getDocs(query(
          collection(db, 'clients'),
          where('ownerId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        ));
        if (!cancelled) {
          setRecentClients(recentSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentUser]);

  const ownerFirst = settings.ownerName?.split(' ')[0] || '';

  return (
    <div className="space-y-5 pb-6 max-w-2xl mx-auto">

      {/* ── Hero greeting ── */}
      <div className="bg-gradient-to-br from-red-600 to-orange-500 rounded-3xl px-6 py-5 text-white shadow-sm">
        <p className="text-red-100 text-sm font-medium">{fullDate()}</p>
        <h1 className="text-2xl font-bold mt-1">
          {greeting()}{ownerFirst ? `, ${ownerFirst}` : ''} 👋
        </h1>
        <p className="text-red-100 text-sm mt-0.5">
          {settings.businessName || 'MealBox Tiffin'}
        </p>
        <Link
          to="/dashboard/analytics"
          className="inline-flex items-center gap-1.5 mt-4 bg-white/20 hover:bg-white/30 active:scale-95 transition-all text-white text-xs font-semibold px-3.5 py-2 rounded-xl"
        >
          📊 View Analytics →
        </Link>
      </div>

      {/* ── Stat cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl ring-1 ring-black/[0.04] p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            emoji="🍱"
            label="Today's Tiffins"
            value={stats?.todayTiffins ?? 0}
            sub={stats?.todayTiffins === 0 ? 'None scheduled' : 'to pack & deliver'}
          />
          <StatCard
            emoji="👥"
            label="Active Clients"
            value={stats?.activeCount ?? 0}
            sub="subscribers"
          />
          <StatCard
            emoji="⏳"
            label="Outstanding"
            value={fmt(stats?.outstanding)}
            sub="across all months"
            valueClass={stats?.outstanding > 0 ? 'text-orange-600' : 'text-gray-900'}
          />
          <StatCard
            emoji="✅"
            label="Collected"
            value={fmt(stats?.collectedThisMonth)}
            sub="this month"
            valueClass="text-emerald-600"
          />
        </div>
      )}

      {/* ── Quick nav ── */}
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Quick Access</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {NAV.map(n => (
            <Link
              key={n.to}
              to={n.to}
              className={`${n.bg} border ${n.border} rounded-2xl p-4 flex flex-col gap-2.5 hover:shadow-sm active:scale-[0.97] transition-all duration-150`}
            >
              <span className="text-2xl leading-none">{n.icon}</span>
              <div>
                <div className="text-sm font-bold text-gray-900">{n.label}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-snug">{n.hint}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent clients ── */}
      {recentClients.length > 0 && (
        <div className="bg-white rounded-2xl ring-1 ring-black/[0.04] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Recently Added</p>
            <Link to="/clients" className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors">
              All clients →
            </Link>
          </div>
          {recentClients.map((c, i) => (
            <Link
              key={c.id}
              to={`/clients/${c.id}`}
              className={`flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                i < recentClients.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                {c.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                <p className="text-xs text-gray-400">
                  {c.customerType === 'ondemand' ? 'One-time' : 'Subscription'}
                  {c.planType ? ` · ${c.planType}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}

function StatCard({ emoji, label, value, sub, valueClass = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-black/[0.04] shadow-sm px-4 py-4">
      <div className="text-xl leading-none mb-2.5">{emoji}</div>
      <div className={`text-xl font-bold leading-tight ${valueClass}`}>{value}</div>
      <div className="text-[11px] font-semibold text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

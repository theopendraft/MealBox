// src/pages/AnalyticsPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collectionGroup, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie,
} from 'recharts';

// ── helpers ───────────────────────────────────────────────────
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const last6Months = () => {
  const months = [];
  const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const t = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push(`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}`);
  }
  return months;
};

const monthLabel = (m) => {
  const [, mo] = m.split('-');
  return MONTH_SHORT[parseInt(mo)-1];
};

const fmt = (n) => `₹${Number(n||0).toLocaleString('en-IN')}`;

// ── custom tooltip ─────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white ring-1 ring-black/[0.08] shadow-lg rounded-xl px-3 py-2.5 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: { color } } = payload[0];
  return (
    <div className="bg-white ring-1 ring-black/[0.08] shadow-lg rounded-xl px-3 py-2 text-xs font-semibold" style={{ color }}>
      {name}: {value}
    </div>
  );
};

// ── section label ──────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">{children}</p>
);

export default function AnalyticsPage() {
  const { currentUser } = useAuth();

  const [revenue,  setRevenue]  = useState([]);   // per-month {month, collected, outstanding}
  const [clients,  setClients]  = useState(null);  // { active, paused, inactive, subscribed, ondemand }
  const [plans,    setPlans]    = useState([]);    // [{name, value, color}]
  const [totals,   setTotals]   = useState(null);  // { allCollected, allOutstanding, totalDeliveries }
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [cyclesSnap, clientsSnap, recordsSnap] = await Promise.all([
          getDocs(query(
            collectionGroup(db, 'cycles'),
            where('ownerId', '==', currentUser.uid)
          )),
          getDocs(query(
            collection(db, 'clients'),
            where('ownerId', '==', currentUser.uid)
          )),
          getDocs(query(
            collectionGroup(db, 'dailyRecords'),
            where('ownerId', '==', currentUser.uid)
          )),
        ]);

        // ── Revenue by month (last 6) ──────────────────────────
        const months   = last6Months();
        const revenueMap = {};
        months.forEach(m => { revenueMap[m] = { month: monthLabel(m), collected: 0, outstanding: 0 }; });

        let allCollected   = 0;
        let allOutstanding = 0;

        cyclesSnap.docs.forEach(d => {
          const c = d.data();
          if (revenueMap[c.month]) {
            if (c.status === 'paid') {
              revenueMap[c.month].collected += c.totalAmount || 0;
            } else if (c.status === 'open' || c.status === 'settled') {
              revenueMap[c.month].outstanding += c.totalAmount || 0;
            }
          }
          if (c.status === 'paid')                              allCollected   += c.totalAmount || 0;
          if (c.status === 'open' || c.status === 'settled')    allOutstanding += c.totalAmount || 0;
        });

        setRevenue(months.map(m => revenueMap[m]));

        // ── Client breakdown ───────────────────────────────────
        const clientData = clientsSnap.docs.map(d => d.data());
        const planCount  = {};
        const PLAN_COLORS = {
          regular:   '#dc2626',
          premium:   '#7c3aed',
          customize: '#0891b2',
          trial:     '#d97706',
        };

        let sub = 0, ondemand = 0, active = 0, paused = 0, inactive = 0;
        clientData.forEach(c => {
          if (c.customerType === 'subscribed') sub++;    else ondemand++;
          if (c.status === 'active')   active++;
          else if (c.status === 'paused')   paused++;
          else inactive++;
          const pt = c.planType || 'regular';
          planCount[pt] = (planCount[pt] || 0) + 1;
        });

        setClients({ active, paused, inactive, subscribed: sub, ondemand });
        setPlans(Object.entries(planCount).map(([k, v]) => ({
          name: k.charAt(0).toUpperCase() + k.slice(1),
          value: v,
          color: PLAN_COLORS[k] || '#6b7280',
        })));

        // ── Totals ─────────────────────────────────────────────
        const totalDeliveries = recordsSnap.docs
          .map(d => d.data())
          .filter(r => r.status === 'delivered' || r.status === 'locked').length;

        if (!cancelled) {
          setTotals({ allCollected, allOutstanding, totalDeliveries });
        }

      } catch (err) {
        console.error('Analytics error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentUser]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-5 pb-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-2xl w-48" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-gray-200 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-56 bg-gray-200 rounded-2xl" />
          <div className="h-56 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const statusData = clients ? [
    { name: 'Active',   value: clients.active,   color: '#16a34a' },
    { name: 'Paused',   value: clients.paused,   color: '#d97706' },
    { name: 'Inactive', value: clients.inactive, color: '#9ca3af' },
  ] : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Business overview & trends</p>
        </div>
        <Link
          to="/dashboard"
          className="text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors active:scale-[0.97]"
        >
          ← Dashboard
        </Link>
      </div>

      {/* ── All-time summary ── */}
      <div>
        <SectionLabel>All-time summary</SectionLabel>
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard emoji="✅" label="Total Collected"  value={fmt(totals?.allCollected)}   color="text-emerald-600" />
          <SummaryCard emoji="⏳" label="Outstanding"       value={fmt(totals?.allOutstanding)} color={totals?.allOutstanding > 0 ? 'text-orange-600' : 'text-gray-900'} />
          <SummaryCard emoji="🚚" label="Deliveries Done"  value={totals?.totalDeliveries ?? 0} />
        </div>
      </div>

      {/* ── Revenue bar chart ── */}
      <div>
        <SectionLabel>Revenue — last 6 months</SectionLabel>
        <div className="bg-white rounded-2xl ring-1 ring-black/[0.04] shadow-sm p-4 pb-2">
          {revenue.every(r => r.collected === 0 && r.outstanding === 0) ? (
            <EmptyState text="No billing data yet. Generate bills from the Billing page." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenue} barCategoryGap="30%" barGap={3}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} width={38} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="collected"   name="Collected"   fill="#16a34a" radius={[5,5,0,0]} />
                <Bar dataKey="outstanding" name="Outstanding" fill="#fb923c" radius={[5,5,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex items-center gap-4 justify-center pb-2 pt-1">
            <Legend label="Collected"   color="#16a34a" />
            <Legend label="Outstanding" color="#fb923c" />
          </div>
        </div>
      </div>

      {/* ── Two pie charts ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Client status */}
        <div>
          <SectionLabel>Client status</SectionLabel>
          <div className="bg-white rounded-2xl ring-1 ring-black/[0.04] shadow-sm p-4">
            {clients && (clients.active + clients.paused + clients.inactive) === 0 ? (
              <EmptyState text="No clients yet." />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" cx="50%" cy="50%"
                      innerRadius={50} outerRadius={72} paddingAngle={4}>
                      {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1">
                  {statusData.map(e => (
                    <span key={e.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
                      {e.name} ({e.value})
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Plan distribution */}
        <div>
          <SectionLabel>Plan distribution</SectionLabel>
          <div className="bg-white rounded-2xl ring-1 ring-black/[0.04] shadow-sm p-4">
            {plans.length === 0 ? (
              <EmptyState text="No clients yet." />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={plans} dataKey="value" cx="50%" cy="50%"
                      innerRadius={50} outerRadius={72} paddingAngle={4}>
                      {plans.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1">
                  {plans.map(e => (
                    <span key={e.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
                      {e.name} ({e.value})
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Subscription vs one-time ── */}
      {clients && (
        <div>
          <SectionLabel>Subscription vs one-time</SectionLabel>
          <div className="bg-white rounded-2xl ring-1 ring-black/[0.04] shadow-sm p-5 space-y-3">
            {[
              { label:'Subscriptions', value: clients.subscribed, total: clients.subscribed + clients.ondemand, color:'bg-red-500' },
              { label:'One-time orders', value: clients.ondemand, total: clients.subscribed + clients.ondemand, color:'bg-blue-400' },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-gray-700">{row.label}</span>
                  <span className="font-bold text-gray-900">{row.value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${row.color} rounded-full transition-all duration-700`}
                    style={{ width: row.total > 0 ? `${(row.value / row.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// ── small components ───────────────────────────────────────────
function SummaryCard({ emoji, label, value, color = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-black/[0.04] shadow-sm px-4 py-4">
      <div className="text-lg leading-none mb-2">{emoji}</div>
      <div className={`text-base font-bold leading-tight ${color}`}>{value}</div>
      <div className="text-[10px] font-semibold text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

function Legend({ label, color }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-500">
      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
      {label}
    </span>
  );
}

function EmptyState({ text }) {
  return (
    <div className="h-40 flex items-center justify-center">
      <p className="text-sm text-gray-400 text-center px-4">{text}</p>
    </div>
  );
}

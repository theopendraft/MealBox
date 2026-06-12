// src/pages/KitchenPage.jsx
import { useEffect, useState } from 'react';
import { collectionGroup, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { createTodayRecords, getTodayStr } from '../utils/dailyRecords';
import { useToast } from '../components/ui/Toast';
import MilestoneCard from '../components/MilestoneCard';

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const SPICE_STYLE = {
  Low:    { bg: 'bg-green-50 text-green-700',  emoji: '🟢' },
  Medium: { bg: 'bg-amber-50 text-amber-700',  emoji: '🟡' },
  High:   { bg: 'bg-red-50 text-red-700',      emoji: '🔴' },
};

export default function KitchenPage() {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const planMap = Object.fromEntries((settings.plans || []).map(p => [p.id, p]));
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();

  const [records, setRecords] = useState(null); // null = loading
  const [starting, setStarting] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dateStr = getTodayStr();
  const today = new Date();

  // Realtime listener for today's daily records
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collectionGroup(db, 'dailyRecords'),
      where('ownerId', '==', currentUser.uid),
      where('date', '==', dateStr)
    );

    const unsub = onSnapshot(q, (snap) => {
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error('Kitchen snapshot error:', err);
      if (err.code === 'failed-precondition') {
        showError('Database index is building. Please wait a minute and refresh.');
      } else {
        showError('Failed to load kitchen data.');
      }
      setRecords([]);
    });

    return unsub;
  }, [currentUser, dateStr]);

  // Listen for unread milestone notifications
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'notifications'),
      where('ownerId', '==', currentUser.uid),
      where('read', '==', false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error('Notifications error:', err);
    });
    return unsub;
  }, [currentUser]);

  const handleStartDay = async () => {
    setStarting(true);
    try {
      const result = await createTodayRecords(currentUser.uid, planMap);
      if (result.created === 0 && result.alreadyExist === 0) {
        showInfo('No active clients are scheduled for delivery today.');
      } else if (result.created === 0) {
        showInfo(`Records already exist for today (${result.alreadyExist} clients).`);
      } else {
        showSuccess(`Started ${result.created} delivery record${result.created !== 1 ? 's' : ''} for today.`);
      }
    } catch (err) {
      console.error(err);
      showError("Failed to create today's records. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  const stats = (records || []).reduce((acc, r) => {
    acc.total++;
    acc.byPlan[r.planType] = (acc.byPlan[r.planType] || 0) + 1;

    const base = r.chapatis || planMap[r.planType]?.chapatis || 5;
    const extra = (r.billingModifiers || [])
      .filter(m => m.type === 'extraChapati')
      .reduce((s, m) => s + (m.qty || 0), 0);
    acc.chapatis += base + extra;

    const spice = r.kitchenOverrides?.spiceLevel || r.defaultSpice || 'Medium';
    acc.bySpice[spice] = (acc.bySpice[spice] || 0) + 1;

    const rice = r.kitchenOverrides?.riceVolume || r.defaultRice || 'Normal';
    acc.byRice[rice] = (acc.byRice[rice] || 0) + 1;

    (r.billingModifiers || []).forEach(m => {
      if (m.type === 'extraCurd') acc.addOns.curd++;
      if (m.type === 'extraSide') acc.addOns.side++;
    });

    acc.revenue += r.dayTotal || r.basePriceSnapshot || 0;

    if (r.status === 'delivered' || r.status === 'locked') acc.delivered++;
    else if (r.status === 'skipped') acc.skipped++;

    return acc;
  }, { total: 0, byPlan: {}, chapatis: 0, bySpice: {}, byRice: {}, addOns: { curd: 0, side: 0 }, revenue: 0, delivered: 0, skipped: 0 });

  const isLoading = records === null;
  const hasRecords = !isLoading && records.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kitchen View</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {DAY_NAMES[today.getDay()]}, {today.getDate()} {MONTH_NAMES[today.getMonth()]} {today.getFullYear()}
          </p>
        </div>
        {hasRecords && (
          <button
            onClick={() => navigate('/deliveries')}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            Delivery <span>→</span>
          </button>
        )}
      </div>

      {/* Milestone notifications */}
      {notifications.filter(n => n.type === 'milestone').map(n => (
        <MilestoneCard key={n.id} notification={n} />
      ))}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
        </div>
      )}

      {/* No records yet */}
      {!isLoading && !hasRecords && (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
          <div className="text-6xl mb-4">🍳</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Kitchen not started</h2>
          <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">
            Create today's delivery records for all active clients scheduled for {DAY_NAMES[today.getDay()]}.
          </p>
          <button
            onClick={handleStartDay}
            disabled={starting}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold px-8 py-3.5 rounded-2xl transition-colors shadow-sm text-base"
          >
            {starting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Creating records…
              </>
            ) : (
              '🚀 Start Today\'s Kitchen'
            )}
          </button>
        </div>
      )}

      {/* Cook sheet */}
      {hasRecords && (
        <>
          {/* Hero stats */}
          <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-5xl font-bold leading-none">{stats.total}</div>
                <div className="text-red-100 text-sm mt-1">Total tiffins today</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">₹{stats.revenue}</div>
                <div className="text-red-100 text-sm">Estimated revenue</div>
              </div>
            </div>
            <div className="text-xs text-red-100 mb-1.5">
              {stats.delivered} delivered · {stats.skipped} skipped · {stats.total - stats.delivered - stats.skipped} pending
            </div>
            <div className="w-full bg-white/20 rounded-full h-1.5">
              <div
                className="bg-white rounded-full h-1.5 transition-all duration-500"
                style={{ width: `${stats.total ? (stats.delivered / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Boxes to pack */}
          <div className="bg-white rounded-2xl ring-1 ring-black/[0.04] p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Boxes to Pack</h3>
            <div className="grid grid-cols-2 gap-3">
              {(settings.plans || []).map(plan => {
                const count = stats.byPlan[plan.id] || 0;
                if (count === 0) return null;
                return (
                  <div key={plan.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${plan.badgeColor}`}>
                      {plan.label}
                    </span>
                    <span className="text-2xl font-bold text-gray-800">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chapatis */}
          <div className="bg-white rounded-2xl ring-1 ring-black/[0.04] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Chapatis to Roll</h3>
                <p className="text-xs text-gray-400 mt-0.5">Base + modifier extras</p>
              </div>
              <div className="text-4xl font-bold text-gray-900">{stats.chapatis}</div>
            </div>
          </div>

          {/* Spice batches */}
          <div className="bg-white rounded-2xl ring-1 ring-black/[0.04] p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Spice Batches</h3>
            <div className="grid grid-cols-3 gap-3">
              {['Low', 'Medium', 'High'].map(level => {
                const style = SPICE_STYLE[level];
                const count = stats.bySpice[level] || 0;
                return (
                  <div key={level} className={`flex flex-col items-center py-4 rounded-2xl ${style.bg}`}>
                    <div className="text-2xl">{style.emoji}</div>
                    <div className="text-3xl font-bold mt-1">{count}</div>
                    <div className="text-xs font-semibold mt-0.5">{level}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rice volumes */}
          <div className="bg-white rounded-2xl ring-1 ring-black/[0.04] p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Rice Volumes</h3>
            <div className="grid grid-cols-3 gap-3">
              {['Less', 'Normal', 'More'].map(vol => {
                const count = stats.byRice[vol] || 0;
                return (
                  <div key={vol} className="flex flex-col items-center py-4 bg-blue-50 text-blue-700 rounded-2xl">
                    <div className="text-3xl font-bold">{count}</div>
                    <div className="text-xs font-semibold mt-0.5">{vol}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add-ons (only shown when there are some) */}
          {(stats.addOns.curd > 0 || stats.addOns.side > 0) && (
            <div className="bg-white rounded-2xl ring-1 ring-black/[0.04] p-5 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Add-ons Today</h3>
              <div className="flex gap-6">
                {stats.addOns.curd > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🥛</span>
                    <div>
                      <div className="font-bold text-gray-800">{stats.addOns.curd}</div>
                      <div className="text-xs text-gray-400">Curd</div>
                    </div>
                  </div>
                )}
                {stats.addOns.side > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🍽️</span>
                    <div>
                      <div className="font-bold text-gray-800">{stats.addOns.side}</div>
                      <div className="text-xs text-gray-400">Extra Side</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
}

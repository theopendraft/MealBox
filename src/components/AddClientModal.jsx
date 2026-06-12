// src/components/AddClientModal.jsx
import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings';

const getTodayStr = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_SHORT = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const buildForm = (client) => ({
  name: client?.name || '',
  phone: client?.phone || '',
  address: client?.address || '',
  routeArea: client?.routeArea || '',
  deliveryTimePreference: client?.deliveryTimePreference || '12:00 PM - 01:00 PM',
  planType: client?.planType || 'regular',
  orderDate: client?.plan?.date || getTodayStr(),
  preferences: {
    spiceLevel: client?.preferences?.spiceLevel || 'Medium',
    riceVolume: client?.preferences?.riceVolume || client?.preferences?.rice || 'Normal',
    notes: client?.preferences?.notes || '',
  },
  deliverySchedule: client?.deliverySchedule || {
    monday: true, tuesday: true, wednesday: true, thursday: true,
    friday: true, saturday: true, sunday: false,
  },
  startDate: client?.startDate || getTodayStr(),
  endDate: client?.endDate || '',
});

// Build an explicit ordered step list — single source of truth for navigation
const buildStepList = (isEditing, category) => {
  const steps = [];
  if (!isEditing) steps.push('type');
  steps.push('personal', 'plan');
  if (category !== 'ondemand') steps.push('schedule');
  return steps;
};

const STEP_LABEL = {
  type:     'Customer Type',
  personal: 'Personal Details',
  plan:     'Plan & Preferences',
  schedule: 'Delivery Schedule',
};

const IN = 'w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white transition-all outline-none';
const SEL = `${IN} appearance-none`;

export default function AddClientModal({ isOpen, onClose, onSuccess, clientToEdit }) {
  const isEditing = Boolean(clientToEdit);
  const [category, setCategory] = useState('subscribed');
  const [stepIdx, setStepIdx] = useState(0);
  const [form, setForm] = useState(buildForm(null));
  const [saving, setSaving] = useState(false);
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const planMap = Object.fromEntries((settings.plans || []).map(p => [p.id, p]));

  useEffect(() => {
    if (!isOpen) return;
    const cat = isEditing
      ? (clientToEdit.customerType === 'ondemand' ? 'ondemand' : 'subscribed')
      : 'subscribed';
    setCategory(cat);
    setStepIdx(isEditing ? 0 : 0); // always start at index 0 of the step list
    setForm(buildForm(clientToEdit));
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-compute steps every render — always consistent with current category
  const steps = buildStepList(isEditing, category);
  const currentStep = steps[stepIdx] ?? steps[steps.length - 1]; // guard against out-of-bounds
  const isLast = stepIdx >= steps.length - 1;
  const isOnetime = category === 'ondemand';

  const allowedPlans = (settings.plans || []).filter(p =>
    isOnetime ? p.isOnetime : !p.isOnetime
  );

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const setPref = (f, v) => setForm(p => ({ ...p, preferences: { ...p.preferences, [f]: v } }));
  const toggleDay = (d) => setForm(p => ({
    ...p, deliverySchedule: { ...p.deliverySchedule, [d]: !p.deliverySchedule[d] },
  }));

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    setForm(p => ({ ...p, planType: cat === 'ondemand' ? 'trial' : 'regular' }));
  };

  const canAdvance = () => {
    if (currentStep === 'type') return true;
    if (currentStep === 'personal') return !!(form.name.trim() && form.phone.trim() && form.address.trim());
    if (currentStep === 'plan') return !!form.planType;
    return true;
  };

  const goNext = () => {
    if (!canAdvance()) return;
    // Recompute steps at the point of navigation (category may have changed at step 'type')
    const freshSteps = buildStepList(isEditing, category);
    if (stepIdx < freshSteps.length - 1) setStepIdx(stepIdx + 1);
  };

  const goBack = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLast) { goNext(); return; } // safety: Enter key shouldn't skip steps
    setSaving(true);
    try {
      const plan = planMap[form.planType];
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        routeArea: form.routeArea.trim(),
        deliveryTimePreference: form.deliveryTimePreference,
        planType: form.planType,
        customerType: isOnetime ? 'ondemand' : 'subscribed',
        preferences: form.preferences,
        ...(isOnetime
          ? { plan: { date: form.orderDate, mealType: 'lunch', price: plan?.price || 0 } }
          : {
              deliverySchedule: form.deliverySchedule,
              startDate: form.startDate || getTodayStr(),
              endDate: form.endDate || null,
            }
        ),
      };
      if (isEditing) {
        await updateDoc(doc(db, 'clients', clientToEdit.id), payload);
        onSuccess({ ...clientToEdit, ...payload });
      } else {
        const ref = await addDoc(collection(db, 'clients'), {
          ...payload,
          status: 'active',
          ownerId: currentUser.uid,
          createdAt: serverTimestamp(),
        });
        onSuccess({ id: ref.id, ...payload, status: 'active', ownerId: currentUser.uid });
      }
      onClose();
    } catch (err) {
      console.error('Error saving client:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const progressPct = ((stepIdx + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Modal card — max-h drives the flex chain */}
      <div className="w-full sm:max-w-lg max-h-[92vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header — fixed height */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 px-5 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-white text-lg font-bold">
                {isEditing ? 'Edit Client' : 'Add New Client'}
              </h2>
              <p className="text-red-100 text-xs mt-0.5">
                Step {stepIdx + 1} of {steps.length} — {STEP_LABEL[currentStep]}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="w-full bg-white/20 rounded-full h-1">
            <div
              className="bg-white h-1 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Scrollable body — flex-1 + min-h-0 is critical */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 min-h-0">

          {/* ── TYPE ── */}
          {currentStep === 'type' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">What kind of customer is this?</p>
              {[
                { key: 'subscribed', emoji: '📋', label: 'Subscription', desc: 'Recurring daily or weekly delivery' },
                { key: 'ondemand',   emoji: '🍱', label: 'One-time Order', desc: 'Single delivery — Trial plan' },
              ].map(({ key, emoji, label, desc }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCategorySelect(key)}
                  className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all active:scale-[0.98] ${
                    category === key ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <span className="text-3xl">{emoji}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{label}</div>
                    <div className="text-sm text-gray-500">{desc}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    category === key ? 'border-red-500 bg-red-500' : 'border-gray-300'
                  }`}>
                    {category === key && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ── PERSONAL ── */}
          {currentStep === 'personal' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  className={IN}
                  placeholder="Customer's full name"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone *</label>
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={IN} placeholder="98765 43210" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Delivery Time</label>
                  <select value={form.deliveryTimePreference} onChange={e => set('deliveryTimePreference', e.target.value)} className={SEL}>
                    <option value="12:00 PM - 01:00 PM">12:00 – 1:00 PM</option>
                    <option value="01:00 PM - 02:00 PM">1:00 – 2:00 PM</option>
                    <option value="07:00 PM - 08:00 PM">7:00 – 8:00 PM</option>
                    <option value="08:00 PM - 09:00 PM">8:00 – 9:00 PM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Delivery Address *</label>
                <textarea
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                  rows={2}
                  className={`${IN} resize-none`}
                  placeholder="Full delivery address"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Route Area</label>
                {settings.routeAreas?.length > 0 ? (
                  <select value={form.routeArea} onChange={e => set('routeArea', e.target.value)} className={SEL}>
                    <option value="">— Select area —</option>
                    {settings.routeAreas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                ) : (
                  <input type="text" value={form.routeArea} onChange={e => set('routeArea', e.target.value)} className={IN} placeholder="e.g. Nagar Road" />
                )}
              </div>
            </div>
          )}

          {/* ── PLAN ── */}
          {currentStep === 'plan' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Select Plan *</label>
                <div className="space-y-2">
                  {allowedPlans.map(plan => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => set('planType', plan.id)}
                      className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all active:scale-[0.98] ${
                        form.planType === plan.id ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${plan.badgeColor}`}>{plan.label}</span>
                        <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                      </div>
                      <span className="text-lg font-bold text-gray-900 flex-shrink-0">₹{plan.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              {isOnetime && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Order Date</label>
                  <input type="date" value={form.orderDate} onChange={e => set('orderDate', e.target.value)} className={IN} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Spice Level</label>
                  <div className="flex gap-1.5">
                    {['Low','Medium','High'].map(l => (
                      <button key={l} type="button" onClick={() => setPref('spiceLevel', l)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all active:scale-95 ${
                          form.preferences.spiceLevel === l ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 bg-gray-50'
                        }`}
                      >
                        {l === 'Low' ? '🟢' : l === 'Medium' ? '🟡' : '🔴'}<br />{l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rice Amount</label>
                  <div className="flex gap-1.5">
                    {['Less','Normal','More'].map(v => (
                      <button key={v} type="button" onClick={() => setPref('riceVolume', v)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all active:scale-95 ${
                          form.preferences.riceVolume === v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 bg-gray-50'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
                <textarea
                  value={form.preferences.notes}
                  onChange={e => setPref('notes', e.target.value)}
                  rows={2}
                  className={`${IN} resize-none`}
                  placeholder="Dietary requirements or special instructions…"
                />
              </div>
            </div>
          )}

          {/* ── SCHEDULE ── */}
          {currentStep === 'schedule' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Delivery Days</label>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS.map((day, i) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`py-3 rounded-xl border-2 text-center transition-all active:scale-95 ${
                      form.deliverySchedule[day]
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-gray-50 text-gray-400'
                    }`}
                  >
                    <div className="text-xs font-bold">{DAY_SHORT[i]}</div>
                    <div className="text-xs mt-0.5">{form.deliverySchedule[day] ? '✓' : '·'}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                {Object.values(form.deliverySchedule).filter(Boolean).length} days / week
              </p>

              {/* Subscription period */}
              <div className="grid grid-cols-2 gap-3 mt-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => set('startDate', e.target.value)}
                    className={IN}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">End Date <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => set('endDate', e.target.value)}
                    min={form.startDate}
                    className={IN}
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer — fixed height, never scrolls away */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-white">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors active:scale-[0.97]"
            >
              Cancel
            </button>
            {stepIdx > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors active:scale-[0.97]"
              >
                ← Back
              </button>
            )}
          </div>

          {isLast ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !canAdvance()}
              className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40 transition-all active:scale-[0.97]"
            >
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Client'}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={!canAdvance()}
              className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40 transition-all active:scale-[0.97]"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

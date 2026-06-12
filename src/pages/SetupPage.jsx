// src/pages/SetupPage.jsx
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../components/ui/Toast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import {
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  MapPinIcon,
  PlusIcon,
  XMarkIcon,
  LockClosedIcon,
  LockOpenIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_PLANS = [
  { id: 'regular',   label: 'Regular',   price: 80,  chapatis: 5, description: '5 Chapatis + Rice + Sabzi + Dal',                isOnetime: false, badgeColor: 'bg-red-600 text-white'    },
  { id: 'trial',     label: 'Trial',     price: 90,  chapatis: 5, description: 'One-time tiffin, same as Regular',                isOnetime: true,  badgeColor: 'bg-amber-500 text-white'  },
  { id: 'customize', label: 'Customize', price: 100, chapatis: 5, description: 'Custom menu / Sunday Special',                    isOnetime: false, badgeColor: 'bg-purple-600 text-white' },
  { id: 'premium',   label: 'Premium',   price: 150, chapatis: 6, description: '6 Butter Chapatis + Rice + 2 Sabzi + Dal + Salad',isOnetime: false, badgeColor: 'bg-yellow-500 text-white' },
];

const BADGE_OPTIONS = [
  { value: 'bg-red-600 text-white',    label: 'Red'    },
  { value: 'bg-amber-500 text-white',  label: 'Amber'  },
  { value: 'bg-purple-600 text-white', label: 'Purple' },
  { value: 'bg-yellow-500 text-white', label: 'Yellow' },
  { value: 'bg-green-600 text-white',  label: 'Green'  },
  { value: 'bg-blue-600 text-white',   label: 'Blue'   },
];

const STEPS = [
  { num: 1, label: 'Business Info',    icon: BuildingStorefrontIcon },
  { num: 2, label: 'Meal Plans',       icon: ClipboardDocumentListIcon },
  { num: 3, label: 'Delivery Areas',   icon: MapPinIcon },
];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.num} className="flex items-center">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
            current === s.num
              ? 'bg-red-600 text-white'
              : current > s.num
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-400'
          }`}>
            {current > s.num
              ? <CheckCircleIcon className="w-4 h-4" />
              : <span className="w-4 h-4 flex items-center justify-center text-xs font-bold">{s.num}</span>
            }
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-6 sm:w-10 mx-1 ${current > s.num ? 'bg-green-300' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Plan Editor (shared between wizard step 2 and unlock mode) ───────────────
function PlanEditor({ plans, onChange }) {
  const addPlan = () => {
    onChange([...plans, {
      id: `plan_${Date.now()}`,
      label: '',
      price: 0,
      chapatis: 5,
      description: '',
      isOnetime: false,
      badgeColor: 'bg-red-600 text-white',
    }]);
  };

  const updatePlan = (idx, field, value) => {
    const updated = plans.map((p, i) => i === idx ? { ...p, [field]: value } : p);
    onChange(updated);
  };

  const removePlan = (idx) => {
    if (plans.length <= 1) return;
    onChange(plans.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {plans.map((plan, idx) => (
        <div key={plan.id} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${plan.badgeColor}`}>
                {plan.label || 'Plan'}
              </span>
              {plan.isOnetime && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">One-time</span>
              )}
            </div>
            {plans.length > 1 && (
              <button
                type="button"
                onClick={() => removePlan(idx)}
                className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Plan Name</label>
              <input
                type="text"
                value={plan.label}
                onChange={e => updatePlan(idx, 'label', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g. Regular"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Price (₹ / day)</label>
              <input
                type="number"
                min="0"
                value={plan.price}
                onChange={e => updatePlan(idx, 'price', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Chapatis / day</label>
              <input
                type="number"
                min="1"
                value={plan.chapatis}
                onChange={e => updatePlan(idx, 'chapatis', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Badge Colour</label>
              <select
                value={plan.badgeColor}
                onChange={e => updatePlan(idx, 'badgeColor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
              >
                {BADGE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input
                type="text"
                value={plan.description}
                onChange={e => updatePlan(idx, 'description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g. 5 Chapatis + Rice + Sabzi + Dal"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id={`onetime-${idx}`}
                checked={plan.isOnetime}
                onChange={e => updatePlan(idx, 'isOnetime', e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor={`onetime-${idx}`} className="text-sm text-gray-600">
                One-time plan (trial / walk-in — not recurring subscription)
              </label>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addPlan}
        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-red-400 hover:text-red-600 transition-colors w-full justify-center"
      >
        <PlusIcon className="w-4 h-4" />
        Add Plan
      </button>
    </div>
  );
}

// ─── Main SetupPage component ─────────────────────────────────────────────────
export default function SetupPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { settings, loading, saveSettings } = useSettings();
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [newArea, setNewArea] = useState('');
  const [editPlans, setEditPlans] = useState(null); // plans being edited during unlock mode

  const [form, setForm] = useState(null);

  if (!currentUser) return <Navigate to="/auth" replace />;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  // Initialise form once settings are loaded
  if (form === null) {
    setForm({
      businessName: settings.businessName || '',
      ownerName: settings.ownerName || '',
      phone: settings.phone || '',
      email: settings.email || '',
      upiId: settings.upiId || '',
      businessAddress: settings.businessAddress || '',
      plans: settings.plans?.length > 0 ? settings.plans : DEFAULT_PLANS,
      routeAreas: settings.routeAreas || [],
    });
    return null;
  }

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const addArea = () => {
    const area = newArea.trim();
    if (!area || form.routeAreas.includes(area)) return;
    set('routeAreas', [...form.routeAreas, area]);
    setNewArea('');
  };

  const removeArea = (area) => set('routeAreas', form.routeAreas.filter(a => a !== area));

  const handleFinish = async () => {
    if (!form.businessName.trim()) { showError('Business name is required.'); setStep(1); return; }
    if (form.plans.some(p => !p.label.trim())) { showError('All plans need a name.'); setStep(2); return; }
    setIsSaving(true);
    try {
      await saveSettings({ ...form, setupComplete: true, setupLocked: true });
      showSuccess('Setup complete! Welcome to MealBox.');
      navigate('/kitchen');
    } catch (err) {
      console.error(err);
      showError('Failed to save setup. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlock = async () => {
    await saveSettings({ setupLocked: false });
    setEditPlans(settings.plans?.length > 0 ? [...settings.plans] : [...DEFAULT_PLANS]);
  };

  const handleSaveLock = async () => {
    if (editPlans.some(p => !p.label.trim())) { showError('All plans need a name.'); return; }
    setIsSaving(true);
    try {
      await saveSettings({ plans: editPlans, setupLocked: true });
      setEditPlans(null);
      showSuccess('Plans saved and locked.');
    } catch (err) {
      console.error(err);
      showError('Failed to save plans.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelUnlock = async () => {
    await saveSettings({ setupLocked: true });
    setEditPlans(null);
  };

  // ── Mode B: Returning owner (setup already complete) ──────────────────────
  if (settings.setupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <img src="/MealBox.png" alt="MealBox" className="w-8 h-8" />
              <span className="text-sm font-medium text-gray-500">MealBox</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardDocumentListIcon className="w-7 h-7 text-red-600" />
              Menu & Plans
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Manage the meal plans available for your customers.</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <ClipboardDocumentListIcon className="w-5 h-5 text-red-600" />
                  Meal Plans
                </CardTitle>
                {settings.setupLocked ? (
                  <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                    <LockClosedIcon className="w-3.5 h-3.5" /> Locked
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                    <LockOpenIcon className="w-3.5 h-3.5" /> Editing
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {settings.setupLocked ? (
                <>
                  {/* Read-only plan list */}
                  <div className="space-y-3 mb-6">
                    {(settings.plans?.length > 0 ? settings.plans : DEFAULT_PLANS).map(plan => (
                      <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${plan.badgeColor}`}>
                            {plan.label}
                          </span>
                          <span className="text-sm text-gray-600">{plan.description}</span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-sm font-semibold text-gray-900">₹{plan.price}/day</p>
                          <p className="text-xs text-gray-400">{plan.chapatis} chapatis</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleUnlock}
                    className="flex items-center gap-2 px-4 py-2.5 border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl text-sm font-medium transition-colors"
                  >
                    <LockOpenIcon className="w-4 h-4" />
                    Unlock to Edit
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                    Plans are unlocked. Edit and save when done — this will also re-lock them.
                  </p>
                  <PlanEditor
                    plans={editPlans || (settings.plans?.length > 0 ? settings.plans : DEFAULT_PLANS)}
                    onChange={setEditPlans}
                  />
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={handleSaveLock}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:bg-red-400 transition-colors"
                    >
                      <LockClosedIcon className="w-4 h-4" />
                      {isSaving ? 'Saving…' : 'Save & Lock'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelUnlock}
                      className="px-4 py-2.5 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Mode A: First-run wizard ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Brand header */}
        <div className="text-center mb-8">
          <img src="/MealBox.png" alt="MealBox" className="w-16 h-16 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Welcome to MealBox</h1>
          <p className="text-gray-500 text-sm mt-1">Set up your tiffin business in a few quick steps.</p>
        </div>

        <StepIndicator current={step} />

        {/* Step 1: Business Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <BuildingStorefrontIcon className="w-5 h-5 text-red-600" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={e => set('businessName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                    placeholder="e.g. MealBox Tiffin"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={form.ownerName}
                    onChange={e => set('ownerName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={form.upiId}
                    onChange={e => set('upiId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                    placeholder="yourname@upi"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                  <textarea
                    rows={2}
                    value={form.businessAddress}
                    onChange={e => set('businessAddress', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none"
                    placeholder="e.g. 12 Main Street, Tambaram, Chennai - 600045"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Meal Plans */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <ClipboardDocumentListIcon className="w-5 h-5 text-red-600" />
                Meal Plans
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">Define the plans you offer. Pre-filled with common defaults — customise as needed.</p>
            </CardHeader>
            <CardContent>
              <PlanEditor plans={form.plans} onChange={(plans) => set('plans', plans)} />
            </CardContent>
          </Card>
        )}

        {/* Step 3: Delivery Areas */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <MapPinIcon className="w-5 h-5 text-red-600" />
                Delivery Route Areas
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">Add locality names for grouping customer deliveries. You can add more later from Settings.</p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newArea}
                  onChange={e => setNewArea(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addArea())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  placeholder="e.g. Station Area, Nagar Road…"
                />
                <button
                  type="button"
                  onClick={addArea}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4" /> Add
                </button>
              </div>
              {form.routeAreas.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No areas yet — you can skip and add from Settings later.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {form.routeAreas.map(area => (
                    <span key={area} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      <MapPinIcon className="w-3.5 h-3.5 text-gray-400" />
                      {area}
                      <button type="button" onClick={() => removeArea(area)} className="text-gray-400 hover:text-red-600 transition-colors ml-0.5">
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6 gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !form.businessName.trim()) { showError('Please enter your business name.'); return; }
                if (step === 2 && form.plans.some(p => !p.label.trim())) { showError('All plans need a name.'); return; }
                setStep(s => s + 1);
              }}
              className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:bg-red-400 transition-colors"
            >
              <CheckCircleIcon className="w-4 h-4" />
              {isSaving ? 'Saving…' : 'Finish Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

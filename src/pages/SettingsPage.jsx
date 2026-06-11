// src/pages/SettingsPage.jsx
import { useState } from 'react';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../components/ui/Toast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import {
  CogIcon,
  BuildingStorefrontIcon,
  CurrencyRupeeIcon,
  MapPinIcon,
  PlusIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const { settings, loading, saveSettings } = useSettings();
  const { showSuccess, showError } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [newArea, setNewArea] = useState('');

  const [form, setForm] = useState(null);

  // Initialise form from settings once loaded
  if (!loading && form === null) {
    setForm({
      businessName: settings.businessName,
      ownerName: settings.ownerName,
      phone: settings.phone,
      email: settings.email,
      upiId: settings.upiId,
      businessAddress: settings.businessAddress || '',
      modifierRates: { ...settings.modifierRates },
      routeAreas: [...(settings.routeAreas || [])],
    });
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveSettings(form);
      showSuccess('Settings saved.');
    } catch (err) {
      console.error(err);
      showError('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const setRate = (field, value) =>
    setForm(prev => ({ ...prev, modifierRates: { ...prev.modifierRates, [field]: Number(value) } }));

  const addArea = () => {
    const area = newArea.trim();
    if (!area || form.routeAreas.includes(area)) return;
    set('routeAreas', [...form.routeAreas, area]);
    setNewArea('');
  };

  const removeArea = (area) =>
    set('routeAreas', form.routeAreas.filter(a => a !== area));

  const runMigration = async () => {
    setIsMigrating(true);
    setMigrationStatus(null);
    try {
      const q = query(
        collection(db, 'clients'),
        where('ownerId', '==', currentUser.uid)
      );
      const snap = await getDocs(q);
      let updated = 0;

      for (const clientDoc of snap.docs) {
        const data = clientDoc.data();
        if (data.planType) continue; // already migrated

        let planType = 'regular';
        if (data.customerType === 'ondemand') planType = 'trial';

        await updateDoc(doc(db, 'clients', clientDoc.id), { planType });
        updated++;
      }

      setMigrationStatus({ success: true, count: updated });
      showSuccess(`Migration complete — ${updated} client(s) updated.`);
    } catch (err) {
      console.error(err);
      setMigrationStatus({ success: false });
      showError('Migration failed. Check console.');
    } finally {
      setIsMigrating(false);
    }
  };

  if (loading || form === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CogIcon className="h-8 w-8 text-red-600" />
          Settings
        </h1>
        <p className="text-gray-500 mt-1">Business info, pricing rules, and delivery areas.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <BuildingStorefrontIcon className="h-5 w-5 text-red-600" />
              Business Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={e => set('businessName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  placeholder="e.g. MealBox Tiffin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={e => set('ownerName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  placeholder="Your name"
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
              <div className="sm:col-span-2">
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

        {/* Modifier Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <CurrencyRupeeIcon className="h-5 w-5 text-red-600" />
              Billing Modifier Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              These rates are used when adding modifiers to a delivery (e.g., extra chapati, curd).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Extra Chapati (₹ each)</label>
                <input
                  type="number"
                  min="0"
                  value={form.modifierRates.extraChapati}
                  onChange={e => setRate('extraChapati', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Extra Curd (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={form.modifierRates.extraCurd}
                  onChange={e => setRate('extraCurd', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Extra Side Dish (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={form.modifierRates.extraSide}
                  onChange={e => setRate('extraSide', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Route Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <MapPinIcon className="h-5 w-5 text-red-600" />
              Delivery Route Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Add locality names. Each customer is assigned one area for grouped delivery routing.
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newArea}
                onChange={e => setNewArea(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addArea())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                placeholder="e.g. Nagar Road, Station Area, Civil Lines…"
              />
              <button
                type="button"
                onClick={addArea}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-1"
              >
                <PlusIcon className="h-4 w-4" /> Add
              </button>
            </div>
            {form.routeAreas.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No areas added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {form.routeAreas.map(area => (
                  <span
                    key={area}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                  >
                    <MapPinIcon className="h-3.5 w-3.5 text-gray-400" />
                    {area}
                    <button
                      type="button"
                      onClick={() => removeArea(area)}
                      className="text-gray-400 hover:text-red-600 transition-colors ml-0.5"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:bg-red-400 transition-colors"
        >
          {isSaving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>

      {/* Migration Utility */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <ArrowPathIcon className="h-5 w-5" />
            Data Migration — Assign Plan Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-700 mb-4">
            Run this once to assign <strong>planType</strong> to existing clients (subscribed → regular, on-demand → trial).
            Safe to run multiple times — already-migrated clients are skipped.
          </p>
          {migrationStatus && (
            <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${migrationStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {migrationStatus.success
                ? `✓ ${migrationStatus.count} client(s) updated successfully.`
                : '✕ Migration failed. Check the browser console for details.'}
            </div>
          )}
          <button
            type="button"
            onClick={runMigration}
            disabled={isMigrating}
            className="px-5 py-2.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:bg-amber-400 transition-colors text-sm flex items-center gap-2"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isMigrating ? 'animate-spin' : ''}`} />
            {isMigrating ? 'Running…' : 'Run Migration'}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

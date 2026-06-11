// src/components/ModifierPanel.jsx
import { useState } from 'react';
import { updateRecordModifiers } from '../utils/dailyRecords';
import { useToast } from './ui/Toast';

const DEFAULT_RATES = { extraChapati: 7, extraCurd: 15, extraSide: 20 };

export default function ModifierPanel({ record, settings, onClose, onSaved }) {
  const { showSuccess, showError } = useToast();
  const rates = settings?.modifierRates || DEFAULT_RATES;

  const existing = record.billingModifiers || [];
  const [extraChapati, setExtraChapati] = useState(
    existing.find(m => m.type === 'extraChapati')?.qty || 0
  );
  const [addCurd, setAddCurd] = useState(existing.some(m => m.type === 'extraCurd'));
  const [addSide, setAddSide] = useState(existing.some(m => m.type === 'extraSide'));
  const [spiceOverride, setSpiceOverride] = useState(record.kitchenOverrides?.spiceLevel || null);
  const [riceOverride, setRiceOverride] = useState(record.kitchenOverrides?.riceVolume || null);
  const [saving, setSaving] = useState(false);

  const extraTotal =
    extraChapati * rates.extraChapati +
    (addCurd ? rates.extraCurd : 0) +
    (addSide ? rates.extraSide : 0);
  const newTotal = record.basePriceSnapshot + extraTotal;

  const handleSave = async () => {
    setSaving(true);
    try {
      const modifiers = [];
      if (extraChapati > 0)
        modifiers.push({ type: 'extraChapati', qty: extraChapati, rate: rates.extraChapati, total: extraChapati * rates.extraChapati });
      if (addCurd)
        modifiers.push({ type: 'extraCurd', qty: 1, rate: rates.extraCurd, total: rates.extraCurd });
      if (addSide)
        modifiers.push({ type: 'extraSide', qty: 1, rate: rates.extraSide, total: rates.extraSide });

      const kitchenOverrides = (spiceOverride || riceOverride)
        ? { spiceLevel: spiceOverride, riceVolume: riceOverride }
        : null;

      await updateRecordModifiers(record, modifiers, kitchenOverrides);
      showSuccess('Modifiers saved.');
      onSaved();
    } catch (err) {
      console.error(err);
      showError('Failed to save modifiers.');
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-2xl mx-auto overflow-y-auto max-h-[90vh]">
        <div className="p-5 pb-8">
          {/* Handle */}
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

          {/* Title */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{record.customerName}</h2>
              <p className="text-sm text-gray-400">Modify today's tiffin</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 text-lg leading-none">
              ✕
            </button>
          </div>

          {/* Billing add-ons */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Billing Add-ons</h3>

            {/* Extra chapati counter */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <div className="text-sm font-medium text-gray-800">Extra Chapati</div>
                <div className="text-xs text-gray-400">₹{rates.extraChapati} each</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setExtraChapati(Math.max(0, extraChapati - 1))}
                  className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 font-bold text-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-xl font-bold text-gray-900 w-7 text-center">{extraChapati}</span>
                <button
                  onClick={() => setExtraChapati(extraChapati + 1)}
                  className="w-9 h-9 rounded-full bg-red-100 text-red-600 font-bold text-lg hover:bg-red-200 transition-colors flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Curd toggle */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <div className="text-sm font-medium text-gray-800">Extra Curd</div>
                <div className="text-xs text-gray-400">+₹{rates.extraCurd}</div>
              </div>
              <Toggle active={addCurd} onChange={setAddCurd} />
            </div>

            {/* Side dish toggle */}
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-medium text-gray-800">Extra Side Dish</div>
                <div className="text-xs text-gray-400">+₹{rates.extraSide}</div>
              </div>
              <Toggle active={addSide} onChange={setAddSide} />
            </div>
          </div>

          {/* Kitchen overrides */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Today's Kitchen Override</h3>

            {/* Spice */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Spice <span className="text-gray-400 font-normal">(default: {record.defaultSpice})</span>
              </div>
              <div className="flex gap-2">
                {[null, 'Low', 'Medium', 'High'].map(level => (
                  <button
                    key={level ?? 'default'}
                    onClick={() => setSpiceOverride(level)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                      spiceOverride === level
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {level ?? 'Default'}
                  </button>
                ))}
              </div>
            </div>

            {/* Rice */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">
                Rice <span className="text-gray-400 font-normal">(default: {record.defaultRice})</span>
              </div>
              <div className="flex gap-2">
                {[null, 'Less', 'Normal', 'More'].map(vol => (
                  <button
                    key={vol ?? 'default'}
                    onClick={() => setRiceOverride(vol)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                      riceOverride === vol
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {vol ?? 'Default'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Price preview */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-5 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Base ({record.planType})</span>
              <span>₹{record.basePriceSnapshot}</span>
            </div>
            {extraChapati > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>+{extraChapati} chapati</span>
                <span>+₹{extraChapati * rates.extraChapati}</span>
              </div>
            )}
            {addCurd && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>+Curd</span>
                <span>+₹{rates.extraCurd}</span>
              </div>
            )}
            {addSide && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>+Side dish</span>
                <span>+₹{rates.extraSide}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total today</span>
              <span>₹{newTotal}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : `Save · ₹${newTotal}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Toggle({ active, onChange }) {
  return (
    <button
      onClick={() => onChange(!active)}
      className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${active ? 'bg-red-500' : 'bg-gray-200'}`}
    >
      <div
        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${active ? 'translate-x-8' : 'translate-x-1'}`}
      />
    </button>
  );
}

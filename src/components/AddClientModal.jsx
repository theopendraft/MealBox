// src/components/AddClientModal.jsx
import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initialFormData = {
  name: '',
  phone: '',
  address: '',
  customerType: 'subscribed',
  deliveryTimePreference: '12:00 PM - 01:00 PM',
  plan: {
    lunch: { subscribed: true, price: '' },
    dinner: { subscribed: false, price: '' },
    startDate: getTodayDateString(),
    endDate: '',
    date: getTodayDateString(), // for on-demand, default to today
    mealType: 'lunch', // for on-demand, default to lunch
  },
  preferences: {
    rotiCount: 6,
    rice: 'Yes',
    spiceLevel: 'Medium',
    notes: '',
  },
  deliverySchedule: {
    monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true,
  },
};


// 1. The component now accepts a 'mode' prop
export default function AddClientModal({ isOpen, onClose, onSuccess, clientToEdit, mode }) {
  const [formData, setFormData] = useState(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState(0); // 0: Personal, 1: Preferences, 2: Schedule/Plan
  const { currentUser } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      if (clientToEdit) { // Edit mode
        setFormData({
          ...initialFormData,
          ...clientToEdit,
          plan: { ...initialFormData.plan, ...(clientToEdit.plan || {}) },
          preferences: { ...initialFormData.preferences, ...(clientToEdit.preferences || {}) },
          deliverySchedule: clientToEdit.deliverySchedule || initialFormData.deliverySchedule,
        });
      } else { // Add mode
        setFormData({ ...initialFormData, customerType: mode });
      }
    }
  }, [clientToEdit, isOpen, mode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const keys = name.split('-');

    setFormData(prev => {
      if (keys[0] === 'schedule') {
        return {
          ...prev,
          deliverySchedule: {
            ...prev.deliverySchedule,
            [keys[1]]: checked
          }
        };
      } else if (keys[0] === 'plan' && keys.length === 3) {
        return {
          ...prev,
          plan: {
            ...prev.plan,
            [keys[1]]: {
              ...prev.plan[keys[1]],
              [keys[2]]: type === 'checkbox' ? checked : value
            }
          }
        };
      } else if (keys[0] === 'plan' && keys.length === 2) {
        return {
          ...prev,
          plan: {
            ...prev.plan,
            [keys[1]]: value
          }
        };
      } else if (keys[0] === 'preferences' && keys.length === 2) {
        // Fix: handle nested preferences fields
        return {
          ...prev,
          preferences: {
            ...prev.preferences,
            [keys[1]]: type === 'number' ? Number(value) : value
          }
        };
      } else {
        return {
          ...prev,
          [name]: value
        };
      }
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // The data payload now respects the customerType from the form
      const { plan, preferences, deliverySchedule, ...personalDetails } = formData;
      let dataPayload = {
        ...personalDetails,
        preferences,
      };

      // Only add subscription data if the client is a subscriber
      if (formData.customerType === 'subscribed' || mode === 'edit') {
        dataPayload.plan = {
          lunch: { subscribed: plan.lunch.subscribed, price: Number(plan.lunch.price) || 0 },
          dinner: { subscribed: plan.dinner.subscribed, price: Number(plan.dinner.price) || 0 },
          startDate: plan.startDate,
          endDate: plan.endDate,
        };
        dataPayload.deliverySchedule = deliverySchedule;
      }

      if (clientToEdit) {
        await updateDoc(doc(db, 'clients', clientToEdit.id), dataPayload);
      } else {
        const fullPayload = { ...dataPayload, status: 'active', ownerId: currentUser.uid, createdAt: serverTimestamp() };
        await addDoc(collection(db, 'clients'), fullPayload);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving client:", error);
      alert("Failed to save client.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // --- Stepper Content ---
  // Fix: Only treat as subscribed if customerType is 'subscribed' (not just edit mode)
  const isSubscribed = formData.customerType === 'subscribed';
  const isOnDemand = formData.customerType === 'ondemand';

  const stepTitles = [
    'Personal Details',
    'Meal Preferences',
    isSubscribed ? 'Schedule & Plan' : 'Order Details',
  ];

  // Validation for each step
  const canProceed = () => {
    if (step === 0) {
      return formData.name && formData.phone && formData.address;
    }
    if (step === 1) {
      return formData.preferences.rotiCount && formData.preferences.rice && formData.preferences.spiceLevel;
    }
    if (step === 2) {
      if (isSubscribed) {
        return (
          (formData.plan.lunch.subscribed || formData.plan.dinner.subscribed) &&
          (formData.plan.lunch.subscribed ? formData.plan.lunch.price : true) &&
          (formData.plan.dinner.subscribed ? formData.plan.dinner.price : true) &&
          formData.plan.startDate
        );
      } else if (isOnDemand) {
        return formData.plan.date && formData.deliveryTimePreference && formData.plan.mealType;
      }
    }
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl z-50 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <h2 className="text-2xl font-bold mb-6 text-center">{mode === 'edit' ? 'Edit Client' : (isSubscribed ? 'Add New Subscriber' : 'Add On-Demand Client')}</h2>
        {/* Stepper Indicator */}
        <div className="flex justify-center mb-4">
          {stepTitles.map((title, idx) => (
            <div key={title} className={`px-4 py-2 rounded-full mx-1 text-sm font-medium ${step === idx ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{title}</div>
          ))}
        </div>
        <div className="flex-grow overflow-y-auto pr-2 space-y-6">
          {/* Step 1: Personal Details */}
          {step === 0 && (
            <fieldset className="border p-4 rounded-md space-y-4">
              <legend className="text-lg font-medium px-2">Personal Details</legend>
              <div>
                <label htmlFor="name" className="block text-sm font-medium">Full Name</label>
                <input type="text" name="name" id="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full input-style" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium">Phone Number</label>
                <input type="tel" name="phone" id="phone" required value={formData.phone} onChange={handleChange} className="mt-1 block w-full input-style" />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium">Address</label>
                <input type="text" name="address" id="address" required value={formData.address} onChange={handleChange} className="mt-1 block w-full input-style" />
              </div>
            </fieldset>
          )}
          {/* Step 2: Meal Preferences */}
          {step === 1 && (
            <fieldset className="border p-4 rounded-md space-y-4">
              <legend className="text-lg font-medium px-2">Meal Preferences</legend>
              <div>
                <label className="block text-sm font-medium">Number of Roti</label>
                <input type="number" name="preferences-rotiCount" min="1" value={formData.preferences.rotiCount} onChange={handleChange} className="mt-1 block w-32 input-style" />
              </div>
              <div>
                <label className="block text-sm font-medium">Include Rice?</label>
                <select name="preferences-rice" value={formData.preferences.rice} onChange={handleChange} className="mt-1 block w-32 input-style">
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Spice Level</label>
                <select name="preferences-spiceLevel" value={formData.preferences.spiceLevel} onChange={handleChange} className="mt-1 block w-32 input-style">
                  <option value="Mild">Mild</option>
                  <option value="Medium">Medium</option>
                  <option value="Spicy">Spicy</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Notes</label>
                <textarea name="preferences-notes" value={formData.preferences.notes} onChange={handleChange} className="mt-1 block w-full input-style" rows={2} placeholder="Any special instructions..." />
              </div>
            </fieldset>
          )}
          {/* Step 3: Schedule/Plan or Order Details */}
          {step === 2 && (
            <>
              {isSubscribed ? (
                <>
                  <fieldset className="border p-4 rounded-md space-y-4">
                    <legend className="text-lg font-medium px-2">Meal Plan</legend>
                    <div className="flex items-center gap-4 p-2 rounded-md bg-gray-50">
                      <input type="checkbox" id="lunch-subscribed" name="plan-lunch-subscribed" checked={formData.plan.lunch.subscribed} onChange={handleChange} className="h-5 w-5" />
                      <label htmlFor="lunch-subscribed" className="font-medium flex-1">Lunch</label>
                      <div className="flex items-center">
                        <span className="mr-2">₹</span>
                        <input type="number" name="plan-lunch-price" placeholder="Price/tiffin" value={formData.plan.lunch.price} onChange={handleChange} disabled={!formData.plan.lunch.subscribed} className="input-style w-28" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-2 rounded-md bg-gray-50">
                      <input type="checkbox" id="dinner-subscribed" name="plan-dinner-subscribed" checked={formData.plan.dinner.subscribed} onChange={handleChange} className="h-5 w-5" />
                      <label htmlFor="dinner-subscribed" className="font-medium flex-1">Dinner</label>
                      <div className="flex items-center">
                        <span className="mr-2">₹</span>
                        <input type="number" name="plan-dinner-price" placeholder="Price/tiffin" value={formData.plan.dinner.price} onChange={handleChange} disabled={!formData.plan.dinner.subscribed} className="input-style w-28" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <label htmlFor="startDate" className="block text-sm font-medium">Start Date</label>
                        <input type="date" name="plan-startDate" id="startDate" required value={formData.plan.startDate} onChange={handleChange} className="mt-1 block w-full input-style" />
                      </div>
                      <div>
                        <label htmlFor="endDate" className="block text-sm font-medium">End Date (Optional)</label>
                        <input type="date" name="plan-endDate" id="endDate" value={formData.plan.endDate} onChange={handleChange} className="mt-1 block w-full input-style" />
                      </div>
                    </div>
                  </fieldset>
                  <fieldset className="border p-4 rounded-md">
                    <legend className="text-lg font-medium px-2">Weekly Schedule</legend>
                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                      {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => (
                        <label key={day} className="flex items-center space-x-2 capitalize">
                          <input type="checkbox" name={`schedule-${day}`} checked={formData.deliverySchedule[day]} onChange={handleChange} className="h-4 w-4 rounded" />
                          <span>{day.substring(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </>
              ) : isOnDemand ? (
                <fieldset className="border p-4 rounded-md space-y-4">
                  <legend className="text-lg font-medium px-2">Order Details</legend>
                  <div>
                    <label htmlFor="plan-date" className="block text-sm font-medium">Order Date</label>
                    <input type="date" name="plan-date" id="plan-date" required value={formData.plan.date} onChange={handleChange} className="mt-1 block w-full input-style" />
                  </div>
                  <div>
                    <label htmlFor="plan-mealType" className="block text-sm font-medium">Meal Type</label>
                    <select name="plan-mealType" id="plan-mealType" value={formData.plan.mealType} onChange={handleChange} className="mt-1 block w-full input-style">
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="deliveryTimePreference" className="block text-sm font-medium">Preferred Delivery Time</label>
                    <input type="text" name="deliveryTimePreference" id="deliveryTimePreference" required value={formData.deliveryTimePreference} onChange={handleChange} className="mt-1 block w-full input-style" placeholder="e.g. 12:00 PM - 01:00 PM" />
                  </div>
                </fieldset>
              ) : null}
            </>
          )}
        </div>
        {/* Wizard Navigation */}
        <div className="flex justify-between space-x-4 pt-6 mt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Back</button>
          )}
          {step < 2 && (
            <button type="button" onClick={() => canProceed() && setStep(step + 1)} disabled={!canProceed()} className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400">Next</button>
          )}
          {step === 2 && (
            <button type="submit" disabled={isSaving || !canProceed()} className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400">
              {isSaving ? 'Saving...' : 'Save Client'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
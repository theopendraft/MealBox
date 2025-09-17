// src/components/AddClientModal.jsx
import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

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
      } else if (formData.customerType === 'ondemand') {
        // Use direct price input for on-demand client
        dataPayload.plan = {
          date: plan.date,
          mealType: plan.mealType,
          price: Number(plan.price) || 0,
        };
      }

      if (clientToEdit) {
        await updateDoc(doc(db, 'clients', clientToEdit.id), dataPayload);
        // Pass the updated client data back to the parent
        const updatedClient = { ...clientToEdit, ...dataPayload };
        onSuccess(updatedClient);
      } else {
        const fullPayload = { ...dataPayload, status: 'active', ownerId: currentUser.uid, createdAt: serverTimestamp() };
        const docRef = await addDoc(collection(db, 'clients'), fullPayload);
        const newClient = { id: docRef.id, ...fullPayload };
        onSuccess(newClient);
      }
    } catch (error) {
      console.error("Error saving client:", error);
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
        return formData.plan.date && formData.deliveryTimePreference && formData.plan.mealType && formData.plan.price;
      }
    }
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-4xl max-h-[95vh] animate-scale-in">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-2xl font-bold">
                  {mode === 'edit' ? 'Edit Client' : (isSubscribed ? 'Add New Subscriber' : 'Add On-Demand Client')}
                </CardTitle>
                <p className="text-indigo-100 mt-1">
                  {mode === 'edit' ? 'Update client information' : `Create a new ${isSubscribed ? 'subscription' : 'on-demand'} client`}
                </p>
              </div>
              <Button
                type="button"
                onClick={onClose}
                variant="ghost"
                className="text-white hover:bg-white/20 p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mt-6 space-x-4">
              {stepTitles.map((title, idx) => (
                <div key={title} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm
                    transition-all duration-300
                    ${step === idx
                      ? 'bg-white text-indigo-600 shadow-lg scale-110'
                      : step > idx
                        ? 'bg-indigo-300 text-indigo-700'
                        : 'bg-indigo-400/50 text-indigo-200'
                    }
                  `}>
                    {step > idx ? '✓' : idx + 1}
                  </div>
                  {idx < stepTitles.length - 1 && (
                    <div className={`w-12 h-1 mx-2 rounded transition-colors duration-300 ${step > idx ? 'bg-indigo-300' : 'bg-indigo-400/50'
                      }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step Labels */}
            <div className="flex justify-center mt-3">
              <div className="text-center">
                <h3 className="text-white font-semibold">{stepTitles[step]}</h3>
                <p className="text-indigo-100 text-sm">Step {step + 1} of {stepTitles.length}</p>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Step 1: Personal Details */}
                {step === 0 && (
                  <div className="animate-slide-in-right">
                    <Card className="border-l-4 border-l-indigo-500">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              name="name"
                              id="name"
                              required
                              value={formData.name}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                              placeholder="Enter full name"
                            />
                          </div>

                          <div>
                            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              id="phone"
                              required
                              value={formData.phone}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                              placeholder="Enter phone number"
                            />
                          </div>

                          <div>
                            <label htmlFor="deliveryTimePreference" className="block text-sm font-semibold text-gray-700 mb-2">
                              Delivery Time
                            </label>
                            <select
                              name="deliveryTimePreference"
                              id="deliveryTimePreference"
                              value={formData.deliveryTimePreference}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            >
                              <option value="12:00 PM - 01:00 PM">12:00 PM - 01:00 PM</option>
                              <option value="01:00 PM - 02:00 PM">01:00 PM - 02:00 PM</option>
                              <option value="07:00 PM - 08:00 PM">07:00 PM - 08:00 PM</option>
                              <option value="08:00 PM - 09:00 PM">08:00 PM - 09:00 PM</option>
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                              Delivery Address *
                            </label>
                            <textarea
                              name="address"
                              id="address"
                              required
                              value={formData.address}
                              onChange={handleChange}
                              rows={3}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                              placeholder="Enter complete delivery address"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Step 2: Meal Preferences */}
                {step === 1 && (
                  <div className="animate-slide-in-right">
                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Number of Roti *
                            </label>
                            <input
                              type="number"
                              name="preferences-rotiCount"
                              min="1"
                              max="20"
                              value={formData.preferences.rotiCount}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Include Rice?
                            </label>
                            <select
                              name="preferences-rice"
                              value={formData.preferences.rice}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Spice Level
                            </label>
                            <select
                              name="preferences-spiceLevel"
                              value={formData.preferences.spiceLevel}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            >
                              <option value="Mild">🌶️ Mild</option>
                              <option value="Medium">🌶️🌶️ Medium</option>
                              <option value="Spicy">🌶️🌶️🌶️ Spicy</option>
                            </select>
                          </div>

                          <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Special Instructions
                            </label>
                            <textarea
                              name="preferences-notes"
                              value={formData.preferences.notes}
                              onChange={handleChange}
                              rows={3}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                              placeholder="Any special dietary requirements or cooking instructions..."
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Step 3: Schedule/Plan or Order Details */}
                {step === 2 && (
                  <div className="animate-slide-in-right">
                    {isSubscribed ? (
                      <div className="space-y-6">
                        {/* Meal Plan */}
                        <Card className="border-l-4 border-l-blue-500">
                          <CardHeader>
                            <CardTitle className="text-blue-700 flex items-center">
                              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Meal Plan Selection
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {/* Lunch Option */}
                              <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${formData.plan.lunch.subscribed
                                  ? 'border-blue-300 bg-blue-50'
                                  : 'border-gray-200 bg-gray-50'
                                }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <input
                                      type="checkbox"
                                      id="lunch-subscribed"
                                      name="plan-lunch-subscribed"
                                      checked={formData.plan.lunch.subscribed}
                                      onChange={handleChange}
                                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <div>
                                      <label htmlFor="lunch-subscribed" className="font-semibold text-gray-900 cursor-pointer">
                                        🍛 Lunch Subscription
                                      </label>
                                      <p className="text-sm text-gray-600">Daily lunch delivery</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-600">₹</span>
                                    <input
                                      type="number"
                                      name="plan-lunch-price"
                                      placeholder="Price per tiffin"
                                      value={formData.plan.lunch.price}
                                      onChange={handleChange}
                                      disabled={!formData.plan.lunch.subscribed}
                                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Dinner Option */}
                              <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${formData.plan.dinner.subscribed
                                  ? 'border-blue-300 bg-blue-50'
                                  : 'border-gray-200 bg-gray-50'
                                }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <input
                                      type="checkbox"
                                      id="dinner-subscribed"
                                      name="plan-dinner-subscribed"
                                      checked={formData.plan.dinner.subscribed}
                                      onChange={handleChange}
                                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <div>
                                      <label htmlFor="dinner-subscribed" className="font-semibold text-gray-900 cursor-pointer">
                                        🍽️ Dinner Subscription
                                      </label>
                                      <p className="text-sm text-gray-600">Daily dinner delivery</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-600">₹</span>
                                    <input
                                      type="number"
                                      name="plan-dinner-price"
                                      placeholder="Price per tiffin"
                                      value={formData.plan.dinner.price}
                                      onChange={handleChange}
                                      disabled={!formData.plan.dinner.subscribed}
                                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                              <div>
                                <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-2">
                                  Start Date *
                                </label>
                                <input
                                  type="date"
                                  name="plan-startDate"
                                  id="startDate"
                                  required
                                  value={formData.plan.startDate}
                                  onChange={handleChange}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                              </div>
                              <div>
                                <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-2">
                                  End Date <span className="text-gray-500">(Optional)</span>
                                </label>
                                <input
                                  type="date"
                                  name="plan-endDate"
                                  id="endDate"
                                  value={formData.plan.endDate}
                                  onChange={handleChange}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Weekly Schedule */}
                        <Card className="border-l-4 border-l-purple-500">
                          <CardHeader>
                            <CardTitle className="text-purple-700 flex items-center">
                              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                              Weekly Delivery Schedule
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                              {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => (
                                <label
                                  key={day}
                                  className={`flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${formData.deliverySchedule[day]
                                      ? 'border-purple-300 bg-purple-50 text-purple-700'
                                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-purple-200'
                                    }`}
                                >
                                  <input
                                    type="checkbox"
                                    name={`schedule-${day}`}
                                    checked={formData.deliverySchedule[day]}
                                    onChange={handleChange}
                                    className="sr-only"
                                  />
                                  <span className="font-semibold text-sm capitalize">{day.substring(0, 3)}</span>
                                  <span className="text-xs capitalize mt-1">{day}</span>
                                </label>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : isOnDemand ? (
                      <Card className="border-l-4 border-l-orange-500">
                        <CardHeader>
                          <CardTitle className="text-orange-700 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                            Order Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label htmlFor="plan-date" className="block text-sm font-semibold text-gray-700 mb-2">
                                Order Date *
                              </label>
                              <input
                                type="date"
                                name="plan-date"
                                id="plan-date"
                                required
                                value={formData.plan.date}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                              />
                            </div>

                            <div>
                              <label htmlFor="plan-mealType" className="block text-sm font-semibold text-gray-700 mb-2">
                                Meal Type *
                              </label>
                              <select
                                name="plan-mealType"
                                id="plan-mealType"
                                value={formData.plan.mealType}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                              >
                                <option value="lunch">🍛 Lunch</option>
                                <option value="dinner">🍽️ Dinner</option>
                              </select>
                            </div>

                            <div className="md:col-span-2">
                              <label htmlFor="plan-price" className="block text-sm font-semibold text-gray-700 mb-2">
                                Price per Tiffin *
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">₹</span>
                                <input
                                  type="number"
                                  name="plan-price"
                                  id="plan-price"
                                  required
                                  value={formData.plan.price || ''}
                                  onChange={handleChange}
                                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                  placeholder="Enter price"
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}
                  </div>
                )}
              </div>
            </CardContent>

            {/* Navigation Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="secondary"
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  {step > 0 && (
                    <Button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      variant="outline"
                      className="px-6"
                    >
                      ← Back
                    </Button>
                  )}
                </div>

                <div className="flex space-x-3">
                  {step < 2 ? (
                    <Button
                      type="button"
                      onClick={() => canProceed() && setStep(step + 1)}
                      disabled={!canProceed()}
                      className="px-8"
                    >
                      Next →
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      loading={isSaving}
                      disabled={isSaving || !canProceed()}
                      className="px-8"
                    >
                      {isSaving ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </span>
                      ) : (
                        `Save ${mode === 'edit' ? 'Changes' : 'Client'}`
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
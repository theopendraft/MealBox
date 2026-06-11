// src/components/MilestoneCard.jsx
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { buildMilestoneLink } from '../utils/whatsapp';
import { MILESTONE_COPY } from '../utils/milestones';
import { useToast } from './ui/Toast';

export default function MilestoneCard({ notification }) {
  const { showSuccess } = useToast();
  const copy = MILESTONE_COPY[notification.milestone] || {
    emoji: '🎉', label: `${notification.milestone} Tiffins!`, message: `has reached ${notification.milestone} tiffins!`
  };

  const handleDismiss = async () => {
    try {
      await updateDoc(doc(db, 'notifications', notification.id), { read: true });
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  const handleWhatsApp = () => {
    if (!notification.customerPhone) {
      showSuccess('No phone number on record — update the customer profile first.');
      return;
    }
    const link = buildMilestoneLink(
      { name: notification.customerName, phone: notification.customerPhone },
      notification.milestone
    );
    window.open(link, '_blank');
    handleDismiss();
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 shadow-sm animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-3xl leading-none flex-shrink-0 mt-0.5">{copy.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-amber-900 text-sm">{copy.label}</div>
            <div className="text-amber-800 text-sm mt-0.5">
              <strong>{notification.customerName}</strong> {copy.message}
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-amber-100 text-amber-400 transition-colors"
          title="Dismiss"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleWhatsApp}
          className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          💬 Send Loyalty Message
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 text-sm font-semibold transition-colors"
        >
          Later
        </button>
      </div>
    </div>
  );
}

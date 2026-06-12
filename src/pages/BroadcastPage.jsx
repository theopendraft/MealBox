// src/pages/BroadcastPage.jsx
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings';

const TEMPLATES = [
  {
    id: 'custom',
    label: 'Custom',
    emoji: '✏️',
    text: '',
    placeholder: 'Type your message here…',
  },
  {
    id: 'sunday',
    label: 'Sunday Special',
    emoji: '🍛',
    text: 'This Sunday: Special [Dish Name] Tiffin at our regular price! 🍱\nLimited slots — reply YES to confirm by Saturday 8pm.',
    placeholder: '',
  },
  {
    id: 'closed',
    label: 'Day Off',
    emoji: '🔒',
    text: 'MealBox will be CLOSED tomorrow [Date].\nSorry for the inconvenience — see you the day after! 🙏',
    placeholder: '',
  },
  {
    id: 'promo',
    label: 'Promo Offer',
    emoji: '🎁',
    text: 'Special offer this week: [describe your offer].\nReply YES to confirm! 🎉',
    placeholder: '',
  },
];

const FILTERS = [
  { id: 'all',       label: 'All Active' },
  { id: 'regular',   label: 'Regular' },
  { id: 'trial',     label: 'Trial' },
  { id: 'customize', label: 'Customize' },
  { id: 'premium',   label: 'Premium' },
];

const buildLink = (phone, message) =>
  `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;

export default function BroadcastPage() {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const planMap = Object.fromEntries((settings.plans || []).map(p => [p.id, p]));
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [messageText, setMessageText] = useState('');
  const [recipientFilter, setRecipientFilter] = useState('all');
  const [linksGenerated, setLinksGenerated] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    getDocs(
      query(collection(db, 'clients'), where('ownerId', '==', currentUser.uid), where('status', '==', 'active'))
    ).then(snap => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [currentUser]);

  const handleTemplateSelect = (id) => {
    setSelectedTemplate(id);
    setLinksGenerated(false);
    const tmpl = TEMPLATES.find(t => t.id === id);
    if (tmpl && tmpl.text) setMessageText(tmpl.text);
    else if (id === 'custom') setMessageText('');
  };

  const recipients = useMemo(() => {
    if (recipientFilter === 'all') return clients;
    return clients.filter(c => c.planType === recipientFilter);
  }, [clients, recipientFilter]);

  const handleGenerate = () => {
    if (!messageText.trim()) return;
    setLinksGenerated(true);
  };

  const activePlanFilters = useMemo(() => {
    const used = new Set(clients.map(c => c.planType).filter(Boolean));
    return FILTERS.filter(f => f.id === 'all' || used.has(f.id));
  }, [clients]);

  const businessName = settings?.businessName || 'MealBox';

  // Personalize message: replace {name} with customer name
  const personalize = (text, customer) =>
    text.replace(/\{name\}/gi, customer.name).replace(/\[name\]/gi, customer.name);

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/clients')}
          className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 font-bold text-lg transition-colors"
        >
          ←
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Broadcast</h1>
          <p className="text-xs text-gray-400">Send a message to multiple customers</p>
        </div>
      </div>

      {/* Template selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Message Template</h3>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map(tmpl => (
            <button
              key={tmpl.id}
              onClick={() => handleTemplateSelect(tmpl.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                selectedTemplate === tmpl.id
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{tmpl.emoji}</span>
              <span>{tmpl.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message textarea */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Message</h3>
          <span className="text-xs text-gray-400">{messageText.length} chars</span>
        </div>
        <textarea
          value={messageText}
          onChange={e => { setMessageText(e.target.value); setLinksGenerated(false); }}
          placeholder={TEMPLATES.find(t => t.id === selectedTemplate)?.placeholder || 'Type your message…'}
          rows={6}
          className="w-full text-sm text-gray-800 bg-gray-50 rounded-xl p-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        />
        <p className="text-xs text-gray-400 mt-2">
          Tip: Use <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> to personalise with the customer's name.
        </p>
      </div>

      {/* Recipient filter */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Send To</h3>
        <div className="flex flex-wrap gap-2">
          {activePlanFilters.map(f => (
            <button
              key={f.id}
              onClick={() => { setRecipientFilter(f.id); setLinksGenerated(false); }}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                recipientFilter === f.id
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
              {f.id === 'all'
                ? ` (${clients.length})`
                : ` (${clients.filter(c => c.planType === f.id).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!messageText.trim() || recipients.length === 0 || loading}
        className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        💬 Generate {recipients.length} WhatsApp Link{recipients.length !== 1 ? 's' : ''}
      </button>

      {/* Generated links */}
      {linksGenerated && recipients.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-green-50 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-green-800">Ready to Send</h3>
              <p className="text-xs text-green-600 mt-0.5">Tap each link to open WhatsApp</p>
            </div>
            <span className="text-sm font-bold text-green-700">{recipients.length} recipients</span>
          </div>

          <div className="divide-y divide-gray-50">
            {recipients.map(client => {
              const plan = planMap[client.planType];
              const msg = personalize(messageText, client);
              const link = buildLink(client.phone, msg);
              return (
                <div key={client.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-800 text-sm truncate">{client.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {plan && (
                          <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${planMap[client.planType]?.badgeColor ?? 'bg-gray-500 text-white'}`}>
                            {plan.label}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{client.phone}</span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 ml-3 flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                  >
                    Open ↗
                  </a>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Tap each link, send the message, then come back for the next one.
            </p>
          </div>
        </div>
      )}

      {linksGenerated && recipients.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <p className="text-gray-500 text-sm">No active clients match the selected filter.</p>
        </div>
      )}
    </div>
  );
}

// src/utils/whatsapp.js
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const formatDateShort = (dateStr) => {
  const [, mon, day] = dateStr.split('-');
  return `${day} ${SHORT_MONTHS[parseInt(mon) - 1]}`;
};

const formatModifiersSuffix = (record) => {
  const mods = [];
  const extras = record.billingModifiers || [];
  const chapati = extras.filter(m => m.type === 'extraChapati').reduce((s, m) => s + (m.qty || 0), 0);
  if (chapati > 0) mods.push(`+${chapati} roti`);
  if (extras.some(m => m.type === 'extraCurd')) mods.push('+Curd');
  if (extras.some(m => m.type === 'extraSide')) mods.push('+Side');
  return mods.length ? ` (${mods.join(', ')})` : '';
};

export const buildBillLink = (customer, cycle, dailyRecords, settings) => {
  const [year, mon] = cycle.month.split('-');
  const monthName = `${FULL_MONTHS[parseInt(mon) - 1]} ${year}`;

  const lines = [...dailyRecords]
    .filter(r => r.status === 'locked' || r.status === 'delivered')
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => {
      const planLabel = r.planType ? (r.planType.charAt(0).toUpperCase() + r.planType.slice(1)) : '';
      return `${formatDateShort(r.date)} — ${planLabel}${formatModifiersSuffix(r)} ₹${r.dayTotal || r.basePriceSnapshot}`;
    })
    .join('\n');

  const upi = settings?.upiId || 'Not configured';

  const message =
    `*MealBox Tiffin — Monthly Bill*\n\n` +
    `Hi ${customer.name} 🙏\n\n` +
    `Your bill for *${monthName}*:\n\n` +
    `${lines}\n\n` +
    `Total Delivered: ${cycle.totalDelivered} days\n` +
    `*Total Due: ₹${cycle.totalAmount}*\n\n` +
    `Pay via UPI: ${upi}\n\n` +
    `Thank you! 🍱`;

  return `https://wa.me/91${customer.phone}?text=${encodeURIComponent(message)}`;
};

export const buildReminderLink = (customer, cycle, settings) => {
  const [year, mon] = cycle.month.split('-');
  const monthName = `${FULL_MONTHS[parseInt(mon) - 1]} ${year}`;
  const upi = settings?.upiId || 'Not configured';

  const message =
    `Hi ${customer.name},\n\n` +
    `A gentle reminder that your MealBox bill of *₹${cycle.totalAmount}* for ${monthName} is pending.\n\n` +
    `Pay via UPI: ${upi}\n\n` +
    `Thanks 🙏`;

  return `https://wa.me/91${customer.phone}?text=${encodeURIComponent(message)}`;
};

export const buildBroadcastLink = (customer, messageText) => {
  const msg = messageText
    .replace(/\{name\}/gi, customer.name)
    .replace(/\[name\]/gi, customer.name);
  return `https://wa.me/91${customer.phone}?text=${encodeURIComponent(msg)}`;
};

export const buildMilestoneLink = (customer, count) => {
  const message =
    `Hi ${customer.name}! 🎉\n\n` +
    `You've completed *${count} tiffins* with MealBox!\n` +
    `Thank you so much for your trust and loyalty.\n\n` +
    `See you tomorrow! — MealBox 🍱`;

  return `https://wa.me/91${customer.phone}?text=${encodeURIComponent(message)}`;
};

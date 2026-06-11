// src/utils/pdfGenerator.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PLAN_TYPES } from '../config/plans';

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

const fmtDate = (src) => {
  if (!src) return 'N/A';
  const d = src.toDate ? src.toDate() : new Date(src);
  if (isNaN(d)) return 'N/A';
  return `${String(d.getDate()).padStart(2,'0')}-${d.toLocaleString('default',{month:'short'})}-${d.getFullYear()}`;
};

const monthLabel = (month) => {
  if (!month) return '';
  const [y, m] = month.split('-');
  return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
};

const MODIFIER_LABELS = {
  extraChapati: 'Extra Chapati',
  extraCurd:    'Extra Curd',
  extraSide:    'Extra Side Dish',
};

// ─── Colour palette ────────────────────────────────────────────
const C = {
  red:   [220, 38,  38],
  dark:  [15,  23,  42],
  mid:   [71,  85, 105],
  light: [148, 163, 184],
  bg:    [248, 250, 252],
  rule:  [226, 232, 240],
  white: [255, 255, 255],
  green: [22,  163,  74],
};

// ─── Helpers ───────────────────────────────────────────────────
const setFill  = (doc, c) => doc.setFillColor(...c);
const setStroke= (doc, c) => doc.setDrawColor(...c);
const setTxt   = (doc, c) => doc.setTextColor(...c);
const bold     = (doc)    => doc.setFont('helvetica', 'bold');
const normal   = (doc)    => doc.setFont('helvetica', 'normal');

// ─── Main builder ──────────────────────────────────────────────
export const buildBillDoc = (cycle, client, settings = {}, qrDataURL = null, modifiers = [], logoDataURL = null) => {
  const doc  = new jsPDF({ unit: 'mm', format: 'a4' });
  const W    = 210;
  const plan = PLAN_TYPES[client?.planType];
  const biz  = settings.businessName || 'MealBox Tiffin Service';

  // ══════════════════════════════════════════════════════════════
  // 1. HEADER BAND  (red, 52 mm tall)
  // ══════════════════════════════════════════════════════════════
  setFill(doc, C.red);
  doc.rect(0, 0, W, 52, 'F');

  // Logo — actual PNG if provided, else white circle with initial as fallback
  if (logoDataURL) {
    // White rounded background so logo sits cleanly on the red band
    setFill(doc, C.white);
    doc.roundedRect(12, 10, 30, 30, 4, 4, 'F');
    doc.addImage(logoDataURL, 'PNG', 13, 11, 28, 28);
  } else {
    setFill(doc, C.white);
    doc.circle(26, 26, 13, 'F');
    bold(doc);
    doc.setFontSize(18);
    setTxt(doc, C.red);
    doc.text(biz.charAt(0).toUpperCase(), 26, 30.5, { align: 'center' });
  }

  // Business name
  bold(doc);
  doc.setFontSize(17);
  setTxt(doc, C.white);
  doc.text(biz, 46, 18);

  // Address lines under business name
  normal(doc);
  doc.setFontSize(8);
  setTxt(doc, [255, 180, 180]);
  let leftY = 24.5;
  if (settings.businessAddress) {
    const lines = doc.splitTextToSize(settings.businessAddress, 95);
    lines.forEach(ln => { doc.text(ln, 46, leftY); leftY += 5; });
  }
  if (settings.ownerName) {
    doc.text(`Owner: ${settings.ownerName}`, 46, leftY);
  }

  // Right-side contact block
  normal(doc);
  doc.setFontSize(8.5);
  setTxt(doc, C.white);
  const RX = W - 14;
  let ry = 14;
  if (settings.phone) {
    
    normal(doc);
    doc.text(settings.phone, RX - 24, ry);
    ry += 7;
  }
  if (settings.email) {
    
    normal(doc);
    // clip long emails
    const em = settings.email.length > 22 ? settings.email.slice(0, 22) + '…' : settings.email;
    doc.text(em, RX - 36, ry);
    ry += 7;
  }
  if (settings.upiId) {
    
    normal(doc);
    doc.text(settings.upiId, RX - 26, ry);
  }

  // ══════════════════════════════════════════════════════════════
  // 2. INVOICE TITLE STRIP  (dark, 11 mm)
  // ══════════════════════════════════════════════════════════════
  setFill(doc, C.dark);
  doc.rect(0, 52, W, 11, 'F');
  bold(doc);
  doc.setFontSize(9);
  setTxt(doc, C.white);
  doc.setCharSpace(3.5);
  doc.text('TIFFIN INVOICE', W / 2.5, 59.5, { align: 'center' });
  doc.setCharSpace(0);

  // ══════════════════════════════════════════════════════════════
  // 3. BILL-TO  +  INVOICE DETAILS  (two columns)
  // ══════════════════════════════════════════════════════════════
  const INFO_TOP = 72;
  const MID_X    = W / 2;

  // Vertical rule between columns
  setStroke(doc, C.rule);
  doc.setLineWidth(0.4);
  doc.line(MID_X, INFO_TOP - 3, MID_X, INFO_TOP + 36);

  // ── Left: Bill To ──
  bold(doc);
  doc.setFontSize(7);
  setTxt(doc, C.light);
  doc.setCharSpace(1.5);
  doc.text('BILL TO', 14, INFO_TOP);
  doc.setCharSpace(0);

  bold(doc);
  doc.setFontSize(13);
  setTxt(doc, C.dark);
  doc.text(client?.name || 'N/A', 14, INFO_TOP + 8);

  normal(doc);
  doc.setFontSize(9);
  setTxt(doc, C.mid);
  let cy = INFO_TOP + 15;
  if (client?.phone)     { doc.text(`Phone   : ${client.phone}`,   14, cy); cy += 5.5; }
  if (client?.address)   { doc.text(`Address : ${client.address}`, 14, cy); cy += 5.5; }
  if (client?.routeArea) { doc.text(`Area    : ${client.routeArea}`, 14, cy); }

  // ── Right: Invoice Details ──
  bold(doc);
  doc.setFontSize(7);
  setTxt(doc, C.light);
  doc.setCharSpace(1.5);
  doc.text('INVOICE DETAILS', MID_X + 6, INFO_TOP);
  doc.setCharSpace(0);

  const meta = [
    ['Month',      monthLabel(cycle.month)],
    ['Generated',  fmtDate(cycle.generatedAt)],
    ['Deliveries', `${cycle.totalDelivered} day${cycle.totalDelivered !== 1 ? 's' : ''}`],
  ];
  meta.forEach(([lbl, val], i) => {
    const my = INFO_TOP + 8 + i * 6.5;
    normal(doc);
    doc.setFontSize(8.5);
    setTxt(doc, C.mid);
    doc.text(lbl, MID_X + 6, my);
    bold(doc);
    setTxt(doc, C.dark);
    doc.text(val, W - 14, my, { align: 'right' });
  });

  // Status badge
  const paid = cycle.status === 'paid';
  setFill(doc, paid ? C.green : C.red);
  doc.roundedRect(W - 36, INFO_TOP + 28, 22, 8, 4, 4, 'F');
  bold(doc);
  doc.setFontSize(7.5);
  setTxt(doc, C.white);
  doc.text((cycle.status || 'OPEN').toUpperCase(), W - 25, INFO_TOP + 33.5, { align: 'center' });

  // ══════════════════════════════════════════════════════════════
  // 4. TABLE
  // ══════════════════════════════════════════════════════════════
  const DIV_Y     = INFO_TOP + 42;
  setFill(doc, C.rule);
  doc.rect(0, DIV_Y, W, 0.6, 'F');

  const baseAmount   = plan ? plan.price * cycle.totalDelivered : cycle.totalAmount;
  const addonsAmount = cycle.totalAmount - baseAmount;
  const isOndemand   = client?.customerType === 'ondemand';

  const rows = [];

  // Base row
  rows.push([
    isOndemand ? 'One-Time Tiffin Order' : `${plan?.label || 'Tiffin'} Plan - Daily Delivery`,
    String(cycle.totalDelivered),
    plan ? `Rs.${plan.price}${isOndemand ? '' : '/day'}` : '-',
    `Rs.${baseAmount.toLocaleString('en-IN')}`,
  ]);

  // Modifier rows — individual breakdown if available
  if (modifiers.length > 0) {
    modifiers.forEach(m => {
      rows.push([
        MODIFIER_LABELS[m.type] || m.type,
        String(m.qty),
        `Rs.${m.rate} each`,
        `Rs.${m.total.toLocaleString('en-IN')}`,
      ]);
    });
  } else if (addonsAmount > 0) {
    rows.push(['Add-ons & extras', '-', '-', `Rs.${addonsAmount.toLocaleString('en-IN')}`]);
  }

  // Skipped days
  if (cycle.totalSkipped > 0) {
    rows.push([`Skipped / paused days`, String(cycle.totalSkipped), '-', 'Rs.0']);
  }

  // Total row
  rows.push([
    { content: 'TOTAL AMOUNT DUE', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fontSize: 10, textColor: [15, 23, 42] } },
    { content: `Rs.${cycle.totalAmount.toLocaleString('en-IN')}`, styles: { fontStyle: 'bold', fontSize: 10, textColor: [220, 38, 38], halign: 'right' } },
  ]);

  autoTable(doc, {
    head: [['Description', 'Days', 'Rate', 'Amount']],
    body: rows,
    startY: DIV_Y + 5,
    theme: 'plain',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 5, bottom: 5, left: 6, right: 6 },
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [15, 23, 42],
      cellPadding: { top: 4.5, bottom: 4.5, left: 6, right: 6 },
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'right',  cellWidth: 34 },
      3: { halign: 'right',  cellWidth: 34 },
    },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.3,
    margin: { left: 14, right: 14 },
  });

  const TABLE_END = doc.lastAutoTable.finalY;

  // ══════════════════════════════════════════════════════════════
  // 5. QR + PAYMENT SECTION
  // ══════════════════════════════════════════════════════════════
  if (qrDataURL) {
    const QR_TOP = TABLE_END + 10;
    const QR_H   = 52;

    // Card background
    setFill(doc, C.bg);
    setStroke(doc, C.rule);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, QR_TOP, W - 28, QR_H, 5, 5, 'FD');

    // QR image
    doc.addImage(qrDataURL, 'PNG', 22, QR_TOP + 8, 36, 36);

    // Text beside QR
    bold(doc);
    doc.setFontSize(11);
    setTxt(doc, C.dark);
    doc.text('Scan to Pay', 66, QR_TOP + 16);

    normal(doc);
    doc.setFontSize(8.5);
    setTxt(doc, C.mid);
    if (settings.upiId) {
      doc.text(`UPI ID : ${settings.upiId}`, 66, QR_TOP + 23);
    }
    doc.text('PhonePe  ·  Google Pay  ·  Paytm  ·  Any UPI app', 66, QR_TOP + 30);

    // Amount highlight
    bold(doc);
    doc.setFontSize(13);
    setTxt(doc, C.red);
    doc.text(`Rs.${cycle.totalAmount.toLocaleString('en-IN')}`, 66, QR_TOP + 41);
    normal(doc);
    doc.setFontSize(8);
    setTxt(doc, C.mid);
    doc.text('Amount to pay', 66, QR_TOP + 47);
  }

  // ══════════════════════════════════════════════════════════════
  // 6. FOOTER
  // ══════════════════════════════════════════════════════════════
  const PAGE_H = doc.internal.pageSize.height;
  setFill(doc, C.dark);
  doc.rect(0, PAGE_H - 20, W, 20, 'F');

  bold(doc);
  doc.setFontSize(9);
  setTxt(doc, C.white);
  doc.text(`Thank you for choosing ${biz}!`, W / 2, PAGE_H - 12, { align: 'center' });

  const contactLine = [settings.phone, settings.email].filter(Boolean).join('   |   ');
  if (contactLine) {
    normal(doc);
    doc.setFontSize(7.5);
    setTxt(doc, C.light);
    doc.text(contactLine, W / 2, PAGE_H - 6, { align: 'center' });
  }

  return doc;
};

// ─── Convenience exports ───────────────────────────────────────
export const downloadBillPDF = (cycle, client, settings, qrDataURL, modifiers = []) => {
  const doc  = buildBillDoc(cycle, client, settings, qrDataURL, modifiers);
  const name = client?.name?.replace(/\s+/g, '_') || 'client';
  doc.save(`bill-${name}-${cycle.month}.pdf`);
};

export const shareBillPDF = async (cycle, client, settings, qrDataURL, modifiers = []) => {
  const doc      = buildBillDoc(cycle, client, settings, qrDataURL, modifiers);
  const name     = client?.name?.replace(/\s+/g, '_') || 'client';
  const filename = `bill-${name}-${cycle.month}.pdf`;
  const blob     = doc.output('blob');
  const file     = new File([blob], filename, { type: 'application/pdf' });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: `Bill - ${client?.name}`, text: `Tiffin bill for ${cycle.month}` });
  } else {
    doc.save(filename);
  }
};

// Backward-compat shim for GeneratePDFButton / BillsTable / BillDetailPage
export const generateBillPDF = (bill, client, qrCodeDataURL) => {
  const details        = bill.details || {};
  const totalDelivered =
    (details.lunchesDelivered  || 0) +
    (details.dinnersDelivered  || 0) +
    (details.mainOrder         ? 1 : 0) +
    (details.extraOrdersCount  || 0);

  const cycle = {
    month:          bill.billingMonth || (bill.id || '').substring(0, 7) || '',
    totalDelivered,
    totalSkipped:   0,
    totalAmount:    bill.finalAmount || 0,
    status:         bill.status || 'open',
    generatedAt:    bill.generatedAt || null,
  };

  const doc  = buildBillDoc(cycle, client, {}, qrCodeDataURL, []);
  const name = client?.name?.replace(/\s+/g, '_') || 'client';
  doc.save(`invoice-${name}.pdf`);
};

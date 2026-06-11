// src/components/BillPDFButton.jsx
import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { buildBillDoc } from '../utils/pdfGenerator';
import { fetchModifierBreakdown } from '../utils/cycles';
import { useSettings } from '../hooks/useSettings';

export default function BillPDFButton({ client, cycle, className = '' }) {
  const { settings } = useSettings();
  const qrRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const upiLink = settings.upiId
    ? `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.businessName || 'MealBox')}&am=${cycle.totalAmount}&cu=INR`
    : null;

  const getQR = () => qrRef.current?.querySelector('canvas')?.toDataURL('image/png') ?? null;

  const fetchLogo = async () => {
    try {
      const resp = await fetch('/MealBox.png');
      if (!resp.ok) return null;
      const blob = await resp.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const handlePress = async () => {
    setLoading(true);
    try {
      const [modifiers, logoDataURL] = await Promise.all([
        fetchModifierBreakdown(client.id, cycle.month),
        fetchLogo(),
      ]);
      const doc = buildBillDoc(cycle, client, settings, getQR(), modifiers, logoDataURL);
      const name = client?.name?.replace(/\s+/g, '_') || 'client';
      const filename = `bill-${name}-${cycle.month}.pdf`;

      // Always download immediately
      doc.save(filename);

      // Also open share sheet if supported (runs in parallel with the download)
      const blob = doc.output('blob');
      const file = new File([blob], filename, { type: 'application/pdf' });
      if (navigator.canShare?.({ files: [file] })) {
        navigator.share({ files: [file], title: `Bill – ${client?.name}`, text: `Tiffin bill for ${cycle.month}` })
          .catch(() => {}); // ignore AbortError if user dismisses share sheet
      }
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handlePress}
        disabled={loading}
        className={`flex-1 py-2 rounded-xl bg-violet-100 text-violet-700 text-xs font-semibold hover:bg-violet-200 disabled:opacity-50 transition-colors ${className}`}
      >
        {loading ? '…' : '📄 PDF'}
      </button>
      {/* Hidden canvas — only rendered when UPI is configured */}
      {upiLink && (
        <div ref={qrRef} className="hidden">
          <QRCodeCanvas value={upiLink} size={256} />
        </div>
      )}
    </>
  );
}

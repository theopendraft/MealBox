// src/components/GeneratePDFButton.jsx
import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { generateBillPDF } from '../utils/pdfGenerator';

// Replace with your actual UPI ID and name
const UPI_ID = "9174867756@ybl";
const RECIPIENT_NAME = "MealBox Tiffin Service";

export default function GeneratePDFButton({ bill, client }) {
  const qrCodeRef = useRef(null);

  const handleDownload = () => {
    // Construct the UPI payment link
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(RECIPIENT_NAME)}&am=${bill.finalAmount}&cu=INR&tn=Bill for ${bill.billingMonth}`;

    // Get the canvas element from the hidden QR code
    const canvas = qrCodeRef.current.querySelector('canvas');
    if (canvas) {
      const qrCodeDataURL = canvas.toDataURL('image/png');
      generateBillPDF(bill, client, qrCodeDataURL);
    }
  };

  return (
    <>
      <button onClick={handleDownload} className="text-red-600 hover:text-red-900">
        Download PDF
      </button>
      {/* This QR code is rendered but hidden, just so we can get its image data */}
      <div ref={qrCodeRef} style={{ display: 'none' }}>
        <QRCodeCanvas value={`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(RECIPIENT_NAME)}&am=${bill.finalAmount}&cu=INR&tn=Bill for ${bill.billingMonth}`} size={256} />
      </div>
    </>
  );
}
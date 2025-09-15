// src/utils/pdfGenerator.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateBillPDF = (bill, client, qrCodeDataURL) => {
  const doc = new jsPDF();

  // --- Helper Function for Date Formatting ---
  const formatDate = (dateSource) => {
    if (!dateSource) return "N/A";
    // Firestore timestamps need to be converted to JS Date objects
    const date = dateSource.toDate ? dateSource.toDate() : new Date(dateSource);
    if (isNaN(date)) return "N/A";

    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // --- 1. Restaurant-Style Header ---
  doc.setFillColor(30, 41, 59); // Dark slate gray
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("MealBox Tiffin Service", 105, 15, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Invoice", 105, 24, { align: "center" });

  // --- 2. Client & Bill Details Box ---
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.text(`Bill To: ${client?.name || "N/A"}`, 14, 45);
  doc.text(`Address: ${client?.address || "N/A"}`, 14, 50);
  doc.text(`Phone: ${client?.phone || "N/A"}`, 14, 55);

  const billPeriod = bill.billingMonth
    ? `For the month of ${bill.billingMonth}`
    : `For the period: ${formatDate(bill.billingPeriod?.start)} to ${formatDate(
        bill.billingPeriod?.end
      )}`;

  doc.text(`Bill ID: ${bill.id.substring(0, 10)}...`, 196, 45, {
    align: "right",
  });
  doc.text(`Date Issued: ${formatDate(bill.generatedAt)}`, 196, 50, {
    align: "right",
  });
  doc.text(billPeriod, 196, 55, { align: "right" });

  // --- 3. Invoice Table ---
  const tableColumn = ["Item Description", "Quantity", "Rate", "Amount"];
  const tableRows = [];
  const details = bill.details || {};

  if (details.lunchesDelivered > 0) {
    tableRows.push([
      "Subscription Lunch Tiffin",
      details.lunchesDelivered,
      `Rs.${details.lunchPrice}`,
      `Rs.${(details.lunchesDelivered * details.lunchPrice).toLocaleString(
        "en-IN"
      )}`,
    ]);
  }
  if (details.dinnersDelivered > 0) {
    tableRows.push([
      "Subscription Dinner Tiffin",
      details.dinnersDelivered,
      `Rs.${details.dinnerPrice}`,
      `Rs.${(details.dinnersDelivered * details.dinnerPrice).toLocaleString(
        "en-IN"
      )}`,
    ]);
  }
  if (details.extraOrdersCount > 0) {
    tableRows.push([
      "Extra / On-Demand Tiffins",
      details.extraOrdersCount,
      "-",
      `Rs.${details.extraOrdersAmount.toLocaleString("en-IN")}`,
    ]);
  }

  // Add a final row for the total amount
  tableRows.push([
    {
      content: "Total Amount Due",
      colSpan: 3,
      styles: { halign: "right", fontStyle: "bold" },
    },
    {
      content: `Rs.${(bill.finalAmount ?? 0).toLocaleString("en-IN")}`,
      styles: { fontStyle: "bold" },
    },
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 65,
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59], fontStyle: "bold" },
    footStyles: { fillColor: [230, 230, 230], fontStyle: "bold" },
    columnStyles: { 3: { halign: "right" } }, // Right-align the Amount column
  });

  const finalY = doc.lastAutoTable.finalY;

  // --- 4. QR Code & Payment Info ---
  if (qrCodeDataURL) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Scan QR Code to Pay:", 14, finalY + 15);
    doc.addImage(qrCodeDataURL, "PNG", 14, finalY + 20, 40, 40);
    // Add UPI text just below the QR code
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("UPI: 9174867756@ybl", 14, finalY + 70);
  }

  // --- 5. Footer ---
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("Thank you for choosing MealBox!", 105, pageHeight - 15, {
    align: "center",
  });
  doc.text(
    "For any queries, please contact us at +91-9174867756 or mealbox@gmail.com",
    105,
    pageHeight - 10,
    { align: "center" }
  );

  // --- 6. Save the PDF ---
  const fileName = `invoice-${
    client?.name?.replace(/\s/g, "_") || "client"
  }.pdf`;
  doc.save(fileName);
};

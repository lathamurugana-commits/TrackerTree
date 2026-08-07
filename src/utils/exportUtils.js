import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exports transaction data to Excel file
 * @param {Array} data - List of transaction objects
 * @param {String} reportType - e.g. "income", "expense", "all"
 * @param {String} rangeName - e.g. "Daily", "Weekly", "Monthly", "Yearly"
 */
export const exportToExcel = (data, reportType = 'all', rangeName = '') => {
  const formattedData = data.map((item, index) => {
    const base = {
      'S.No': index + 1,
      'Date': item.date,
      'Type': item.type.toUpperCase(),
      'Category': item.category,
      'Amount (INR)': item.amount,
      'Payment Mode': item.payment_mode,
      'Notes': item.notes || ''
    };

    if (reportType === 'income' || item.type === 'income') {
      return {
        ...base,
        'Student Name': item.student_name || 'N/A',
        'Course': item.course || 'N/A',
        'Transaction ID': item.transaction_id || 'N/A'
      };
    } else {
      return {
        ...base,
        'Vendor': item.vendor || 'N/A',
        'Bill Attachment URL': item.bill_upload_url || 'N/A'
      };
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  
  // Set column widths
  const maxW = [{ wch: 6 }, { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
  worksheet['!cols'] = maxW;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  
  const titleType = reportType.charAt(0).toUpperCase() + reportType.slice(1);
  const filename = `OpenSkools_Finance_${titleType}_Report_${rangeName || new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

/**
 * Exports transaction data to a highly professional PDF document
 */
export const exportToPDF = (data, reportType = 'all', rangeName = '', stats = {}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [0, 138, 209]; // #008AD1

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');

  // Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('OPENSKOOLS FINANCE MANAGER', 14, 18);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  const subtitle = reportType === 'all' 
    ? `Financial Statement - ${rangeName || 'Overview'}`
    : `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Statement - ${rangeName || 'Overview'}`;
  doc.text(subtitle, 14, 25);
  
  doc.setFontSize(8);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);

  // Summary Metrics Section (Y: 50)
  doc.setTextColor(50, 50, 50);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('SUMMARY STATISTICS', 14, 48);

  const statsKeys = Object.keys(stats);
  if (statsKeys.length > 0) {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    
    // Draw card borders and text
    let xOffset = 14;
    statsKeys.forEach((key) => {
      // Metric box
      doc.setFillColor(245, 247, 250);
      doc.rect(xOffset, 52, 42, 20, 'F');
      doc.setDrawColor(220, 225, 230);
      doc.rect(xOffset, 52, 42, 20, 'S');

      // Metric Title
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(key, xOffset + 4, 57);

      // Metric Value
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(stats[key], xOffset + 4, 66);
      
      xOffset += 48;
    });
  }

  // Draw Line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 78, 196, 78);

  // Table header definitions
  let columns = [];
  let rows = [];

  if (reportType === 'income') {
    columns = ['S.No', 'Date', 'Student Name', 'Course', 'Category', 'Mode', 'Amount (INR)'];
    rows = data.map((item, index) => [
      index + 1,
      item.date,
      item.student_name || 'N/A',
      item.course || 'N/A',
      item.category,
      item.payment_mode,
      `Rs. ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ]);
  } else if (reportType === 'expense') {
    columns = ['S.No', 'Date', 'Vendor', 'Category', 'Mode', 'Amount (INR)'];
    rows = data.map((item, index) => [
      index + 1,
      item.date,
      item.vendor || 'N/A',
      item.category,
      item.payment_mode,
      `Rs. ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ]);
  } else {
    // Mixed
    columns = ['S.No', 'Date', 'Type', 'Category', 'Mode', 'Amount (INR)'];
    rows = data.map((item, index) => [
      index + 1,
      item.date,
      item.type.toUpperCase(),
      item.category,
      item.payment_mode,
      `Rs. ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ]);
  }

  // Generate Table
  autoTable(doc, {
    startY: 84,
    head: [columns],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 },
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const str = 'Page ' + doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(str, 196 - doc.getTextWidth(str), 287);
      doc.text('OpenSkools Finance Manager - Confidential', 14, 287);
    }
  });

  const titleType = reportType.charAt(0).toUpperCase() + reportType.slice(1);
  const filename = `OpenSkools_Finance_${titleType}_Report_${rangeName || new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

/**
 * Generic helper: loads any image from /public and returns { dataUrl, width, height }
 */
const loadImage = (src) => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          width: img.width,
          height: img.height
        });
      };
      img.onerror = () => resolve(null);
      img.src = src;
    } catch (e) {
      resolve(null);
    }
  });
};

// Convenience wrappers
const getLogoJpegDataUrl = () => loadImage('/logo.png');

/**
 * Generates an exact-match professional PDF bill receipt
 * @param {Object} tx - The transaction object
 * @param {Object|null} splitInfo - Optional split payment info { totalFee, totalPaid, balanceDue, installments }
 */
export const generateBillReceipt = async (tx, splitInfo = null) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4' // Standard A4 layout to match reference format
  });

  const primaryBlue = [0, 138, 209]; // #008AD1 Openskools Blue theme
  const lightBlueBg = [238, 246, 250]; // #EEF6FA Metadata Bar Background
  const textDark = [40, 50, 60];
  const textMuted = [100, 110, 120];
  const gridBorder = [225, 230, 235];

  // ----------------------------------------------------
  // 1. TOP HEADER LOGO (Left) & INSTITUTION CONTACT DETAILS (Right)
  // ----------------------------------------------------

  // Load all three images in parallel
  const [logoObj, signObj, sealObj] = await Promise.all([
    loadImage('/logo.png'),
    loadImage('/Sign.png'),
    loadImage('/Seal.png')
  ]);

  // Logo (top-left)
  if (logoObj && logoObj.dataUrl) {
    const targetW = 50;
    const aspectRatio = logoObj.height / logoObj.width;
    const targetH = Math.min(targetW * aspectRatio, 18);
    const drawW = targetH / aspectRatio;
    doc.addImage(logoObj.dataUrl, 'PNG', 15, 12, drawW, targetH);
  }

  // Institution Contact Details (Right aligned)
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Contact: contact@openskools.com', 195, 24, { align: 'right' });

  // ----------------------------------------------------
  // 2. MAIN TITLE
  // ----------------------------------------------------
  doc.setFont('Times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.text('PAYMENT RECEIPT', 105, 52, { align: 'center' });

  // ----------------------------------------------------
  // 3. METADATA BAR (Light Blue Box)
  // ----------------------------------------------------
  const metaY = 60;
  doc.setFillColor(lightBlueBg[0], lightBlueBg[1], lightBlueBg[2]);
  doc.rect(15, metaY, 180, 16, 'F');

  // Metadata Columns
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  // Col 1: Receipt Number
  doc.text('Receipt Number', 45, metaY + 5.5, { align: 'center' });
  const receiptNo = tx.receipt_no || `REC-${(tx.id || '').replace('tx-', '')}`;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(receiptNo.length > 20 ? 7.5 : 9);
  doc.text(`${receiptNo}`, 45, metaY + 11.5, { align: 'center' });

  // Col 2: Receipt Date
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Receipt Date', 105, metaY + 5.5, { align: 'center' });
  doc.setFont('Helvetica', 'bold');
  doc.text(`${tx.date || new Date().toISOString().split('T')[0]}`, 105, metaY + 11.5, { align: 'center' });

  // Col 3: Payment Method
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Payment Mode', 165, metaY + 5.5, { align: 'center' });
  doc.setFont('Helvetica', 'bold');
  doc.text(`${tx.payment_mode || 'Cash'}`, 165, metaY + 11.5, { align: 'center' });

  // ----------------------------------------------------
  // 4. STUDENT DETAILS
  // ----------------------------------------------------
  const custY = 86;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.text('Student Details:', 15, custY);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Student Name: ${tx.student_name || 'N/A'}`, 15, custY + 6);
  doc.text(`Course / Batch: ${tx.course || 'N/A'}`, 15, custY + 11);
  doc.text(`Fee Category: ${tx.category || 'Tuition Fee'}`, 15, custY + 16);
  if (tx.transaction_id && tx.transaction_id !== 'N/A') {
    doc.text(`Transaction Reference: ${tx.transaction_id}`, 15, custY + 21);
  }

  // ----------------------------------------------------
  // 5. TABLE SECTION (Aligned Columns, 3 Total Rows)
  // ----------------------------------------------------
  const tableY = 116;
  const colX = [15, 85, 112, 142, 168, 195]; // Column boundaries

  // Header Bar
  doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.rect(15, tableY, 180, 8, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('FEE PARTICULAR / COURSE', colX[0] + 3, tableY + 5.5);
  doc.text('QTY', (colX[1] + colX[2]) / 2, tableY + 5.5, { align: 'center' });
  doc.text('FEE AMOUNT', colX[3] - 2, tableY + 5.5, { align: 'right' });
  doc.text('TOTAL FEE', colX[4] - 2, tableY + 5.5, { align: 'right' });
  doc.text('TAX', colX[5] - 3, tableY + 5.5, { align: 'right' });

  // Table Body Rows (3 Total Grid Rows: 1 Data + 2 Blank)
  const rowHeight = 9;
  const numRows = 3;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
  doc.setLineWidth(0.2);

  const amount = Number(tx.amount || 0);
  const formattedAmt = amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  for (let i = 0; i < numRows; i++) {
    const currY = tableY + 8 + (i * rowHeight);

    // Draw horizontal bottom border
    doc.line(15, currY + rowHeight, 195, currY + rowHeight);

    // Populate Row 1 with actual transaction values
    if (i === 0) {
      const desc = tx.course ? `${tx.course} (${tx.category || 'Tuition Fee'})` : (tx.category || 'Tuition Fee');
      doc.text(desc, colX[0] + 3, currY + 5.8);
      doc.text('1', (colX[1] + colX[2]) / 2, currY + 5.8, { align: 'center' });
      doc.text(`Rs. ${formattedAmt}`, colX[3] - 2, currY + 5.8, { align: 'right' });
      doc.text(`Rs. ${formattedAmt}`, colX[4] - 2, currY + 5.8, { align: 'right' });
      doc.text('Rs. 0.00', colX[5] - 3, currY + 5.8, { align: 'right' });
    }
  }

  // Draw Vertical Column Dividers for Table Body
  const tableBottomY = tableY + 8 + (numRows * rowHeight);
  doc.line(15, tableY, 15, tableBottomY); // Outer Left
  doc.line(colX[1], tableY + 8, colX[1], tableBottomY); // Col 1/2 divider
  doc.line(colX[2], tableY + 8, colX[2], tableBottomY); // Col 2/3 divider
  doc.line(colX[3], tableY + 8, colX[3], tableBottomY); // Col 3/4 divider
  doc.line(colX[4], tableY + 8, colX[4], tableBottomY); // Col 4/5 divider
  doc.line(195, tableY, 195, tableBottomY); // Outer Right

  // ----------------------------------------------------
  // 6. SUMMARY & REMARKS SECTION
  // ----------------------------------------------------
  const summaryY = tableBottomY;

  // Remarks on Left (Only display if notes exist and not N/A)
  if (tx.notes && tx.notes.trim() !== '' && tx.notes !== 'N/A') {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`Remarks: ${tx.notes}`, 17, summaryY + 8);
  }

  // Summary Table on Right
  const sumColX = 135;
  const sumValX = 195;
  const sumRowH = 7;

  const fmtAmt = (n) => `Rs. ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (splitInfo) {
    // --- Split payment summary: Total Fee / Total Paid / Balance Due ---
    // Row 1: Amount This Payment
    doc.line(sumColX, summaryY + sumRowH, sumValX, summaryY + sumRowH);
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('Amount This Payment', sumColX + 3, summaryY + 5);
    doc.text(fmtAmt(tx.amount), sumValX - 3, summaryY + 5, { align: 'right' });

    // Row 2: Total Paid So Far
    doc.line(sumColX, summaryY + (sumRowH * 2), sumValX, summaryY + (sumRowH * 2));
    doc.text('Total Paid So Far', sumColX + 3, summaryY + sumRowH + 5);
    doc.text(fmtAmt(splitInfo.totalPaid), sumValX - 3, summaryY + sumRowH + 5, { align: 'right' });

    // Row 3: Balance Due (highlighted)
    const balanceColor = splitInfo.balanceDue > 0 ? [220, 100, 30] : [22, 163, 74];
    doc.setFillColor(splitInfo.balanceDue > 0 ? 255 : 240, splitInfo.balanceDue > 0 ? 247 : 253, splitInfo.balanceDue > 0 ? 237 : 244);
    doc.rect(sumColX, summaryY + (sumRowH * 2), sumValX - sumColX, sumRowH, 'F');
    doc.line(sumColX, summaryY + (sumRowH * 3), sumValX, summaryY + (sumRowH * 3));
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
    doc.text(splitInfo.balanceDue > 0 ? 'Balance Due' : 'Balance (Cleared)', sumColX + 3, summaryY + (sumRowH * 2) + 5);
    doc.text(splitInfo.balanceDue > 0 ? fmtAmt(splitInfo.balanceDue) : 'Rs. 0.00', sumValX - 3, summaryY + (sumRowH * 2) + 5, { align: 'right' });
  } else {
    // --- Standard full-payment summary ---
    doc.line(sumColX, summaryY + sumRowH, sumValX, summaryY + sumRowH);
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('Total Fees', sumColX + 3, summaryY + 5);
    doc.text(`Rs. ${formattedAmt}`, sumValX - 3, summaryY + 5, { align: 'right' });

    doc.line(sumColX, summaryY + (sumRowH * 2), sumValX, summaryY + (sumRowH * 2));
    doc.text('Tax (0%)', sumColX + 3, summaryY + sumRowH + 5);
    doc.text('Rs. 0.00', sumValX - 3, summaryY + sumRowH + 5, { align: 'right' });

    doc.setFillColor(248, 250, 252);
    doc.rect(sumColX, summaryY + (sumRowH * 2), sumValX - sumColX, sumRowH, 'F');
    doc.line(sumColX, summaryY + (sumRowH * 3), sumValX, summaryY + (sumRowH * 3));
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('Grand Total', sumColX + 3, summaryY + (sumRowH * 2) + 5);
    doc.text(`Rs. ${formattedAmt}`, sumValX - 3, summaryY + (sumRowH * 2) + 5, { align: 'right' });
  }

  // Summary Table Vertical Borders
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
  doc.setLineWidth(0.2);
  doc.line(sumColX, summaryY, sumColX, summaryY + (sumRowH * 3));
  doc.line(colX[4], summaryY, colX[4], summaryY + (sumRowH * 3));
  doc.line(sumValX, summaryY, sumValX, summaryY + (sumRowH * 3));

  // Proof of Payment Retention Note
  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    'Note: This receipt serves as proof of payment for the above-mentioned course. Please retain it for future reference.',
    15,
    summaryY + 30
  );

  // ----------------------------------------------------
  // 6b. PAYMENT HISTORY TABLE (split payments only)
  // ----------------------------------------------------
  let footerY = 245;
  if (splitInfo && splitInfo.installments && splitInfo.installments.length > 1) {
    const histY = summaryY + 38;
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(9);
    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.text('Payment History:', 15, histY);

    // Mini table headers
    const hdrY = histY + 4;
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(15, hdrY, 180, 6, 'F');
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('#', 18, hdrY + 4);
    doc.text('Date', 28, hdrY + 4);
    doc.text('Receipt No', 70, hdrY + 4);
    doc.text('Mode', 125, hdrY + 4);
    doc.text('Amount', 192, hdrY + 4, { align: 'right' });

    // Rows
    const rowH = 6;
    splitInfo.installments.forEach((inst, idx) => {
      const ry = hdrY + 6 + (idx * rowH);
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, ry, 180, rowH, 'F');
      }
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(`${idx + 1}`, 18, ry + 4);
      doc.text(inst.date, 28, ry + 4);
      doc.text(inst.receipt_no, 70, ry + 4);
      doc.text(inst.payment_mode, 125, ry + 4);
      doc.setFont('Helvetica', 'bold');
      doc.text(fmtAmt(inst.amount), 192, ry + 4, { align: 'right' });
      doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
      doc.setLineWidth(0.2);
      doc.line(15, ry + rowH, 195, ry + rowH);
    });

    // Total row
    const totalRowY = hdrY + 6 + (splitInfo.installments.length * rowH);
    doc.setFillColor(238, 246, 250);
    doc.rect(15, totalRowY, 180, rowH, 'F');
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.5);
    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.text('Total Paid', 125, totalRowY + 4);
    doc.text(fmtAmt(splitInfo.totalPaid), 192, totalRowY + 4, { align: 'right' });

    footerY = Math.max(245, totalRowY + rowH + 10);
  }

  // ----------------------------------------------------
  // 7. SIGNATURES & FOOTER
  // ----------------------------------------------------

  // sign.png — placed above the signature line
  if (signObj && signObj.dataUrl) {
    const signW = 40;
    const signAR = signObj.height / signObj.width;
    const signH = Math.min(signW * signAR, 14);
    doc.addImage(signObj.dataUrl, 'PNG', 15, footerY - signH - 2, signW, signH);
  }

  // Authorised Signature Line on Left
  doc.setLineWidth(0.4);
  doc.setDrawColor(200, 205, 210);
  doc.line(15, footerY, 75, footerY);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Authorised Signature', 15, footerY + 5);

  // seal.png — placed bottom-right
  if (sealObj && sealObj.dataUrl) {
    const sealSize = 28;
    doc.addImage(sealObj.dataUrl, 'PNG', 155, footerY - sealSize - 2, sealSize, sealSize);
  }

  // Bottom Centered Thank You Message
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('THANK YOU FOR YOUR PAYMENT!', 105, footerY + 22, { align: 'center' });

  // Save PDF file
  const filename = `Receipt_${(tx.student_name || 'Student').replace(/\s+/g, '_')}_${tx.date || 'Record'}.pdf`;
  doc.save(filename);
};

/**
 * Same as generateBillReceipt but returns { base64, filename } instead of downloading.
 * Used by the EmailJS send flow to attach the PDF to an outgoing email.
 * @param {Object} tx - The transaction object
 * @param {Object|null} splitInfo - Optional split payment info { totalFee, totalPaid, balanceDue, installments }
 * @returns {Promise<{ base64: string, filename: string }>}
 */
export const generateBillReceiptAsBase64 = async (tx, splitInfo = null) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const primaryBlue = [0, 138, 209];
  const lightBlueBg = [238, 246, 250];
  const textDark    = [40, 50, 60];
  const textMuted   = [100, 110, 120];
  const gridBorder  = [225, 230, 235];

  const [logoObj, signObj, sealObj] = await Promise.all([
    loadImage('/logo.png'),
    loadImage('/Sign.png'),
    loadImage('/Seal.png')
  ]);

  if (logoObj && logoObj.dataUrl) {
    const targetW = 50;
    const ar = logoObj.height / logoObj.width;
    const targetH = Math.min(targetW * ar, 18);
    doc.addImage(logoObj.dataUrl, 'PNG', 15, 12, targetH / ar, targetH);
  }

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Contact: contact@openskools.com', 195, 24, { align: 'right' });

  doc.setFont('Times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.text('PAYMENT RECEIPT', 105, 52, { align: 'center' });

  const metaY = 60;
  doc.setFillColor(lightBlueBg[0], lightBlueBg[1], lightBlueBg[2]);
  doc.rect(15, metaY, 180, 16, 'F');

  const receiptNo = tx.receipt_no || `REC-${(tx.id || '').replace('tx-', '')}`;
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Receipt Number', 45, metaY + 5.5, { align: 'center' });
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(receiptNo.length > 20 ? 7.5 : 9);
  doc.text(receiptNo, 45, metaY + 11.5, { align: 'center' });

  doc.setFont('Helvetica', 'normal'); doc.setFontSize(9);
  doc.text('Receipt Date', 105, metaY + 5.5, { align: 'center' });
  doc.setFont('Helvetica', 'bold');
  doc.text(tx.date || new Date().toISOString().split('T')[0], 105, metaY + 11.5, { align: 'center' });

  doc.setFont('Helvetica', 'normal'); doc.setFontSize(9);
  doc.text('Payment Mode', 165, metaY + 5.5, { align: 'center' });
  doc.setFont('Helvetica', 'bold');
  doc.text(tx.payment_mode || 'Cash', 165, metaY + 11.5, { align: 'center' });

  const custY = 86;
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(10);
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.text('Student Details:', 15, custY);

  doc.setFont('Helvetica', 'normal'); doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Student Name: ${tx.student_name || 'N/A'}`, 15, custY + 6);
  doc.text(`Course / Batch: ${tx.course || 'N/A'}`, 15, custY + 11);
  doc.text(`Fee Category: ${tx.category || 'Tuition Fee'}`, 15, custY + 16);
  if (tx.transaction_id && tx.transaction_id !== 'N/A') {
    doc.text(`Transaction Reference: ${tx.transaction_id}`, 15, custY + 21);
  }

  const tableY = 116;
  const colX   = [15, 85, 112, 142, 168, 195];
  doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.rect(15, tableY, 180, 8, 'F');
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('FEE PARTICULAR / COURSE', colX[0] + 3, tableY + 5.5);
  doc.text('QTY', (colX[1] + colX[2]) / 2, tableY + 5.5, { align: 'center' });
  doc.text('FEE AMOUNT', colX[3] - 2, tableY + 5.5, { align: 'right' });
  doc.text('TOTAL FEE', colX[4] - 2, tableY + 5.5, { align: 'right' });
  doc.text('TAX', colX[5] - 3, tableY + 5.5, { align: 'right' });

  const rowHeight = 9; const numRows = 3;
  const amount = Number(tx.amount || 0);
  const formattedAmt = amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  doc.setFont('Helvetica', 'normal'); doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
  doc.setLineWidth(0.2);

  for (let i = 0; i < numRows; i++) {
    const currY = tableY + 8 + (i * rowHeight);
    doc.line(15, currY + rowHeight, 195, currY + rowHeight);
    if (i === 0) {
      const desc = tx.course ? `${tx.course} (${tx.category || 'Tuition Fee'})` : (tx.category || 'Tuition Fee');
      doc.text(desc, colX[0] + 3, currY + 5.8);
      doc.text('1', (colX[1] + colX[2]) / 2, currY + 5.8, { align: 'center' });
      doc.text(`Rs. ${formattedAmt}`, colX[3] - 2, currY + 5.8, { align: 'right' });
      doc.text(`Rs. ${formattedAmt}`, colX[4] - 2, currY + 5.8, { align: 'right' });
      doc.text('Rs. 0.00', colX[5] - 3, currY + 5.8, { align: 'right' });
    }
  }

  const tableBottomY = tableY + 8 + (numRows * rowHeight);
  doc.line(15, tableY, 15, tableBottomY);
  doc.line(colX[1], tableY + 8, colX[1], tableBottomY);
  doc.line(colX[2], tableY + 8, colX[2], tableBottomY);
  doc.line(colX[3], tableY + 8, colX[3], tableBottomY);
  doc.line(colX[4], tableY + 8, colX[4], tableBottomY);
  doc.line(195, tableY, 195, tableBottomY);

  const summaryY = tableBottomY;
  if (tx.notes && tx.notes.trim() !== '' && tx.notes !== 'N/A') {
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`Remarks: ${tx.notes}`, 17, summaryY + 8);
  }

  const sumColX = 135; const sumValX = 195; const sumRowH = 7;
  const fmtAmt = (n) => `Rs. ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (splitInfo) {
    // Split payment summary
    doc.line(sumColX, summaryY + sumRowH, sumValX, summaryY + sumRowH);
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('Amount This Payment', sumColX + 3, summaryY + 5);
    doc.text(fmtAmt(tx.amount), sumValX - 3, summaryY + 5, { align: 'right' });

    doc.line(sumColX, summaryY + (sumRowH * 2), sumValX, summaryY + (sumRowH * 2));
    doc.text('Total Paid So Far', sumColX + 3, summaryY + sumRowH + 5);
    doc.text(fmtAmt(splitInfo.totalPaid), sumValX - 3, summaryY + sumRowH + 5, { align: 'right' });

    const balanceColor = splitInfo.balanceDue > 0 ? [220, 100, 30] : [22, 163, 74];
    doc.setFillColor(splitInfo.balanceDue > 0 ? 255 : 240, splitInfo.balanceDue > 0 ? 247 : 253, splitInfo.balanceDue > 0 ? 237 : 244);
    doc.rect(sumColX, summaryY + (sumRowH * 2), sumValX - sumColX, sumRowH, 'F');
    doc.line(sumColX, summaryY + (sumRowH * 3), sumValX, summaryY + (sumRowH * 3));
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
    doc.text(splitInfo.balanceDue > 0 ? 'Balance Due' : 'Balance (Cleared)', sumColX + 3, summaryY + (sumRowH * 2) + 5);
    doc.text(splitInfo.balanceDue > 0 ? fmtAmt(splitInfo.balanceDue) : 'Rs. 0.00', sumValX - 3, summaryY + (sumRowH * 2) + 5, { align: 'right' });
  } else {
    doc.line(sumColX, summaryY + sumRowH, sumValX, summaryY + sumRowH);
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('Total Fees', sumColX + 3, summaryY + 5);
    doc.text(`Rs. ${formattedAmt}`, sumValX - 3, summaryY + 5, { align: 'right' });

    doc.line(sumColX, summaryY + (sumRowH * 2), sumValX, summaryY + (sumRowH * 2));
    doc.text('Tax (0%)', sumColX + 3, summaryY + sumRowH + 5);
    doc.text('Rs. 0.00', sumValX - 3, summaryY + sumRowH + 5, { align: 'right' });

    doc.setFillColor(248, 250, 252);
    doc.rect(sumColX, summaryY + (sumRowH * 2), sumValX - sumColX, sumRowH, 'F');
    doc.line(sumColX, summaryY + (sumRowH * 3), sumValX, summaryY + (sumRowH * 3));
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('Grand Total', sumColX + 3, summaryY + (sumRowH * 2) + 5);
    doc.text(`Rs. ${formattedAmt}`, sumValX - 3, summaryY + (sumRowH * 2) + 5, { align: 'right' });
  }

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
  doc.setLineWidth(0.2);
  doc.line(sumColX, summaryY, sumColX, summaryY + (sumRowH * 3));
  doc.line(colX[4], summaryY, colX[4], summaryY + (sumRowH * 3));
  doc.line(sumValX, summaryY, sumValX, summaryY + (sumRowH * 3));

  doc.setFont('Helvetica', 'italic'); doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Note: This receipt serves as proof of payment for the above-mentioned course. Please retain it for future reference.', 15, summaryY + 30);

  // Payment history table for split payments
  let footerY = 245;
  if (splitInfo && splitInfo.installments && splitInfo.installments.length > 1) {
    const histY = summaryY + 38;
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(9);
    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.text('Payment History:', 15, histY);

    const hdrY = histY + 4;
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(15, hdrY, 180, 6, 'F');
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('#', 18, hdrY + 4);
    doc.text('Date', 28, hdrY + 4);
    doc.text('Receipt No', 70, hdrY + 4);
    doc.text('Mode', 125, hdrY + 4);
    doc.text('Amount', 192, hdrY + 4, { align: 'right' });

    const rowH = 6;
    splitInfo.installments.forEach((inst, idx) => {
      const ry = hdrY + 6 + (idx * rowH);
      if (idx % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(15, ry, 180, rowH, 'F'); }
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(`${idx + 1}`, 18, ry + 4);
      doc.text(inst.date, 28, ry + 4);
      doc.text(inst.receipt_no, 70, ry + 4);
      doc.text(inst.payment_mode, 125, ry + 4);
      doc.setFont('Helvetica', 'bold');
      doc.text(fmtAmt(inst.amount), 192, ry + 4, { align: 'right' });
      doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]); doc.setLineWidth(0.2);
      doc.line(15, ry + rowH, 195, ry + rowH);
    });

    const totalRowY = hdrY + 6 + (splitInfo.installments.length * rowH);
    doc.setFillColor(238, 246, 250); doc.rect(15, totalRowY, 180, rowH, 'F');
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.5);
    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.text('Total Paid', 125, totalRowY + 4);
    doc.text(fmtAmt(splitInfo.totalPaid), 192, totalRowY + 4, { align: 'right' });
    footerY = Math.max(245, totalRowY + rowH + 10);
  }
  if (signObj && signObj.dataUrl) {
    const signW = 40; const signAR = signObj.height / signObj.width;
    const signH = Math.min(signW * signAR, 14);
    doc.addImage(signObj.dataUrl, 'PNG', 15, footerY - signH - 2, signW, signH);
  }

  doc.setLineWidth(0.4); doc.setDrawColor(200, 205, 210);
  doc.line(15, footerY, 75, footerY);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Authorised Signature', 15, footerY + 5);

  if (sealObj && sealObj.dataUrl) {
    const sealSize = 28;
    doc.addImage(sealObj.dataUrl, 'PNG', 155, footerY - sealSize - 2, sealSize, sealSize);
  }

  doc.setFont('Helvetica', 'bold'); doc.setFontSize(10);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('THANK YOU FOR YOUR PAYMENT!', 105, footerY + 22, { align: 'center' });

  // Return as base64 string (strip the data URI prefix) + filename
  const base64 = doc.output('datauristring').split(',')[1];
  const filename = `Receipt_${(tx.student_name || 'Student').replace(/\s+/g, '_')}_${tx.date || 'Record'}.pdf`;
  return { base64, filename };
};


/**
 * Generates a professional PDF expense voucher matching the bill receipt theme exactly
 * @param {Object} tx - The transaction object
 */
export const generateExpenseVoucher = async (tx) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryBlue  = [0, 138, 209];   // #008AD1 — same header/accent colour as receipt
  const lightBlueBg  = [238, 246, 250]; // #EEF6FA — metadata bar background
  const textDark     = [40, 50, 60];
  const textMuted    = [100, 110, 120];
  const gridBorder   = [225, 230, 235];

  // ----------------------------------------------------
  // 1. TOP HEADER — LOGO (Left) & CONTACT (Right)
  // ----------------------------------------------------

  // Load all three images in parallel
  const [logoObj, signObj, sealObj] = await Promise.all([
    loadImage('/logo.png'),
    loadImage('/Sign.png'),
    loadImage('/Seal.png')
  ]);

  // Logo (top-left)
  if (logoObj && logoObj.dataUrl) {
    const targetW     = 50;
    const aspectRatio = logoObj.height / logoObj.width;
    const targetH     = Math.min(targetW * aspectRatio, 18);
    const drawW       = targetH / aspectRatio;
    doc.addImage(logoObj.dataUrl, 'PNG', 15, 12, drawW, targetH);
  }

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Contact: contact@openskools.com', 195, 24, { align: 'right' });

  // ----------------------------------------------------
  // 2. MAIN TITLE
  // ----------------------------------------------------
  doc.setFont('Times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.text('EXPENSE VOUCHER', 105, 52, { align: 'center' });

  // ----------------------------------------------------
  // 3. METADATA BAR (Light Blue Box — same as receipt)
  // ----------------------------------------------------
  const metaY = 60;
  doc.setFillColor(lightBlueBg[0], lightBlueBg[1], lightBlueBg[2]);
  doc.rect(15, metaY, 180, 16, 'F');

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  // Col 1: Voucher Number
  const voucherNo = tx.voucher_no || `VOU-${(tx.id || '').replace('tx-', '')}`;
  doc.text('Voucher Number', 45, metaY + 5.5, { align: 'center' });
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(voucherNo.length > 20 ? 7.5 : 9);
  doc.text(`${voucherNo}`, 45, metaY + 11.5, { align: 'center' });

  // Col 2: Voucher Date
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Voucher Date', 105, metaY + 5.5, { align: 'center' });
  doc.setFont('Helvetica', 'bold');
  doc.text(`${tx.date || new Date().toISOString().split('T')[0]}`, 105, metaY + 11.5, { align: 'center' });

  // Col 3: Payment Method
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Payment Mode', 165, metaY + 5.5, { align: 'center' });
  doc.setFont('Helvetica', 'bold');
  doc.text(`${tx.payment_mode || 'Cash'}`, 165, metaY + 11.5, { align: 'center' });

  // ----------------------------------------------------
  // 4. VENDOR / EXPENSE DETAILS
  // ----------------------------------------------------
  const custY = 86;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.text('Vendor / Expense Details:', 15, custY);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Vendor Name: ${tx.vendor || 'N/A'}`, 15, custY + 6);
  doc.text(`Expense Category: ${tx.category || 'General Expense'}`, 15, custY + 11);
  doc.text(`Payment Mode: ${tx.payment_mode || 'N/A'}`, 15, custY + 16);
  if (tx.transaction_id && tx.transaction_id !== 'N/A') {
    doc.text(`Transaction Reference: ${tx.transaction_id}`, 15, custY + 21);
  }

  // ----------------------------------------------------
  // 5. TABLE SECTION (same column structure as receipt)
  // ----------------------------------------------------
  const tableY = 116;
  const colX   = [15, 85, 112, 142, 168, 195];

  // Header Bar
  doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.rect(15, tableY, 180, 8, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('EXPENSE PARTICULAR / DESCRIPTION', colX[0] + 3, tableY + 5.5);
  doc.text('QTY', (colX[1] + colX[2]) / 2, tableY + 5.5, { align: 'center' });
  doc.text('UNIT AMOUNT', colX[3] - 2, tableY + 5.5, { align: 'right' });
  doc.text('TOTAL AMT', colX[4] - 2, tableY + 5.5, { align: 'right' });
  doc.text('TAX', colX[5] - 3, tableY + 5.5, { align: 'right' });

  // Table body rows (1 data + 2 blank)
  const rowHeight = 9;
  const numRows   = 3;
  const amount    = Number(tx.amount || 0);
  const formattedAmt = amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
  doc.setLineWidth(0.2);

  for (let i = 0; i < numRows; i++) {
    const currY = tableY + 8 + (i * rowHeight);
    doc.line(15, currY + rowHeight, 195, currY + rowHeight);

    if (i === 0) {
      const desc = `${tx.category || 'General Expense'}`;
      doc.text(desc, colX[0] + 3, currY + 5.8);
      doc.text('1', (colX[1] + colX[2]) / 2, currY + 5.8, { align: 'center' });
      doc.text(`Rs. ${formattedAmt}`, colX[3] - 2, currY + 5.8, { align: 'right' });
      doc.text(`Rs. ${formattedAmt}`, colX[4] - 2, currY + 5.8, { align: 'right' });
      doc.text('Rs. 0.00', colX[5] - 3, currY + 5.8, { align: 'right' });
    }
  }

  // Vertical column dividers
  const tableBottomY = tableY + 8 + (numRows * rowHeight);
  doc.line(15, tableY, 15, tableBottomY);
  doc.line(colX[1], tableY + 8, colX[1], tableBottomY);
  doc.line(colX[2], tableY + 8, colX[2], tableBottomY);
  doc.line(colX[3], tableY + 8, colX[3], tableBottomY);
  doc.line(colX[4], tableY + 8, colX[4], tableBottomY);
  doc.line(195, tableY, 195, tableBottomY);

  // ----------------------------------------------------
  // 6. SUMMARY & REMARKS SECTION (same layout as receipt)
  // ----------------------------------------------------
  const summaryY = tableBottomY;

  if (tx.notes && tx.notes.trim() !== '' && tx.notes !== 'N/A') {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`Remarks: ${tx.notes}`, 17, summaryY + 8);
  }

  // Summary block (right-aligned, same as receipt)
  const sumColX  = 135;
  const sumValX  = 195;
  const sumRowH  = 7;

  doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
  doc.setLineWidth(0.2);

  // Total Expense row
  doc.line(sumColX, summaryY + sumRowH, sumValX, summaryY + sumRowH);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Total Expense', sumColX + 3, summaryY + 5);
  doc.text(`Rs. ${formattedAmt}`, sumValX - 3, summaryY + 5, { align: 'right' });

  // Tax row
  doc.line(sumColX, summaryY + (sumRowH * 2), sumValX, summaryY + (sumRowH * 2));
  doc.text('Tax (0%)', sumColX + 3, summaryY + sumRowH + 5);
  doc.text('Rs. 0.00', sumValX - 3, summaryY + sumRowH + 5, { align: 'right' });

  // Grand Total row
  doc.setFillColor(248, 250, 252);
  doc.rect(sumColX, summaryY + (sumRowH * 2), sumValX - sumColX, sumRowH, 'F');
  doc.line(sumColX, summaryY + (sumRowH * 3), sumValX, summaryY + (sumRowH * 3));
  doc.setFont('Helvetica', 'bold');
  doc.text('Grand Total', sumColX + 3, summaryY + (sumRowH * 2) + 5);
  doc.text(`Rs. ${formattedAmt}`, sumValX - 3, summaryY + (sumRowH * 2) + 5, { align: 'right' });

  // Summary vertical borders
  doc.line(sumColX, summaryY, sumColX, summaryY + (sumRowH * 3));
  doc.line(colX[4], summaryY, colX[4], summaryY + (sumRowH * 3));
  doc.line(sumValX, summaryY, sumValX, summaryY + (sumRowH * 3));

  // Retention note
  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    'Note: This voucher serves as proof of expenditure. Please retain it for auditing and future reference.',
    15,
    summaryY + 30
  );

  // ----------------------------------------------------
  // 7. SIGNATURES & FOOTER (same as receipt)
  // ----------------------------------------------------
  const footerY = 245;

  // sign.png — placed above the signature line
  if (signObj && signObj.dataUrl) {
    const signW = 40;
    const signAR = signObj.height / signObj.width;
    const signH = Math.min(signW * signAR, 14);
    doc.addImage(signObj.dataUrl, 'PNG', 15, footerY - signH - 2, signW, signH);
  }

  doc.setLineWidth(0.4);
  doc.setDrawColor(200, 205, 210);

  // Authorised Signature
  doc.line(15, footerY, 75, footerY);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Authorised Signature', 15, footerY + 5);

  // seal.png — placed bottom-right
  if (sealObj && sealObj.dataUrl) {
    const sealSize = 28;
    doc.addImage(sealObj.dataUrl, 'PNG', 155, footerY - sealSize - 2, sealSize, sealSize);
  }

  // Bottom centred note
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('VERIFIED & APPROVED EXPENSE', 105, footerY + 22, { align: 'center' });

  const filename = `Voucher_${(tx.vendor || 'Expense').replace(/\s+/g, '_')}_${tx.date || 'Record'}.pdf`;
  doc.save(filename);
};

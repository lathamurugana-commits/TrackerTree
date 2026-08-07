import { supabase } from '../supabaseClient';

/**
 * Sends a payment receipt email via the Supabase Edge Function
 * which uses Google SMTP (Gmail App Password) on the backend.
 *
 * @param {Object} tx     - Transaction record
 * @param {string} pdfUrl - Publicly accessible URL of the PDF receipt
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const sendReceiptByEmail = async (tx, pdfUrl) => {
  const receiptNo = tx.receipt_no || `REC-${(tx.id || '').replace('tx-', '')}`;
  const amount    = Number(tx.amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2
  });

  try {
    const { data, error } = await supabase.functions.invoke('send-receipt-email', {
      body: {
        to_email:       tx.email,
        to_name:        tx.student_name || 'Student',
        receipt_no:     receiptNo,
        student_name:   tx.student_name  || 'N/A',
        course:         tx.course        || 'N/A',
        category:       tx.category      || 'N/A',
        payment_mode:   tx.payment_mode  || 'N/A',
        amount:         `Rs. ${amount}`,
        date:           tx.date          || 'N/A',
        transaction_id: tx.transaction_id || 'N/A',
        pdf_url:        pdfUrl,
      }
    });

    if (error) {
      console.error('Edge function invocation error:', error);
      return { success: false, error: error.message || 'Failed to reach the email function.' };
    }

    if (data?.success) {
      return { success: true };
    }

    return {
      success: false,
      error: data?.error || 'Email sending failed on the server.'
    };

  } catch (err) {
    console.error('sendReceiptByEmail error:', err);
    return {
      success: false,
      error: err?.message || 'Unexpected error while sending email.'
    };
  }
};

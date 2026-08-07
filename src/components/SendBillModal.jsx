import React, { useState } from 'react';
import {
  X, Mail, MessageCircle, Loader2, CheckCircle2,
  AlertCircle, Download, Share2, ExternalLink
} from 'lucide-react';
import { generateBillReceiptAsBase64, generateBillReceipt } from '../utils/exportUtils';
import { sendReceiptByEmail } from '../utils/emailService';
import { useFinance } from '../contexts/FinanceContext';

/**
 * SendBillModal
 * Full flow:
 *  1. Generate receipt PDF as base64
 *  2. Upload to Supabase storage → get public URL
 *  3. Email: send URL via EmailJS
 *  4. WhatsApp: open wa.me with message + download link
 *  5. Download: save the PDF directly
 */
const SendBillModal = ({ tx, onClose }) => {
  const { uploadReceiptPdf } = useFinance();

  const [phase, setPhase]               = useState('idle');   // idle | uploading | ready | error
  const [pdfUrl, setPdfUrl]             = useState('');
  const [emailStatus, setEmailStatus]   = useState('idle');   // idle | sending | sent | error
  const [waStatus, setWaStatus]         = useState('idle');   // idle | opened
  const [globalError, setGlobalError]   = useState('');
  const [emailError, setEmailError]     = useState('');

  const receiptNo = tx.receipt_no || `REC-${(tx.id || '').replace('tx-', '')}`;
  const amount    = Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  // ── Step 1: Generate PDF → upload → get URL ──────────────────────
  const handlePrepare = async () => {
    setPhase('uploading');
    setGlobalError('');
    try {
      const { base64, filename } = await generateBillReceiptAsBase64(tx);
      const url = await uploadReceiptPdf(base64, filename);
      setPdfUrl(url);
      setPhase('ready');
    } catch (err) {
      console.error(err);
      setGlobalError('Failed to generate or upload the receipt PDF. Please try again.');
      setPhase('error');
    }
  };

  // ── Email send ───────────────────────────────────────────────────
  const handleSendEmail = async () => {
    if (!tx.email) {
      setEmailError('No email address saved for this student.');
      return;
    }
    setEmailStatus('sending');
    setEmailError('');
    const result = await sendReceiptByEmail(tx, pdfUrl);
    if (result.success) {
      setEmailStatus('sent');
    } else {
      setEmailStatus('error');
      setEmailError(result.error || 'Email sending failed.');
    }
  };

  // ── WhatsApp send ────────────────────────────────────────────────
  const handleSendWhatsApp = () => {
    if (!tx.whatsapp) {
      setGlobalError('No WhatsApp number saved for this student.');
      return;
    }
    // Strip all formatting characters
    let rawNum = tx.whatsapp.replace(/[\s\-().]/g, '');
    // If number starts with +, remove the + (wa.me doesn't need it)
    if (rawNum.startsWith('+')) rawNum = rawNum.slice(1);
    // If it's a 10-digit Indian number with no country code, prepend 91
    if (rawNum.length === 10 && !rawNum.startsWith('91')) rawNum = '91' + rawNum;
    const message = encodeURIComponent(
`*OpenSkools - Payment Receipt*

Dear *${tx.student_name || 'Student'}*, your payment has been received!

*Receipt Details*
| Receipt No   : ${receiptNo}
| Date         : ${tx.date}
| Course       : ${tx.course || 'N/A'}
| Category     : ${tx.category || 'N/A'}
| Payment Mode : ${tx.payment_mode || 'N/A'}
| *Amount Paid  : Rs. ${amount}*
${tx.transaction_id ? `| Txn ID       : ${tx.transaction_id}` : ''}

*Download Your Receipt PDF:*
${pdfUrl}

Thank you for your payment!
_OpenSkools Finance Team_`
    );
    window.open(`https://wa.me/${rawNum}?text=${message}`, '_blank');
    setWaStatus('opened');
  };

  // ── Direct PDF download ──────────────────────────────────────────
  const handleDownload = () => generateBillReceipt(tx);

  // ────────────────────────────────────────────────────────────────
  // Render helpers
  // ────────────────────────────────────────────────────────────────
  const EmailIcon  = () => {
    if (emailStatus === 'sending') return <Loader2 className="h-4 w-4 animate-spin" />;
    if (emailStatus === 'sent')    return <CheckCircle2 className="h-4 w-4" />;
    if (emailStatus === 'error')   return <AlertCircle className="h-4 w-4" />;
    return <Mail className="h-4 w-4" />;
  };

  const emailBtnClass = () => {
    const base = 'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200';
    if (emailStatus === 'sent')  return `${base} bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400`;
    if (emailStatus === 'error') return `${base} bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400`;
    return `${base} bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Share2 className="h-4 w-4 text-blue-500" />
              Send Payment Receipt
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
              {tx.student_name} · {receiptNo}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Receipt Info Strip ── */}
        <div className="mx-6 mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Student</p>
              <p className="font-bold text-slate-800 dark:text-white truncate">{tx.student_name || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Amount</p>
              <p className="font-bold text-emerald-600">Rs. {amount}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Course</p>
              <p className="text-slate-600 dark:text-slate-300 truncate">{tx.course || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Date</p>
              <p className="text-slate-600 dark:text-slate-300">{tx.date}</p>
            </div>
          </div>
        </div>

        {/* ── Global Error Banner ── */}
        {globalError && (
          <div className="mx-6 mt-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="text-xs font-medium text-red-600 dark:text-red-400">{globalError}</p>
          </div>
        )}

        <div className="px-6 py-5 space-y-3">

          {/* ════════════════════════════════════════════
              PHASE: idle — show Prepare button
              ════════════════════════════════════════════ */}
          {phase === 'idle' && (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Click <strong>Prepare Receipt</strong> to generate the PDF and get a secure
                download link. You can then send it via Email or WhatsApp.
              </p>
              <button
                onClick={handlePrepare}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:from-blue-700 hover:to-blue-600 transition-all"
              >
                <Share2 className="h-4 w-4" />
                Prepare Receipt PDF
              </button>
            </>
          )}

          {/* ════════════════════════════════════════════
              PHASE: uploading — spinner
              ════════════════════════════════════════════ */}
          {phase === 'uploading' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-blue-100 dark:border-slate-800" />
                <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">Generating PDF…</p>
                <p className="text-xs text-slate-400 mt-0.5">Uploading receipt to secure storage</p>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              PHASE: error — retry
              ════════════════════════════════════════════ */}
          {phase === 'error' && (
            <button
              onClick={handlePrepare}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400"
            >
              <AlertCircle className="h-4 w-4" />
              Retry — Prepare Receipt PDF
            </button>
          )}

          {/* ════════════════════════════════════════════
              PHASE: ready — show Email + WhatsApp + Download
              ════════════════════════════════════════════ */}
          {phase === 'ready' && (
            <>
              {/* PDF Ready Banner */}
              <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/20">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex-1">
                  Receipt PDF ready
                </p>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  Preview <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* ── Email Button ── */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendEmail}
                    disabled={emailStatus === 'sending' || emailStatus === 'sent'}
                    className={emailBtnClass()}
                  >
                    <EmailIcon />
                    {emailStatus === 'sending' ? 'Sending Email…'
                      : emailStatus === 'sent'    ? 'Email Sent!'
                      : emailStatus === 'error'   ? 'Retry Email'
                      :                             'Send via Email'}
                  </button>
                  <div className="min-w-0 flex-shrink">
                    {tx.email
                      ? <p className="text-[10px] text-slate-400 truncate max-w-[110px]" title={tx.email}>{tx.email}</p>
                      : <p className="text-[10px] text-red-400 font-medium whitespace-nowrap">No email saved</p>
                    }
                  </div>
                </div>
                {emailError && (
                  <p className="text-[10px] text-red-500 pl-1">{emailError}</p>
                )}
              </div>

              {/* ── WhatsApp Button ── */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSendWhatsApp}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200
                    ${waStatus === 'opened'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400'
                      : 'bg-[#25D366] text-white shadow-lg shadow-green-600/20 hover:bg-green-600'
                    }`}
                >
                  {waStatus === 'opened'
                    ? <><CheckCircle2 className="h-4 w-4" /> WhatsApp Opened!</>
                    : <><MessageCircle className="h-4 w-4" /> Send via WhatsApp</>
                  }
                </button>
                <div className="min-w-0 flex-shrink">
                  {tx.whatsapp
                    ? <p className="text-[10px] text-slate-400 truncate max-w-[110px]">{tx.whatsapp}</p>
                    : <p className="text-[10px] text-red-400 font-medium whitespace-nowrap">No number saved</p>
                  }
                </div>
              </div>

              {/* ── Divider ── */}
              <div className="flex items-center gap-3 py-0.5">
                <div className="flex-1 border-t border-slate-100 dark:border-slate-800" />
                <span className="text-[10px] font-medium text-slate-400">OR</span>
                <div className="flex-1 border-t border-slate-100 dark:border-slate-800" />
              </div>

              {/* ── Download PDF Button ── */}
              <button
                onClick={handleDownload}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download PDF Receipt
              </button>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-[10px] text-slate-400 leading-relaxed">
            📧 Email sends the actual <strong>PDF receipt</strong> via Google SMTP (Gmail).<br />
            💬 WhatsApp includes the PDF download link + receipt summary in the message.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SendBillModal;

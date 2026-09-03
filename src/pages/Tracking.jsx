import React, { useState } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { Search, FileText, Download, User, Calendar, CreditCard, Landmark } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import { generateBillReceipt, generateExpenseVoucher } from '../utils/exportUtils';

const Tracking = () => {
  const { transactions, getStudentLedger } = useFinance();
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toUpperCase();
    const found = transactions.find(tx => {
      if (tx.type === 'income') {
        const receiptNo = tx.receipt_no || `REC-${(tx.id || '').replace('tx-', '')}`;
        return receiptNo.toUpperCase() === query;
      } else {
        const voucherNo = tx.voucher_no || `VOU-${(tx.id || '').replace('tx-', '')}`;
        return voucherNo.toUpperCase() === query;
      }
    });

    setResult(found || null);
    setSearched(true);
  };

  const handleDownload = async () => {
    if (!result) return;
    if (result.type === 'income') {
      const ledger = getStudentLedger(result.student_name, result.course);
      const hasSplit = ledger && ledger.studentTxs && ledger.studentTxs.length > 1;
      const splitInfo = ledger ? {
        totalFee: ledger.totalFee,
        totalPaid: ledger.totalPaid,
        balanceDue: ledger.balanceDue,
        studentId: result.student_id || ledger.studentId,
        installments: hasSplit
          ? ledger.studentTxs.map(t => ({
              receipt_no: t.receipt_no || `REC-${(t.id || '').replace('tx-', '')}`,
              date: t.date,
              amount: Number(t.amount || 0),
              payment_mode: t.payment_mode || 'N/A',
              student_id: t.student_id
            }))
          : []
      } : null;
      await generateBillReceipt(result, splitInfo);
    } else {
      await generateExpenseVoucher(result);
    }
  };

  const documentNo = result?.type === 'income' 
    ? (result.receipt_no || `REC-${(result.id || '').replace('tx-', '')}`)
    : result ? (result.voucher_no || `VOU-${(result.id || '').replace('tx-', '')}`) : '';

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Track Document</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Search for Bill Receipts or Expense Vouchers by their unique ID
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <Search className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder="e.g. REC-20260718-A3F2 or VOU-..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto min-h-[44px] rounded-lg bg-primary px-6 py-3 font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {searched && (
        <div className="mt-6">
          {result ? (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex items-center space-x-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    result.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'
                  }`}>
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                      {result.type === 'income' ? 'Bill Receipt' : 'Expense Voucher'}
                    </h3>
                    <p className="text-sm font-mono text-slate-500 mt-0.5">{documentNo}</p>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className={`inline-flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors ${
                    result.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                  }`}
                >
                  <Download className="h-4 w-4" />
                  <span>Download Document</span>
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        {result.type === 'income' ? 'Student' : 'Vendor'}
                      </p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {result.type === 'income' ? result.student_name : result.vendor}
                      </p>
                      {result.type === 'income' && result.course && (
                        <p className="text-sm text-slate-500">{result.course}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                      <p className="font-medium text-slate-900 dark:text-white">{formatDate(result.date)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Landmark className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                      <p className="font-medium text-slate-900 dark:text-white">{result.category}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CreditCard className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Payment</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {result.payment_mode}
                        {result.transaction_id && ` (${result.transaction_id})`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-slate-50/30 p-6 dark:border-slate-800 dark:bg-slate-900/30 flex justify-between items-center">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Total Amount</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(result.amount)}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 border-dashed bg-slate-50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-400 dark:bg-slate-800">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">Document Not Found</h3>
              <p className="mt-1 text-sm text-slate-500">
                We couldn't find any receipt or voucher matching "{searchQuery}". Please check the ID and try again.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Tracking;

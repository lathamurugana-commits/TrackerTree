import React, { useState } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../contexts/CategoryContext';
import { PAYMENT_MODES } from '../utils/mockData';
import { formatCurrency, formatDate } from '../utils/helpers';
import Modal from '../components/Modal';
import { Search, Plus, Edit2, Trash2, Calendar, FileText, ChevronLeft, ChevronRight, UserCheck, Paperclip, DollarSign, ExternalLink, Image, Download } from 'lucide-react';
import { generateExpenseVoucher } from '../utils/exportUtils';

const Expense = () => {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, uploadBill } = useFinance();
  const { role } = useAuth();
  const { expenseCategories } = useCategories();
  
  // Filter and Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBillPreviewOpen, setIsBillPreviewOpen] = useState(false);
  const [currentTx, setCurrentTx] = useState(null);
  const [previewBillUrl, setPreviewBillUrl] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Office Rent',
    vendor: '',
    amount: '',
    payment_mode: 'Bank Transfer',
    bill_upload_url: '',
    notes: ''
  });
  const [uploadingBill, setUploadingBill] = useState(false);
  const [formError, setFormError] = useState('');

  // Extract expense items
  const expenses = transactions.filter(t => t.type === 'expense');

  // Filtered expense list
  const filteredExpenses = expenses.filter(item => {
    const computedVoucherNo = item.voucher_no || `VOU-${(item.id || '').replace('tx-', '')}`;
    const matchesSearch = 
      (item.vendor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.voucher_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      computedVoucherNo.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = selectedCategory === '' || item.category === selectedCategory;
    const matchesPaymentMode = selectedPaymentMode === '' || item.payment_mode === selectedPaymentMode;
    
    return matchesSearch && matchesCategory && matchesPaymentMode;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: 'Office Rent',
      vendor: '',
      amount: '',
      payment_mode: 'Bank Transfer',
      bill_upload_url: '',
      notes: ''
    });
    setFormError('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (tx) => {
    setCurrentTx(tx);
    setFormData({
      date: tx.date,
      category: tx.category,
      vendor: tx.vendor || '',
      amount: tx.amount.toString(),
      payment_mode: tx.payment_mode,
      bill_upload_url: tx.bill_upload_url || '',
      notes: tx.notes || ''
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Upload handler for bill input file
  const handleBillFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // Limit to 2MB for demo convenience
      setFormError('File size is too large. Keep it under 2MB.');
      return;
    }

    setUploadingBill(true);
    try {
      const publicUrl = await uploadBill(file);
      setFormData(prev => ({ ...prev, bill_upload_url: publicUrl }));
    } catch (err) {
      setFormError('Failed to upload bill attachment.');
    } finally {
      setUploadingBill(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vendor || !formData.amount) {
      setFormError('Please fill in Vendor and Amount fields.');
      return;
    }
    if (parseFloat(formData.amount) <= 0) {
      setFormError('Amount must be greater than zero.');
      return;
    }

    const payload = {
      type: 'expense',
      ...formData,
      amount: parseFloat(formData.amount)
    };

    const res = await addTransaction(payload);
    if (res.success) {
      setIsAddModalOpen(false);
      resetForm();
      // Auto-generate and download voucher
      if (res.data) {
        await generateExpenseVoucher(res.data);
      }
    } else {
      setFormError(res.error);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vendor || !formData.amount) {
      setFormError('Please fill in Vendor and Amount fields.');
      return;
    }
    if (parseFloat(formData.amount) <= 0) {
      setFormError('Amount must be greater than zero.');
      return;
    }

    const payload = {
      type: 'expense',
      ...formData,
      amount: parseFloat(formData.amount)
    };

    const res = await updateTransaction(currentTx.id, payload);
    if (res.success) {
      setIsEditModalOpen(false);
      resetForm();
    } else {
      setFormError(res.error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense record?')) {
      const res = await deleteTransaction(id);
      if (!res.success) {
        alert(`Error: ${res.error}`);
      }
    }
  };

  const handleShowPreview = (url) => {
    setPreviewBillUrl(url);
    setIsBillPreviewOpen(true);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      
      {/* Top Section Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Expense Records</h2>
          <p className="text-xs text-slate-400">Track, upload receipts, and manage structural outlays and staff payouts</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center space-x-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
        
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by vendor, notes, category..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs text-slate-700 outline-none focus:border-primary focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-primary"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-700 outline-none focus:border-primary focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          >
            <option value="">All Categories</option>
            {expenseCategories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Payment Mode Filter */}
        <div className="w-full sm:w-48">
          <select
            value={selectedPaymentMode}
            onChange={(e) => { setSelectedPaymentMode(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-700 outline-none focus:border-primary focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          >
            <option value="">All Payment Modes</option>
            {PAYMENT_MODES.map(pm => (
              <option key={pm} value={pm}>{pm}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Vendor & Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Payment Mode</th>
                <th className="px-6 py-4">Voucher No</th>
                <th className="px-6 py-4 text-center">Receipt Bill</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30">
                    {/* Date */}
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-600 dark:text-slate-350">
                      {formatDate(tx.date)}
                    </td>
                    
                    {/* Vendor & Details */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-white">{tx.vendor}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 max-w-[200px] truncate" title={tx.notes}>
                        {tx.notes || 'No description notes'}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/20 dark:text-rose-400">
                        {tx.category}
                      </span>
                    </td>

                    {/* Payment Mode */}
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {tx.payment_mode}
                    </td>

                    {/* Voucher No */}
                    <td className="px-6 py-4 whitespace-nowrap font-mono">
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">{tx.voucher_no || `VOU-${(tx.id || '').replace('tx-', '')}`}</p>
                    </td>

                    {/* Bill Receipt attachment preview */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {tx.bill_upload_url ? (
                        <button
                          onClick={() => handleShowPreview(tx.bill_upload_url)}
                          className="inline-flex items-center space-x-1 rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                        >
                          <Paperclip className="h-3 w-3" />
                          <span>View Bill</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">None</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatCurrency(tx.amount)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => generateExpenseVoucher(tx)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
                          title="Download Voucher"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(tx)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                          title="Edit transaction"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {role === 'admin' && (
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
                            title="Delete transaction"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <span className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {Math.min(startIndex + itemsPerPage, filteredExpenses.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredExpenses.length}</span> records
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-350">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD EXPENSE MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Expense Outlay"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-xs font-semibold text-red-600 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              >
                {expenseCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Vendor / Recipient</label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="vendor"
                value={formData.vendor}
                onChange={handleFormChange}
                placeholder="e.g. Green Space Properties"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Amount (INR)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  step="any"
                  min="0.01"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Payment Mode</label>
              <select
                name="payment_mode"
                value={formData.payment_mode}
                onChange={handleFormChange}
                className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              >
                {PAYMENT_MODES.map(pm => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Bill / Invoice Attachment</label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleBillFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-350"
              />
              {uploadingBill && <span className="text-[10px] text-slate-400 animate-pulse">Uploading...</span>}
            </div>
            {formData.bill_upload_url && (
              <p className="mt-1 text-[10px] text-emerald-600 font-medium flex items-center">
                ✓ Bill attached successfully.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Notes / Description</label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Additional comments or payment breakdown details..."
                rows="2"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadingBill}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark shadow-md shadow-primary/20 disabled:opacity-50"
            >
              Record Expense
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT EXPENSE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Expense Outlay"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-xs font-semibold text-red-600 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              >
                {expenseCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Vendor / Recipient</label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="vendor"
                value={formData.vendor}
                onChange={handleFormChange}
                placeholder="e.g. Green Space Properties"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Amount (INR)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  step="any"
                  min="0.01"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Payment Mode</label>
              <select
                name="payment_mode"
                value={formData.payment_mode}
                onChange={handleFormChange}
                className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              >
                {PAYMENT_MODES.map(pm => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Update Bill Receipt Attachment</label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleBillFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-350"
              />
              {uploadingBill && <span className="text-[10px] text-slate-400 animate-pulse">Uploading...</span>}
            </div>
            {formData.bill_upload_url && (
              <div className="mt-2 flex items-center space-x-1.5">
                <span className="text-[10px] text-emerald-600 font-medium">✓ Bill attached.</span>
                <button
                  type="button"
                  onClick={() => handleShowPreview(formData.bill_upload_url)}
                  className="text-[10px] text-primary hover:underline font-semibold flex items-center"
                >
                  View current
                  <ExternalLink className="ml-0.5 h-2.5 w-2.5" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Notes / Description</label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Additional comments or payment breakdown details..."
                rows="2"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadingBill}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark shadow-md shadow-primary/20 disabled:opacity-50"
            >
              Update Record
            </button>
          </div>
        </form>
      </Modal>

      {/* BILL ATTACHMENT PREVIEW MODAL */}
      <Modal
        isOpen={isBillPreviewOpen}
        onClose={() => setIsBillPreviewOpen(false)}
        title="Bill / Invoice Attachment Receipt"
      >
        <div className="flex flex-col items-center justify-center p-2">
          {previewBillUrl.startsWith('data:image/') || previewBillUrl.includes('.jpg') || previewBillUrl.includes('.png') || previewBillUrl.includes('.jpeg') || previewBillUrl.startsWith('data:application/octet-stream') ? (
            <img 
              src={previewBillUrl} 
              alt="Bill Receipt Attachment" 
              className="max-h-[50vh] rounded-lg object-contain shadow border border-slate-200 dark:border-slate-800"
            />
          ) : (
            <div className="text-center py-8">
              <Image className="mx-auto h-12 w-12 text-slate-350 mb-3" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Interactive Document File</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">This file cannot be rendered inside the preview box. You can open it directly in a new tab.</p>
              <a
                href={previewBillUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark shadow-md"
              >
                <span>Open Document</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
          
          <div className="mt-6 flex w-full justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              onClick={() => setIsBillPreviewOpen(false)}
              className="rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300"
            >
              Close Preview
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Expense;

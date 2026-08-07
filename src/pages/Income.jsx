import React, { useState } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../contexts/CategoryContext';
import { PAYMENT_MODES } from '../utils/mockData';
import { formatCurrency, formatDate } from '../utils/helpers';
import Modal from '../components/Modal';
import { Search, Plus, Edit2, Trash2, Calendar, FileText, ChevronLeft, ChevronRight, User, GraduationCap, DollarSign, CreditCard, Download, Phone, Mail, Share2 } from 'lucide-react';
import { generateBillReceipt } from '../utils/exportUtils';
import SendBillModal from '../components/SendBillModal';

const Income = () => {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useFinance();
  const { role } = useAuth();
  const { incomeCategories } = useCategories();
  
  // Filter and Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTx, setCurrentTx] = useState(null);
  // Send Bill modal
  const [sendBillTx, setSendBillTx] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    student_name: '',
    course: '',
    category: 'Student Fee',
    amount: '',
    payment_mode: 'Bank Transfer',
    transaction_id: '',
    whatsapp: '',
    email: '',
    notes: ''
  });
  const [formError, setFormError] = useState('');

  // Extract income items
  const incomes = transactions.filter(t => t.type === 'income');

  // Filtered income list
  const filteredIncomes = incomes.filter(item => {
    const computedReceiptNo = item.receipt_no || `REC-${(item.id || '').replace('tx-', '')}`;
    const matchesSearch = 
      (item.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.course || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.transaction_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.receipt_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.whatsapp || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      computedReceiptNo.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = selectedCategory === '' || item.category === selectedCategory;
    const matchesPaymentMode = selectedPaymentMode === '' || item.payment_mode === selectedPaymentMode;
    
    return matchesSearch && matchesCategory && matchesPaymentMode;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredIncomes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIncomes = filteredIncomes.slice(startIndex, startIndex + itemsPerPage);

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      student_name: '',
      course: '',
      category: 'Student Fee',
      amount: '',
      payment_mode: 'Bank Transfer',
      transaction_id: '',
      whatsapp: '',
      email: '',
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
      student_name: tx.student_name || '',
      course: tx.course || '',
      category: tx.category,
      amount: tx.amount.toString(),
      payment_mode: tx.payment_mode,
      transaction_id: tx.transaction_id || '',
      whatsapp: tx.whatsapp || '',
      email: tx.email || '',
      notes: tx.notes || ''
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_name || !formData.course || !formData.amount) {
      setFormError('Please fill in Student Name, Course, and Amount.');
      return;
    }
    if (parseFloat(formData.amount) <= 0) {
      setFormError('Amount must be greater than zero.');
      return;
    }

    const payload = {
      type: 'income',
      ...formData,
      amount: parseFloat(formData.amount)
    };

    const res = await addTransaction(payload);
    if (res.success) {
      setIsAddModalOpen(false);
      resetForm();
    } else {
      setFormError(res.error);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_name || !formData.course || !formData.amount) {
      setFormError('Please fill in Student Name, Course, and Amount.');
      return;
    }
    if (parseFloat(formData.amount) <= 0) {
      setFormError('Amount must be greater than zero.');
      return;
    }

    const payload = {
      type: 'income',
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
    if (window.confirm('Are you sure you want to delete this income transaction?')) {
      const res = await deleteTransaction(id);
      if (!res.success) {
        alert(`Error: ${res.error}`);
      }
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      
      {/* Top Section Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Income Records</h2>
          <p className="text-xs text-slate-400">Track and manage course admissions and other school income streams</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center space-x-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Income</span>
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
            placeholder="Search by student, course, tx ID..."
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
            {incomeCategories.map(c => (
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
                <th className="px-6 py-4">Student & Course</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Payment Mode</th>
                <th className="px-6 py-4">Receipt & Txn ID</th>
                <th className="px-6 py-4">WhatsApp & Email</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedIncomes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    No income records found.
                  </td>
                </tr>
              ) : (
                paginatedIncomes.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30">
                    {/* Date */}
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-600 dark:text-slate-350">
                      {formatDate(tx.date)}
                    </td>
                    
                    {/* Student & Course */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-white">{tx.student_name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{tx.course}</p>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                        {tx.category}
                      </span>
                    </td>

                    {/* Payment Mode */}
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {tx.payment_mode}
                    </td>

                    {/* Receipt & Transaction ID */}
                    <td className="px-6 py-4 whitespace-nowrap font-mono">
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">{tx.receipt_no || `REC-${(tx.id || '').replace('tx-', '')}`}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{tx.transaction_id || '-'}</p>
                    </td>

                    {/* WhatsApp & Email */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tx.whatsapp ? (
                        <p className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                          <Phone className="h-3 w-3" />{tx.whatsapp}
                        </p>
                      ) : <p className="text-[11px] text-slate-300 dark:text-slate-600">—</p>}
                      {tx.email ? (
                        <p className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <Mail className="h-3 w-3" />{tx.email}
                        </p>
                      ) : null}
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatCurrency(tx.amount)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => generateBillReceipt(tx)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800"
                          title="Download Receipt PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setSendBillTx(tx)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"
                          title="Send bill via Email / WhatsApp"
                        >
                          <Share2 className="h-4 w-4" />
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
                {Math.min(startIndex + itemsPerPage, filteredIncomes.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredIncomes.length}</span> records
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

      {/* ADD INCOME MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Income Transaction"
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
                {incomeCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Student Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="student_name"
                value={formData.student_name}
                onChange={handleFormChange}
                placeholder="e.g. Aarav Mehta"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Course Enrolled</label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="course"
                value={formData.course}
                onChange={handleFormChange}
                placeholder="e.g. Full Stack Web Development"
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
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Transaction ID (Optional)</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="transaction_id"
                value={formData.transaction_id}
                onChange={handleFormChange}
                placeholder="e.g. TXN-UPI-990882"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">WhatsApp Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleFormChange}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="e.g. student@email.com"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Notes</label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Additional comments or receipt references..."
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
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark shadow-md shadow-primary/20"
            >
              Record Income
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT INCOME MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Income Transaction"
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
                {incomeCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Student Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="student_name"
                value={formData.student_name}
                onChange={handleFormChange}
                placeholder="e.g. Aarav Mehta"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Course Enrolled</label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="course"
                value={formData.course}
                onChange={handleFormChange}
                placeholder="e.g. Full Stack Web Development"
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
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Transaction ID (Optional)</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="transaction_id"
                value={formData.transaction_id}
                onChange={handleFormChange}
                placeholder="e.g. TXN-UPI-990882"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">WhatsApp Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleFormChange}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="e.g. student@email.com"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Notes</label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Additional comments or receipt references..."
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
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark shadow-md shadow-primary/20"
            >
              Update Record
            </button>
          </div>
        </form>
      </Modal>

      {/* SEND BILL MODAL */}
      {sendBillTx && (
        <SendBillModal
          tx={sendBillTx}
          onClose={() => setSendBillTx(null)}
        />
      )}

    </div>
  );
};

export default Income;

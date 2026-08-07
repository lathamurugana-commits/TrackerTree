import React, { useState, useEffect } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { calculateMetrics, formatCurrency, formatDate } from '../utils/helpers';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { Calendar, FileSpreadsheet, FileDown, ArrowUpRight, ArrowDownRight, CircleDollarSign, Filter } from 'lucide-react';

const Reports = () => {
  const { transactions, loading } = useFinance();
  const [rangePreset, setRangePreset] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportType, setReportType] = useState('all'); // all, income, expense

  // Sync date ranges with presets
  useEffect(() => {
    const today = new Date();
    const formatDateStr = (date) => date.toISOString().split('T')[0];

    if (rangePreset === 'daily') {
      const start = formatDateStr(today);
      setStartDate(start);
      setEndDate(start);
    } else if (rangePreset === 'weekly') {
      const pastWeek = new Date();
      pastWeek.setDate(today.getDate() - 6);
      setStartDate(formatDateStr(pastWeek));
      setEndDate(formatDateStr(today));
    } else if (rangePreset === 'monthly') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDateStr(firstDay));
      setEndDate(formatDateStr(today));
    } else if (rangePreset === 'yearly') {
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
      setStartDate(formatDateStr(firstDayOfYear));
      setEndDate(formatDateStr(today));
    }
  }, [rangePreset]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Filter transactions based on date and type
  const filteredTransactions = transactions.filter((t) => {
    if (!t.date) return false;
    
    const txDate = new Date(t.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    // Set hours to verify inclusion correctly
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);
    
    const matchesDate = (!start || txDate >= start) && (!end || txDate <= end);
    const matchesType = reportType === 'all' || t.type === reportType;

    return matchesDate && matchesType;
  });

  // Calculate stats for the selected range
  const metrics = calculateMetrics(filteredTransactions);

  // Group by category to display category statistics
  const getCategoryStats = () => {
    const categories = {};
    filteredTransactions.forEach((t) => {
      if (!categories[t.category]) {
        categories[t.category] = { amount: 0, type: t.type };
      }
      categories[t.category].amount += parseFloat(t.amount) || 0;
    });

    return Object.keys(categories)
      .map((name) => ({
        name,
        amount: categories[name].amount,
        type: categories[name].type
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const categoryStats = getCategoryStats();

  const handleExportExcel = () => {
    const rangeName = rangePreset === 'custom' ? `${startDate}_to_${endDate}` : rangePreset;
    exportToExcel(filteredTransactions, reportType, rangeName);
  };

  const handleExportPDF = () => {
    const rangeName = rangePreset === 'custom' ? `${startDate} to ${endDate}` : rangePreset.toUpperCase();
    
    // Construct stats summary for PDF rendering
    const stats = {
      'Total Income': formatCurrency(metrics.totalIncome),
      'Total Expense': formatCurrency(metrics.totalExpenses),
      'Net Profit': formatCurrency(metrics.netProfit),
      'Transactions': filteredTransactions.length.toString()
    };

    exportToPDF(filteredTransactions, reportType, rangeName, stats);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      
      {/* Top Header & Preset Buttons */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Reports Panel</h2>
          <p className="text-xs text-slate-400">Generate, review, and export institution balance sheets and tax ledger sheets</p>
        </div>
        
        {/* Preset Selectors */}
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800 self-start text-xs font-semibold">
          {['daily', 'weekly', 'monthly', 'yearly', 'custom'].map((preset) => (
            <button
              key={preset}
              onClick={() => setRangePreset(preset)}
              className={`rounded-md px-3 py-1.5 capitalize transition-all ${
                rangePreset === preset
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4">
        
        {/* Custom Start Date */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Start Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setRangePreset('custom'); }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-primary focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-primary"
            />
          </div>
        </div>

        {/* Custom End Date */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">End Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setRangePreset('custom'); }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-primary focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-primary"
            />
          </div>
        </div>

        {/* Report Type */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Ledger Type</label>
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-primary focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="all">All Incomes & Expenses</option>
              <option value="income">Incomes Only</option>
              <option value="expense">Expenses Only</option>
            </select>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-end gap-2 md:justify-end">
          <button
            onClick={handleExportExcel}
            className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-2.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400 transition-colors"
            title="Download Excel Worksheet"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel</span>
          </button>
          
          <button
            onClick={handleExportPDF}
            className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100/80 px-3 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400 transition-colors"
            title="Download PDF Report Document"
          >
            <FileDown className="h-4 w-4" />
            <span>Export PDF</span>
          </button>
        </div>

      </div>

      {/* Date Range Statistics Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Income Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Selected Income</span>
            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {formatCurrency(metrics.totalIncome)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Sum of entries in date selection</p>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Selected Expense</span>
            <div className="rounded-lg bg-rose-50 p-1.5 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {formatCurrency(metrics.totalExpenses)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Sum of payouts in date selection</p>
          </div>
        </div>

        {/* Net Revenue Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Range Net Profit</span>
            <div className="rounded-lg bg-blue-50 p-1.5 text-primary dark:bg-blue-950/30 dark:text-primary-light">
              <CircleDollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-lg font-bold ${metrics.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(metrics.netProfit)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Net revenue margin</p>
          </div>
        </div>
      </div>

      {/* Breakdown grids */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Category Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Category Breakdown</h3>
          <p className="text-[10px] text-slate-400 mb-4">Allocation totals by item categories</p>
          
          <div className="space-y-4">
            {categoryStats.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No categories in range selection.
              </div>
            ) : (
              categoryStats.map((item) => {
                const isIncome = item.type === 'income';
                // Calculate percentage out of total of that type
                const baseTotal = isIncome ? metrics.totalIncome : metrics.totalExpenses;
                const percentage = baseTotal > 0 ? (item.amount / baseTotal) * 100 : 0;

                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-350">{item.name}</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-[9px] text-slate-400 font-semibold">
                        {percentage.toFixed(1)}% of total {item.type}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detailed Range Logs */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Detailed Ledger Statements</h3>
          <p className="text-[10px] text-slate-400 mb-4">Detailed records matching selected criteria ({filteredTransactions.length} records)</p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[11px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900/30">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Entity Details</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No matching records in selection.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isIncome = tx.type === 'income';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{formatDate(tx.date)}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            isIncome 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">{tx.category}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {isIncome ? tx.student_name : tx.vendor}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{tx.payment_mode}</td>
                        <td className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${
                          isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Reports;

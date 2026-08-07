import React from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { calculateMetrics, formatCurrency, formatDate } from '../utils/helpers';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { TrendingUp, TrendingDown, Landmark, Wallet, CircleDollarSign, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { transactions, loading } = useFinance();

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Calculate stats
  const metrics = calculateMetrics(transactions);

  // Group transactions for monthly chart
  const getChartData = () => {
    const monthlyGroups = {};
    
    // Sort transactions oldest to newest
    const sorted = [...transactions]
      .filter(t => t.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sorted.forEach((t) => {
      const d = new Date(t.date);
      const year = d.getFullYear();
      const month = d.toLocaleString('default', { month: 'short' });
      const label = `${month} ${year}`;
      
      if (!monthlyGroups[label]) {
        monthlyGroups[label] = { income: 0, expense: 0 };
      }
      
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'income') {
        monthlyGroups[label].income += amt;
      } else {
        monthlyGroups[label].expense += amt;
      }
    });

    // Limit to latest 6 months
    const labels = Object.keys(monthlyGroups).slice(-6);
    const incomeData = labels.map(l => monthlyGroups[l].income);
    const expenseData = labels.map(l => monthlyGroups[l].expense);

    return {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: '#10B981', // emerald-500
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Expense',
          data: expenseData,
          backgroundColor: '#F43F5E', // rose-500
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    };
  };

  const chartData = getChartData();
  const isDark = document.documentElement.classList.contains('dark');

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDark ? '#94A3B8' : '#475569',
          font: { family: 'Inter', size: 12 }
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
        titleColor: isDark ? '#F1F5F9' : '#0F172A',
        bodyColor: isDark ? '#E2E8F0' : '#334155',
        borderColor: isDark ? '#334155' : '#E2E8F0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: isDark ? '#94A3B8' : '#64748B',
          font: { family: 'Inter' }
        }
      },
      y: {
        grid: {
          color: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'
        },
        ticks: {
          color: isDark ? '#94A3B8' : '#64748B',
          font: { family: 'Inter' },
          callback: (value) => {
            if (value >= 1000) {
              return '₹' + (value / 1000) + 'k';
            }
            return '₹' + value;
          }
        }
      }
    }
  };

  // Recent transactions list
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      
      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        
        {/* Total Income */}
        <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Income</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 transition-colors group-hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">
              {formatCurrency(metrics.totalIncome)}
            </h3>
            <p className="mt-1 text-[10px] font-medium text-slate-400">Accrued current ledger</p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Expenses</span>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600 transition-colors group-hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">
              {formatCurrency(metrics.totalExpenses)}
            </h3>
            <p className="mt-1 text-[10px] font-medium text-slate-400">Disbursed outlays</p>
          </div>
        </div>

        {/* Net Profit */}
        <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Profit</span>
            <div className="rounded-lg bg-blue-50 p-2 text-primary transition-colors group-hover:bg-blue-100 dark:bg-blue-950/30 dark:text-primary-light">
              <CircleDollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-xl font-bold truncate ${metrics.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(metrics.netProfit)}
            </h3>
            <p className="mt-1 text-[10px] font-medium text-slate-400">Net operating revenue</p>
          </div>
        </div>

        {/* Cash Balance */}
        <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cash Balance</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 transition-colors group-hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">
              {formatCurrency(metrics.cashBalance)}
            </h3>
            <p className="mt-1 text-[10px] font-medium text-slate-400">Physical drawer cash</p>
          </div>
        </div>

        {/* Bank Balance */}
        <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bank Balance</span>
            <div className="rounded-lg bg-teal-50 p-2 text-teal-600 transition-colors group-hover:bg-teal-100 dark:bg-teal-950/30 dark:text-teal-400">
              <Landmark className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">
              {formatCurrency(metrics.bankBalance)}
            </h3>
            <p className="mt-1 text-[10px] font-medium text-slate-400">Electronic accounts</p>
          </div>
        </div>

      </div>

      {/* Main Charts & Recent Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Monthly Income vs Expense Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Monthly Analytics</h3>
              <p className="text-xs text-slate-400">Income vs Expense trends over recent months</p>
            </div>
            <span className="inline-flex items-center space-x-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              <span>Current Term</span>
            </span>
          </div>
          <div className="h-72 w-full">
            {chartData.labels.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No monthly transactions recorded to display chart.
              </div>
            ) : (
              <Bar data={chartData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
              <p className="text-xs text-slate-400">Last 5 financial log activities</p>
            </div>
            <Link
              to="/income"
              className="flex items-center space-x-1 text-xs font-semibold text-primary hover:text-primary-dark dark:text-primary-light"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          
          <div className="space-y-3.5">
            {recentTransactions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                No recent activity records.
              </div>
            ) : (
              recentTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0 dark:border-slate-800"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        isIncome 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                      }`}>
                        {isIncome ? <TrendingUp className="h-4.5 w-4.5" /> : <TrendingDown className="h-4.5 w-4.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                          {isIncome ? (tx.student_name || 'Student Payment') : (tx.vendor || 'Vendor Payment')}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {tx.category} • {formatDate(tx.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                      <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wide">
                        {tx.payment_mode}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;

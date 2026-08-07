/**
 * Formats a numeric value into INR currency display
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Formats date string to friendly readable format
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Calculates aggregate financial statistics from transactions list
 */
export const calculateMetrics = (transactions) => {
  let totalIncome = 0;
  let totalExpenses = 0;
  let cashBalance = 0;
  let bankBalance = 0;

  transactions.forEach((t) => {
    const amt = parseFloat(t.amount) || 0;
    if (t.type === 'income') {
      totalIncome += amt;
      if (t.payment_mode === 'Cash') {
        cashBalance += amt;
      } else {
        bankBalance += amt;
      }
    } else if (t.type === 'expense') {
      totalExpenses += amt;
      if (t.payment_mode === 'Cash') {
        cashBalance -= amt;
      } else {
        bankBalance -= amt;
      }
    }
  });

  const netProfit = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    netProfit,
    cashBalance,
    bankBalance
  };
};

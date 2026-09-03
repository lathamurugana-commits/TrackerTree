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

  // Group income transactions by student + course to compute total pending due
  const studentCourseGroups = {};

  transactions.forEach((t) => {
    const amt = parseFloat(t.amount) || 0;
    if (t.type === 'income') {
      totalIncome += amt;
      if (t.payment_mode === 'Cash') {
        cashBalance += amt;
      } else {
        bankBalance += amt;
      }

      if (t.student_name && t.course) {
        const key = `${t.student_name.trim().toLowerCase()}:::${t.course.trim().toLowerCase()}`;
        if (!studentCourseGroups[key]) {
          studentCourseGroups[key] = [];
        }
        studentCourseGroups[key].push(t);
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

  let pendingDue = 0;
  Object.values(studentCourseGroups).forEach((group) => {
    const totalFee = Math.max(...group.map(t => parseFloat(t.total_fee || t.amount || 0)), 0);
    const totalPaid = group.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const balance = Math.max(0, totalFee - totalPaid);
    pendingDue += balance;
  });

  const netProfit = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    netProfit,
    cashBalance,
    bankBalance,
    pendingDue
  };
};

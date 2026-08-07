export const MOCK_USERS = {
  'admin@openskools.com': {
    id: 'mock-admin-id',
    email: 'admin@openskools.com',
    role: 'admin',
    name: 'Admin User',
  },
  'accountant@openskools.com': {
    id: 'mock-accountant-id',
    email: 'accountant@openskools.com',
    role: 'accountant',
    name: 'Accountant User',
  }
};

export const INCOME_CATEGORIES = [
  'Student Fee',
  'Course Sales',
  'Demo Fee',
  'Other Income'
];

export const EXPENSE_CATEGORIES = [
  'Domain',
  'Hosting',
  'Stamp',
  'Files',
  'Office Rent',
  'Salary',
  'Marketing',
  'Internet',
  'Software Subscription',
  'Travel',
  'Miscellaneous'
];

export const PAYMENT_MODES = [
  'Cash',
  'Bank Transfer',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Cheque'
];

// Helper to get relative dates for mock transactions
const getDateOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

export const INITIAL_TRANSACTIONS = [
  // May 2026 (approx offset ~40-70 days)
  {
    id: 'tx-1',
    type: 'income',
    date: '2026-05-10',
    category: 'Student Fee',
    amount: 15000.00,
    payment_mode: 'Bank Transfer',
    student_name: 'Aarav Mehta',
    course: 'Full Stack Web Development',
    transaction_id: 'TXN-BANK-10023',
    notes: 'Term 1 tuition fees',
    created_at: '2026-05-10T10:00:00Z',
  },
  {
    id: 'tx-2',
    type: 'income',
    date: '2026-05-15',
    category: 'Course Sales',
    amount: 4500.00,
    payment_mode: 'UPI',
    student_name: 'Priya Sharma',
    course: 'React & Tailwind Crash Course',
    transaction_id: 'TXN-UPI-990234',
    notes: 'Online checkout purchase',
    created_at: '2026-05-15T14:30:00Z',
  },
  {
    id: 'tx-3',
    type: 'expense',
    date: '2026-05-02',
    category: 'Office Rent',
    amount: 5000.00,
    payment_mode: 'Bank Transfer',
    vendor: 'Green Space Properties',
    notes: 'Office space rent for May',
    bill_upload_url: '',
    created_at: '2026-05-02T09:00:00Z',
  },
  {
    id: 'tx-4',
    type: 'expense',
    date: '2026-05-05',
    category: 'Hosting',
    amount: 350.00,
    payment_mode: 'Credit Card',
    vendor: 'Vercel Inc.',
    notes: 'Production server hosting subscription',
    bill_upload_url: '',
    created_at: '2026-05-05T12:00:00Z',
  },
  {
    id: 'tx-5',
    type: 'expense',
    date: '2026-05-25',
    category: 'Marketing',
    amount: 2200.00,
    payment_mode: 'UPI',
    vendor: 'Google Ads',
    notes: 'Social media search campaigns',
    bill_upload_url: '',
    created_at: '2026-05-25T16:00:00Z',
  },

  // June 2026 (approx offset ~10-39 days)
  {
    id: 'tx-6',
    type: 'income',
    date: '2026-06-05',
    category: 'Student Fee',
    amount: 18500.00,
    payment_mode: 'Bank Transfer',
    student_name: 'Kabir Singh',
    course: 'Data Science & ML',
    transaction_id: 'TXN-BANK-10045',
    notes: 'Full course enrollment',
    created_at: '2026-06-05T11:00:00Z',
  },
  {
    id: 'tx-7',
    type: 'income',
    date: '2026-06-12',
    category: 'Course Sales',
    amount: 6000.00,
    payment_mode: 'UPI',
    student_name: 'Ananya Nair',
    course: 'UI/UX Design Masterclass',
    transaction_id: 'TXN-UPI-990456',
    notes: 'Self-paced course bundle',
    created_at: '2026-06-12T15:20:00Z',
  },
  {
    id: 'tx-8',
    type: 'income',
    date: '2026-06-20',
    category: 'Demo Fee',
    amount: 500.00,
    payment_mode: 'Cash',
    student_name: 'Rahul Varma',
    course: 'Intro to Python',
    transaction_id: 'TXN-CASH-771',
    notes: 'Demo class registration fee',
    created_at: '2026-06-20T10:15:00Z',
  },
  {
    id: 'tx-9',
    type: 'expense',
    date: '2026-06-02',
    category: 'Office Rent',
    amount: 5000.00,
    payment_mode: 'Bank Transfer',
    vendor: 'Green Space Properties',
    notes: 'Office space rent for June',
    bill_upload_url: '',
    created_at: '2026-06-02T09:00:00Z',
  },
  {
    id: 'tx-10',
    type: 'expense',
    date: '2026-06-10',
    category: 'Salary',
    amount: 8000.00,
    payment_mode: 'Bank Transfer',
    vendor: 'Instructor Staff',
    notes: 'Part-time trainers pay',
    bill_upload_url: '',
    created_at: '2026-06-10T18:00:00Z',
  },
  {
    id: 'tx-11',
    type: 'expense',
    date: '2026-06-15',
    category: 'Internet',
    amount: 120.00,
    payment_mode: 'UPI',
    vendor: 'Airtel Broadband',
    notes: 'Office high-speed fiber internet connection',
    bill_upload_url: '',
    created_at: '2026-06-15T11:30:00Z',
  },
  {
    id: 'tx-12',
    type: 'expense',
    date: '2026-06-22',
    category: 'Marketing',
    amount: 3000.00,
    payment_mode: 'Credit Card',
    vendor: 'Meta Ads',
    notes: 'Instagram/Facebook lead campaigns',
    bill_upload_url: '',
    created_at: '2026-06-22T14:00:00Z',
  },

  // July 2026 (current month offsets)
  {
    id: 'tx-13',
    type: 'income',
    date: getDateOffset(5), // 5 days ago
    category: 'Student Fee',
    amount: 12000.00,
    payment_mode: 'UPI',
    student_name: 'Meera Patel',
    course: 'Full Stack Web Development',
    transaction_id: 'TXN-UPI-990882',
    notes: 'Installment 2 payment',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tx-14',
    type: 'income',
    date: getDateOffset(2), // 2 days ago
    category: 'Course Sales',
    amount: 3200.00,
    payment_mode: 'UPI',
    student_name: 'Rohan Deshmukh',
    course: 'NodeJS Backend Mastery',
    transaction_id: 'TXN-UPI-990901',
    notes: 'Course purchase store checkout',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tx-15',
    type: 'income',
    date: getDateOffset(0), // Today
    category: 'Other Income',
    amount: 1500.00,
    payment_mode: 'Cash',
    student_name: 'Aditya Sen',
    course: 'E-book bundle',
    transaction_id: 'TXN-CASH-802',
    notes: 'Consultation fee & reference guides',
    created_at: new Date().toISOString(),
  },
  {
    id: 'tx-16',
    type: 'expense',
    date: getDateOffset(8), // 8 days ago
    category: 'Office Rent',
    amount: 5000.00,
    payment_mode: 'Bank Transfer',
    vendor: 'Green Space Properties',
    notes: 'Office space rent for July',
    bill_upload_url: '',
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tx-17',
    type: 'expense',
    date: getDateOffset(4), // 4 days ago
    category: 'Software Subscription',
    amount: 180.00,
    payment_mode: 'Credit Card',
    vendor: 'Zoom Video Communications',
    notes: 'Zoom Webinars monthly license',
    bill_upload_url: '',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tx-18',
    type: 'expense',
    date: getDateOffset(1), // Yesterday
    category: 'Miscellaneous',
    amount: 45.00,
    payment_mode: 'Cash',
    vendor: 'Office Depot',
    notes: 'Stationery and white board markers',
    bill_upload_url: '',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

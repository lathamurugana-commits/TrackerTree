import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { Sun, Moon, Bell, LogOut, User, Menu, Settings } from 'lucide-react';

const Navbar = ({ onMenuClick, currentTitle }) => {
  const { user, role, profile, logout } = useAuth();
  const { transactions } = useFinance();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) {
      if (saved === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return saved;
    }
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  // Toggle theme mode
  const toggleTheme = () => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('dark');
      setTheme('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      setTheme('light');
      localStorage.setItem('theme', 'light');
    }
  };

  // Derive notifications from recent transactions
  const notifications = transactions
    .slice(0, 5)
    .map((tx) => {
      const isIncome = tx.type === 'income';
      return {
        id: tx.id,
        title: isIncome ? 'Income Logged' : 'Expense Logged',
        message: isIncome 
          ? `${tx.student_name || 'Student'} enrolled in ${tx.course || 'Course'} - Rs. ${parseFloat(tx.amount).toLocaleString()}`
          : `${tx.category} payment of Rs. ${parseFloat(tx.amount).toLocaleString()} to ${tx.vendor || 'Vendor'}`,
        time: new Date(tx.created_at || tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: false
      };
    });

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 md:px-6">
      {/* Left side: Menu toggle for mobile and Current view title */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-base sm:text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-200 capitalize truncate">
          {currentTitle || 'Dashboard'}
        </h1>
      </div>

      {/* Right side controls */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-500"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-80 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="border-b border-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-200">
                Recent Activity Notifications
              </div>
              <div className="max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    No recent transaction updates
                  </div>
                ) : (
                  notifications.map((notif, idx) => (
                    <div
                      key={`${notif.id}-${idx}`}
                      className="border-b border-slate-50 px-4 py-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-primary dark:text-primary-light">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400">{notif.time}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {notif.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2 rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
              <User className="h-4.5 w-4.5" />
            </div>
            <div className="hidden text-left md:block">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {profile?.full_name || user?.email?.split('@')[0] || 'Member'}
              </p>
              <p className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">
                {role || 'User'}
              </p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
                <p className="text-xs text-slate-400 dark:text-slate-500">Logged in as</p>
                <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {user?.email}
                </p>
                <span className="mt-1 inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  {role === 'admin' ? 'Administrator' : 'Accountant'}
                </span>
              </div>
              <button
                onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                className="flex w-full items-center space-x-2 px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Settings className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={logout}
                className="flex w-full items-center space-x-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

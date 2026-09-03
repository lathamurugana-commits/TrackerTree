import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowUpRight, ArrowDownRight, FileText, Tags, X, BookOpen, Search } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Income Module', path: '/income', icon: ArrowUpRight },
    { name: 'Expense Module', path: '/expense', icon: ArrowDownRight },
    { name: 'Track Document', path: '/tracking', icon: Search },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Categories', path: '/categories', icon: Tags },
  ];

  return (
    <>
      {/* Mobile Sidebar backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity md:hidden"
        ></div>
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6 dark:border-slate-800">
          <NavLink to="/" className="flex items-center space-x-2.5" onClick={onClose}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-md shadow-primary/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-white">OpenSkools</span>
              <p className="text-[10px] font-semibold text-primary dark:text-primary-light uppercase tracking-wider">Finance Manager</p>
            </div>
          </NavLink>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors md:hidden"
            aria-label="Close Navigation Sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer brand info */}
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="rounded-lg bg-slate-50 p-3.5 text-center dark:bg-slate-800/40">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Product Version</span>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">v1.0.0 (Production)</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { CategoryProvider } from './contexts/CategoryContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expense from './pages/Expense';
import Reports from './pages/Reports';
import Categories from './pages/Categories';
import Tracking from './pages/Tracking';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Map pathnames to descriptive titles
  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/': return 'Dashboard Overview';
      case '/income': return 'Income Module';
      case '/expense': return 'Expense Module';
      case '/tracking': return 'Track Document';
      case '/reports': return 'Reports & Exports';
      case '/categories': return 'Category Management';
      default: return 'Finance Manager';
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-800 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Responsive Collapsible Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main viewport */}
      <div className="flex flex-1 flex-col overflow-hidden md:pl-64">
        {/* Top Navbar */}
        <Navbar 
          onMenuClick={() => setSidebarOpen(true)} 
          currentTitle={getPageTitle(location.pathname)} 
        />
        
        {/* Page Content viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-1 dark:bg-slate-950/20">
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <FinanceProvider>
          <CategoryProvider>
          <Routes>
            {/* Public Auth Path */}
            <Route path="/login" element={<Login />} />

            {/* Authenticated Protected Paths */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/income"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Income />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/expense"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Expense />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tracking"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Tracking />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Reports />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Categories />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
          </CategoryProvider>
        </FinanceProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;

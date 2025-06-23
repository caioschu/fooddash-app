import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { RestaurantProvider } from './hooks/useRestaurant';
import { DateFilterProvider } from './hooks/useDateFilter';
import { ToastProvider } from './hooks/useToast';
import { SidebarProvider, useSidebar } from './hooks/useSidebar';
import { AuthPage } from './pages/Auth/AuthPage';
import { PricingPage } from './pages/Pricing/PricingPage';
import { Dashboard } from './pages/Restaurant/Dashboard';
import { Profile } from './pages/Restaurant/Profile';
import { AccessManagement } from './pages/Restaurant/AccessManagement';
import { DomainSettings } from './pages/Restaurant/DomainSettings';
import { SalesPage } from './pages/Restaurant/SalesPage';
import { ExpensesPage } from './pages/Restaurant/ExpensesPage';
import { DREPage } from './pages/Restaurant/DREPage';
import { DREAnalyticsPage } from './pages/Restaurant/DREAnalyticsPage';
import { JobsPage } from './pages/Jobs/JobsPage';
import { SuppliersPage } from './pages/Suppliers/SuppliersPage';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { AdminRestaurants } from './pages/Admin/AdminRestaurants';
import { AdminBenchmarking } from './pages/Admin/AdminBenchmarking';
import { AdminCategories } from './pages/Admin/AdminCategories';
import AdminAccess from './pages/AdminAccess';
import AdminPromote from './pages/AdminPromote';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { LandingPage } from './pages/Landing/LandingPage';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isCollapsed } = useSidebar();

  return (
    <DateFilterProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          {/* Main Content - Responsivo - Ajustado para centralizar quando sidebar recolhido */}
          <main className={`
            flex-1 overflow-auto
            pt-16 sm:pt-20
            transition-all duration-300
            ${isCollapsed 
              ? 'md:ml-16 md:pt-20' 
              : 'md:ml-64 md:pt-20'
            }
          `}>
            {children}
          </main>
        </div>
      </div>
    </DateFilterProvider>
  );
};

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando aplicação...</p>
          <p className="text-xs text-gray-500 mt-2">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show auth page, pricing or landing
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/admin-promote" element={<AdminPromote />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // If authenticated, show main app
  return (
    <RestaurantProvider>
      <SidebarProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/access" element={<AccessManagement />} />
            <Route path="/profile/domain" element={<DomainSettings />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/dre" element={<DREPage />} />
            <Route path="/dre/analytics" element={<DREAnalyticsPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/admin-access" element={<AdminAccess />} />
            <Route path="/admin-promote" element={<AdminPromote />} />
            
            {/* Admin Routes */}
            {user.tipo_usuario === 'admin' && (
              <>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/restaurants" element={<AdminRestaurants />} />
                <Route path="/admin/benchmarking" element={<AdminBenchmarking />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
              </>
            )}
            
            <Route path="/auth" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppLayout>
      </SidebarProvider>
    </RestaurantProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
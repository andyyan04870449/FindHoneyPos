import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/app/components/ui/sonner';
import { AuthProvider } from '@/lib/auth';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { Dashboard } from '@/app/pages/Dashboard';
import { ProductManagement } from '@/app/pages/ProductManagement';
import { OrderManagement } from '@/app/pages/OrderManagement';
import { DiscountManagement } from '@/app/pages/DiscountManagement';
import { DailyReport } from '@/app/pages/DailyReport';
import { LineOASettings } from '@/app/pages/LineOASettings';
import { AddonManagement } from '@/app/pages/AddonManagement';
import { LoginPage } from '@/app/pages/LoginPage';
import { RegisterPage } from '@/app/pages/RegisterPage';
import { AccountManagement } from '@/app/pages/AccountManagement';
import { AuditLogPage } from '@/app/pages/AuditLogPage';
import { IncentiveManagement } from '@/app/pages/IncentiveManagement';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<ProductManagement />} />
              <Route path="addons" element={<AddonManagement />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="discounts" element={<DiscountManagement />} />
              <Route path="reports" element={<DailyReport />} />
              <Route path="line-oa" element={<LineOASettings />} />
              <Route path="incentive" element={<IncentiveManagement />} />
              <Route path="accounts" element={<AccountManagement />} />
              <Route path="audit-logs" element={<AuditLogPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

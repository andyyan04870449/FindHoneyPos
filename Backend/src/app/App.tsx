import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/app/components/ui/sonner';
import { AuthProvider } from '@/lib/auth';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { Dashboard } from '@/app/pages/Dashboard';
import { ProductManagement } from '@/app/pages/ProductManagement';
import { OrderManagement } from '@/app/pages/OrderManagement';
import { DiscountManagement } from '@/app/pages/DiscountManagement';
import { SettlementList } from '@/app/pages/SettlementList';
import { LineOASettings } from '@/app/pages/LineOASettings';
import { AddonManagement } from '@/app/pages/AddonManagement';
import { LoginPage } from '@/app/pages/LoginPage';
import { RegisterPage } from '@/app/pages/RegisterPage';
import { AccountManagement } from '@/app/pages/AccountManagement';
import { AuditLogPage } from '@/app/pages/AuditLogPage';
import { IncentiveManagement } from '@/app/pages/IncentiveManagement';
import { MaterialManagement } from '@/app/pages/MaterialManagement';
import { RecipeManagement } from '@/app/pages/RecipeManagement';
import { StockOperations } from '@/app/pages/StockOperations';
import { LineAdminManagement } from '@/app/pages/LineAdminManagement';

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
              <Route path="reports" element={<SettlementList />} />
              <Route path="line-oa" element={<LineOASettings />} />
              <Route path="incentive" element={<IncentiveManagement />} />
              <Route path="accounts" element={<AccountManagement />} />
              <Route path="audit-logs" element={<AuditLogPage />} />
              <Route path="materials" element={<MaterialManagement />} />
              <Route path="recipes" element={<RecipeManagement />} />
              <Route path="stock-operations" element={<StockOperations />} />
              <Route path="line-admins" element={<LineAdminManagement />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

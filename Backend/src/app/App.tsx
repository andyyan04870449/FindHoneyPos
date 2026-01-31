import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/app/components/ui/sonner';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { Dashboard } from '@/app/pages/Dashboard';
import { ProductManagement } from '@/app/pages/ProductManagement';
import { OrderManagement } from '@/app/pages/OrderManagement';
import { DiscountManagement } from '@/app/pages/DiscountManagement';
import { DailyReport } from '@/app/pages/DailyReport';
import { LineOASettings } from '@/app/pages/LineOASettings';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="discounts" element={<DiscountManagement />} />
          <Route path="reports" element={<DailyReport />} />
          <Route path="line-oa" element={<LineOASettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

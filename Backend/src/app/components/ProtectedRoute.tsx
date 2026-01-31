import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Loader2, ShieldX } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

export function ProtectedRoute() {
  const { user, isLoading, isInitialized, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isInitialized) {
    return <Navigate to="/register" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'Admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <ShieldX className="h-16 w-16 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-gray-800">無後台管理權限</h2>
          <p className="text-gray-500">您的帳號沒有後台管理權限，請聯繫管理員。</p>
          <Button onClick={logout} variant="outline">登出</Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Cherry,
  ShoppingCart,
  Tag,
  BarChart3,
  MessageSquare,
  Menu,
  X,
  Users,
  ClipboardList,
  LogOut,
  KeyRound,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { cn } from '@/app/components/ui/utils';
import { BUILD_INFO } from '@/constants';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const navigation = [
  { name: '總覽', href: '/dashboard', icon: LayoutDashboard },
  { name: '商品管理', href: '/products', icon: Package },
  { name: '加料管理', href: '/addons', icon: Cherry },
  { name: '訂單管理', href: '/orders', icon: ShoppingCart },
  { name: '折扣管理', href: '/discounts', icon: Tag },
  { name: '日結紀錄', href: '/reports', icon: BarChart3 },
  { name: 'LINE OA整合', href: '/line-oa', icon: MessageSquare },
  { name: '激勵管理', href: '/incentive', icon: TrendingUp },
  { name: '帳號管理', href: '/accounts', icon: Users },
  { name: '操作紀錄', href: '/audit-logs', icon: ClipboardList },
];

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangePassword = async () => {
    if (!newPassword || !currentPassword) {
      toast.error('請填寫所有欄位');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('新密碼至少需要 6 個字元');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('新密碼不一致');
      return;
    }
    try {
      await api('/api/admin/accounts/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast.success('密碼已變更');
      setChangePasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '變更密碼失敗');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">蜜</span>
              </div>
              <div>
                <h1 className="font-bold text-lg">尋蜜點餐系統</h1>
                <p className="text-xs text-gray-500">後台管理</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer info */}
          <div className="border-t p-4">
            <div className="text-xs text-gray-500">
              <p>版本：{BUILD_INFO}</p>
              <p className="mt-1">&copy; 2026 尋蜜點餐系統</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-4 shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h2 className="font-semibold text-lg text-gray-900">
              {navigation.find((item) => item.href === location.pathname)?.name || '總覽'}
            </h2>
          </div>
          <div className="relative flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-medium text-sm">
                  {user?.displayName?.charAt(0) || '?'}
                </span>
              </div>
              <span className="hidden sm:inline text-sm">{user?.displayName || '管理員'}</span>
            </Button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-md border bg-white p-1 shadow-md">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.displayName}</p>
                    <p className="text-xs text-gray-500">@{user?.username}</p>
                  </div>
                  <div className="my-1 h-px bg-gray-200" />
                  <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100" onClick={() => { setUserMenuOpen(false); setChangePasswordOpen(true); }}>
                    <KeyRound className="h-4 w-4" />
                    修改密碼
                  </button>
                  <div className="my-1 h-px bg-gray-200" />
                  <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={() => { setUserMenuOpen(false); handleLogout(); }}>
                    <LogOut className="h-4 w-4" />
                    登出
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改密碼</DialogTitle>
            <DialogDescription>請輸入目前密碼和新密碼</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>目前密碼</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div>
              <Label>新密碼</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="至少 6 個字元" />
            </div>
            <div>
              <Label>確認新密碼</Label>
              <Input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordOpen(false)}>取消</Button>
            <Button onClick={handleChangePassword} className="bg-orange-500 hover:bg-orange-600">確認變更</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

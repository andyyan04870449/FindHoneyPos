import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Switch } from '@/app/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { AuthUser } from '@/types';

type DialogMode = 'create' | 'edit' | 'resetPassword' | null;

export function AccountManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const [formData, setFormData] = useState({ username: '', password: '', displayName: '', role: 'PosUser' });
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const data = await api<AuthUser[]>('/api/admin/accounts');
      setUsers(data);
    } catch {
      toast.error('載入帳號列表失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = () => {
    setDialogMode('create');
    setSelectedUser(null);
    setFormData({ username: '', password: '', displayName: '', role: 'PosUser' });
  };

  const handleEdit = (user: AuthUser) => {
    setDialogMode('edit');
    setSelectedUser(user);
    setFormData({ username: user.username, password: '', displayName: user.displayName, role: user.role });
  };

  const handleResetPassword = (user: AuthUser) => {
    setDialogMode('resetPassword');
    setSelectedUser(user);
    setNewPassword('');
  };

  const handleToggleStatus = async (user: AuthUser) => {
    try {
      await api(`/api/admin/accounts/${user.id}/status`, { method: 'PATCH' });
      toast.success(user.isActive ? '帳號已停用' : '帳號已啟用');
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失敗');
    }
  };

  const handleSubmitCreate = async () => {
    if (!formData.username || !formData.password || !formData.displayName) {
      toast.error('請填寫所有欄位');
      return;
    }
    try {
      await api('/api/admin/accounts', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      toast.success('帳號已建立');
      setDialogMode(null);
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '建立帳號失敗');
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedUser || !formData.displayName) return;
    try {
      await api(`/api/admin/accounts/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ displayName: formData.displayName }),
      });
      toast.success('帳號已更新');
      setDialogMode(null);
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新帳號失敗');
    }
  };

  const handleSubmitResetPassword = async () => {
    if (!selectedUser || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error('密碼至少需要 6 個字元');
      return;
    }
    try {
      await api(`/api/admin/accounts/${selectedUser.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
      toast.success('密碼已重設');
      setDialogMode(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '重設密碼失敗');
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-TW');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">帳號管理</h2>
          <p className="text-gray-600 mt-1">管理系統使用者帳號</p>
        </div>
        <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          新增帳號
        </Button>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>帳號</TableHead>
              <TableHead>顯示名稱</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>建立時間</TableHead>
              <TableHead>最後登入</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.displayName}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}
                    className={user.role === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}>
                    {user.role === 'Admin' ? '管理員' : 'POS 人員'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? 'default' : 'secondary'}
                    className={user.isActive ? 'bg-green-100 text-green-700' : ''}>
                    {user.isActive ? '啟用' : '停用'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">{formatDate(user.createdAt)}</TableCell>
                <TableCell className="text-sm text-gray-500">{formatDate(user.lastLoginAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                      編輯
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleResetPassword(user)}>
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    {currentUser?.id !== user.id && (
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={() => handleToggleStatus(user)}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogMode === 'create'} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增帳號</DialogTitle>
            <DialogDescription>建立新的管理員帳號</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>帳號</Label>
              <Input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="至少 3 個字元" />
            </div>
            <div>
              <Label>顯示名稱</Label>
              <Input value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} placeholder="顯示名稱" />
            </div>
            <div>
              <Label>密碼</Label>
              <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="至少 6 個字元" />
            </div>
            <div>
              <Label>角色</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">管理員</SelectItem>
                  <SelectItem value="PosUser">POS 人員</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)}>取消</Button>
            <Button onClick={handleSubmitCreate} className="bg-orange-500 hover:bg-orange-600">建立</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={dialogMode === 'edit'} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯帳號</DialogTitle>
            <DialogDescription>修改 {selectedUser?.username} 的資訊</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>顯示名稱</Label>
              <Input value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)}>取消</Button>
            <Button onClick={handleSubmitEdit} className="bg-orange-500 hover:bg-orange-600">更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={dialogMode === 'resetPassword'} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重設密碼</DialogTitle>
            <DialogDescription>為 {selectedUser?.username} 設定新密碼</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>新密碼</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="至少 6 個字元" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)}>取消</Button>
            <Button onClick={handleSubmitResetPassword} className="bg-orange-500 hover:bg-orange-600">確認重設</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

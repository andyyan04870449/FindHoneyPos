import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
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
import { toast } from 'sonner';
import type { Product } from '@/types';
import { api } from '@/lib/api';

const ADDON_CATEGORY = '加料';

export function AddonManagement() {
  const [addons, setAddons] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
  });

  const fetchAddons = useCallback(async () => {
    try {
      const params = new URLSearchParams({ category: ADDON_CATEGORY });
      if (searchTerm) params.set('search', searchTerm);
      const data = await api<Product[]>(`/api/admin/products?${params}`);
      setAddons(data);
    } catch (err) {
      console.error('Failed to fetch addons:', err);
      toast.error('載入加料失敗');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchAddons();
  }, [fetchAddons]);

  const handleAdd = () => {
    setEditingAddon(null);
    setFormData({ name: '', price: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (addon: Product) => {
    setEditingAddon(addon);
    setFormData({
      name: addon.name,
      price: addon.price.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (addonId: string) => {
    try {
      await api(`/api/admin/products/${addonId}`, { method: 'DELETE' });
      toast.success('加料已刪除');
      fetchAddons();
    } catch (err) {
      console.error('Failed to delete addon:', err);
      toast.error('刪除加料失敗');
    }
  };

  const handleToggleStatus = async (addon: Product) => {
    try {
      await api(`/api/admin/products/${addon.id}/status`, { method: 'PATCH' });
      toast.success(addon.status === 'Active' ? '加料已下架' : '加料已上架');
      fetchAddons();
    } catch (err) {
      console.error('Failed to toggle addon status:', err);
      toast.error('更新狀態失敗');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      toast.error('請填寫所有欄位');
      return;
    }

    try {
      if (editingAddon) {
        await api(`/api/admin/products/${editingAddon.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formData.name,
            price: parseFloat(formData.price),
            category: ADDON_CATEGORY,
          }),
        });
        toast.success('加料已更新');
      } else {
        await api('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify({
            name: formData.name,
            price: parseFloat(formData.price),
            category: ADDON_CATEGORY,
          }),
        });
        toast.success('加料已新增');
      }
      setIsDialogOpen(false);
      fetchAddons();
    } catch (err) {
      console.error('Failed to save addon:', err);
      toast.error('儲存加料失敗');
    }
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
          <h2 className="text-2xl font-bold">加料管理</h2>
          <p className="text-gray-600 mt-1">管理所有加料品項的資訊和價格</p>
        </div>
        <Button onClick={handleAdd} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          新增加料
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜尋加料名稱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">加料名稱</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">價格</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">狀態</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {addons.map((addon) => (
                <tr key={addon.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{addon.name}</td>
                  <td className="py-3 px-4 text-right font-semibold">NT$ {addon.price}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge
                      variant={addon.status === 'Active' ? 'default' : 'secondary'}
                      className={`cursor-pointer ${addon.status === 'Active' ? 'bg-green-100 text-green-700' : ''}`}
                      onClick={() => handleToggleStatus(addon)}
                    >
                      {addon.status === 'Active' ? '上架中' : '已下架'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(addon)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(addon.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {addons.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">沒有找到符合的加料</p>
          </div>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddon ? '編輯加料' : '新增加料'}</DialogTitle>
            <DialogDescription>
              {editingAddon ? '修改加料資訊' : '填寫新加料的詳細資訊'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">加料名稱</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="請輸入加料名稱"
              />
            </div>
            <div>
              <Label htmlFor="price">價格 (NT$)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} className="bg-orange-500 hover:bg-orange-600">
              {editingAddon ? '更新' : '新增'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

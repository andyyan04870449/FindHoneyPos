import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, PackagePlus, AlertTriangle } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { toast } from 'sonner';
import type { Material } from '@/types';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial, toggleMaterialStatus, stockIn } from '@/lib/api';

const UNITS = ['g', 'ml', '顆', '包', '瓶', '個', '片', '條'];

export function MaterialManagement() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [stockInMaterial, setStockInMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    unit: 'g',
    currentStock: '',
    alertThreshold: '',
  });
  const [stockInData, setStockInData] = useState({
    quantity: '',
    note: '',
  });

  const fetchMaterials = useCallback(async () => {
    try {
      const data = await getMaterials(searchTerm || undefined, statusFilter || undefined);
      setMaterials(data);
    } catch (err) {
      console.error('Failed to fetch materials:', err);
      toast.error('載入原物料失敗');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleAdd = () => {
    setEditingMaterial(null);
    setFormData({ name: '', unit: 'g', currentStock: '', alertThreshold: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      unit: material.unit,
      currentStock: material.currentStock.toString(),
      alertThreshold: material.alertThreshold.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此原物料嗎？')) return;
    try {
      await deleteMaterial(id);
      toast.success('原物料已刪除');
      fetchMaterials();
    } catch (err) {
      console.error('Failed to delete material:', err);
      toast.error('刪除失敗（可能有配方使用中）');
    }
  };

  const handleToggleStatus = async (material: Material) => {
    try {
      await toggleMaterialStatus(material.id);
      toast.success(material.status === 'Active' ? '已停用' : '已啟用');
      fetchMaterials();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error('更新狀態失敗');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.unit) {
      toast.error('請填寫名稱和單位');
      return;
    }

    try {
      if (editingMaterial) {
        await updateMaterial(editingMaterial.id, {
          name: formData.name,
          unit: formData.unit,
          alertThreshold: parseFloat(formData.alertThreshold) || 0,
          status: editingMaterial.status,
        });
        toast.success('原物料已更新');
      } else {
        await createMaterial({
          name: formData.name,
          unit: formData.unit,
          currentStock: parseFloat(formData.currentStock) || 0,
          alertThreshold: parseFloat(formData.alertThreshold) || 0,
        });
        toast.success('原物料已新增');
      }
      setIsDialogOpen(false);
      fetchMaterials();
    } catch (err) {
      console.error('Failed to save material:', err);
      toast.error('儲存失敗');
    }
  };

  const handleOpenStockIn = (material: Material) => {
    setStockInMaterial(material);
    setStockInData({ quantity: '', note: '' });
    setIsStockInOpen(true);
  };

  const handleStockIn = async () => {
    if (!stockInMaterial || !stockInData.quantity) {
      toast.error('請輸入入庫數量');
      return;
    }
    try {
      await stockIn(stockInMaterial.id, parseFloat(stockInData.quantity), stockInData.note || undefined);
      toast.success('入庫成功');
      setIsStockInOpen(false);
      fetchMaterials();
    } catch (err) {
      console.error('Failed to stock in:', err);
      toast.error('入庫失敗');
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
          <h2 className="text-2xl font-bold">原物料管理</h2>
          <p className="text-gray-600 mt-1">管理原物料庫存和警戒值</p>
        </div>
        <Button onClick={handleAdd} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          新增原物料
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜尋原物料名稱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="全部狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="Active">啟用中</SelectItem>
              <SelectItem value="Inactive">已停用</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">名稱</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">單位</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">現有庫存</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">警戒值</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">狀態</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((material) => (
                <tr key={material.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{material.name}</span>
                      {material.isLowStock && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">{material.unit}</td>
                  <td className={`py-3 px-4 text-right font-semibold ${material.isLowStock ? 'text-red-600' : ''}`}>
                    {material.currentStock.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-500">{material.alertThreshold.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge
                      variant={material.status === 'Active' ? 'default' : 'secondary'}
                      className={`cursor-pointer ${material.status === 'Active' ? 'bg-green-100 text-green-700' : ''}`}
                      onClick={() => handleToggleStatus(material)}
                    >
                      {material.status === 'Active' ? '啟用' : '停用'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenStockIn(material)} title="快速入庫">
                        <PackagePlus className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(material)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(material.id)}
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

        {materials.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">沒有找到原物料</p>
          </div>
        )}
      </Card>

      {/* 新增/編輯對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMaterial ? '編輯原物料' : '新增原物料'}</DialogTitle>
            <DialogDescription>
              {editingMaterial ? '修改原物料資訊' : '填寫新原物料的詳細資訊'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">名稱</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例：珍珠、紅茶葉"
              />
            </div>
            <div>
              <Label htmlFor="unit">單位</Label>
              <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!editingMaterial && (
              <div>
                <Label htmlFor="currentStock">初始庫存</Label>
                <Input
                  id="currentStock"
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                  placeholder="0"
                />
              </div>
            )}
            <div>
              <Label htmlFor="alertThreshold">警戒庫存</Label>
              <Input
                id="alertThreshold"
                type="number"
                value={formData.alertThreshold}
                onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                placeholder="低於此值會發出警示"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} className="bg-orange-500 hover:bg-orange-600">
              {editingMaterial ? '更新' : '新增'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 快速入庫對話框 */}
      <Dialog open={isStockInOpen} onOpenChange={setIsStockInOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>快速入庫</DialogTitle>
            <DialogDescription>
              {stockInMaterial?.name} - 目前庫存: {stockInMaterial?.currentStock} {stockInMaterial?.unit}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="stockInQty">入庫數量 ({stockInMaterial?.unit})</Label>
              <Input
                id="stockInQty"
                type="number"
                value={stockInData.quantity}
                onChange={(e) => setStockInData({ ...stockInData, quantity: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="stockInNote">備註（選填）</Label>
              <Input
                id="stockInNote"
                value={stockInData.note}
                onChange={(e) => setStockInData({ ...stockInData, note: e.target.value })}
                placeholder="例：廠商進貨"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStockInOpen(false)}>取消</Button>
            <Button onClick={handleStockIn} className="bg-green-600 hover:bg-green-700">
              確認入庫
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

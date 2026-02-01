import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
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

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    isOnPromotion: false,
    promotionPrice: '',
  });

  const fetchProducts = useCallback(async () => {
    try {
      const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const data = await api<Product[]>(`/api/admin/products${params}`);
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      toast.error('載入商品失敗');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({ name: '', price: '', isOnPromotion: false, promotionPrice: '' });
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      isOnPromotion: product.isOnPromotion,
      promotionPrice: product.promotionPrice?.toString() ?? '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await api(`/api/admin/products/${productId}`, { method: 'DELETE' });
      toast.success('商品已刪除');
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
      toast.error('刪除商品失敗');
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      await api(`/api/admin/products/${product.id}/status`, { method: 'PATCH' });
      toast.success(product.status === 'Active' ? '商品已下架' : '商品已上架');
      fetchProducts();
    } catch (err) {
      console.error('Failed to toggle product status:', err);
      toast.error('更新狀態失敗');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      toast.error('請填寫所有欄位');
      return;
    }

    const price = parseFloat(formData.price);
    const promotionPrice = formData.promotionPrice ? parseFloat(formData.promotionPrice) : null;

    if (formData.isOnPromotion && promotionPrice != null) {
      if (promotionPrice < 0) {
        toast.error('促銷價不能小於 0');
        return;
      }
      if (promotionPrice >= price) {
        toast.error('促銷價必須小於原價');
        return;
      }
    }

    const body = {
      name: formData.name,
      price,
      isOnPromotion: formData.isOnPromotion,
      promotionPrice: formData.isOnPromotion ? promotionPrice : null,
    };

    try {
      if (editingProduct) {
        await api(`/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...body,
            status: editingProduct.status,
            category: editingProduct.category ?? null,
            sortOrder: editingProduct.sortOrder,
          }),
        });
        toast.success('商品已更新');
      } else {
        await api('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast.success('商品已新增');
      }
      setIsDialogOpen(false);
      fetchProducts();
    } catch (err) {
      console.error('Failed to save product:', err);
      toast.error('儲存商品失敗');
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
          <h2 className="text-2xl font-bold">商品管理</h2>
          <p className="text-gray-600 mt-1">管理所有商品的資訊和價格</p>
        </div>
        <Button onClick={handleAddProduct} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          新增商品
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜尋商品名稱..."
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
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">商品名稱</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">價格</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">促銷</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">狀態</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{product.name}</td>
                  <td className="py-3 px-4 text-right font-semibold">NT$ {product.price}</td>
                  <td className="py-3 px-4 text-center">
                    {product.isOnPromotion ? (
                      <Badge className="bg-red-100 text-red-700">
                        促銷 NT$ {product.promotionPrice}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge
                      variant={product.status === 'Active' ? 'default' : 'secondary'}
                      className={`cursor-pointer ${product.status === 'Active' ? 'bg-green-100 text-green-700' : ''}`}
                      onClick={() => handleToggleStatus(product)}
                    >
                      {product.status === 'Active' ? '上架中' : '已下架'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
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

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">沒有找到符合的商品</p>
          </div>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? '編輯商品' : '新增商品'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? '修改商品資訊' : '填寫新商品的詳細資訊'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">商品名稱</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="請輸入商品名稱"
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
            <div className="flex items-center justify-between">
              <Label htmlFor="isOnPromotion">促銷</Label>
              <Switch
                id="isOnPromotion"
                checked={formData.isOnPromotion}
                onCheckedChange={(checked) => setFormData({ ...formData, isOnPromotion: checked })}
              />
            </div>
            {formData.isOnPromotion && (
              <div>
                <Label htmlFor="promotionPrice">促銷價格 (NT$)</Label>
                <Input
                  id="promotionPrice"
                  type="number"
                  value={formData.promotionPrice}
                  onChange={(e) => setFormData({ ...formData, promotionPrice: e.target.value })}
                  placeholder="0"
                />
                {formData.price && formData.promotionPrice && parseFloat(formData.promotionPrice) >= parseFloat(formData.price) && (
                  <p className="text-sm text-red-500 mt-1">促銷價必須小於原價</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} className="bg-orange-500 hover:bg-orange-600">
              {editingProduct ? '更新' : '新增'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

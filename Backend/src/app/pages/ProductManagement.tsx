import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, GripVertical } from 'lucide-react';
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
import { api, reorderProducts } from '@/lib/api';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 20 色對應表
const CARD_COLORS = [
  { value: 'red', label: '紅色', bg: 'bg-red-600' },
  { value: 'orange', label: '橙色', bg: 'bg-orange-600' },
  { value: 'amber', label: '琥珀', bg: 'bg-amber-600' },
  { value: 'yellow', label: '黃色', bg: 'bg-yellow-500' },
  { value: 'lime', label: '萊姆', bg: 'bg-lime-600' },
  { value: 'green', label: '綠色', bg: 'bg-green-600' },
  { value: 'emerald', label: '翠綠', bg: 'bg-emerald-600' },
  { value: 'teal', label: '藍綠', bg: 'bg-teal-600' },
  { value: 'cyan', label: '青色', bg: 'bg-cyan-600' },
  { value: 'sky', label: '天藍', bg: 'bg-sky-600' },
  { value: 'blue', label: '藍色', bg: 'bg-blue-600' },
  { value: 'indigo', label: '靛藍', bg: 'bg-indigo-600' },
  { value: 'violet', label: '紫羅蘭', bg: 'bg-violet-600' },
  { value: 'purple', label: '紫色', bg: 'bg-purple-600' },
  { value: 'fuchsia', label: '桃紅', bg: 'bg-fuchsia-600' },
  { value: 'pink', label: '粉紅', bg: 'bg-pink-600' },
  { value: 'rose', label: '玫瑰', bg: 'bg-rose-600' },
  { value: 'slate', label: '石板灰', bg: 'bg-slate-600' },
  { value: 'gray', label: '灰色', bg: 'bg-gray-600' },
  { value: 'stone', label: '石灰', bg: 'bg-stone-600' },
];

interface SortableRowProps {
  product: Product;
  colorInfo: typeof CARD_COLORS[number] | undefined;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onToggleStatus: (product: Product) => void;
}

function SortableRow({ product, colorInfo, onEdit, onDelete, onToggleStatus }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b hover:bg-gray-50">
      <td className="py-3 px-2 w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>
      </td>
      <td className="py-3 px-4 font-medium">{product.name}</td>
      <td className="py-3 px-4 text-center">
        {colorInfo ? (
          <div className="flex items-center justify-center gap-2">
            <span className={`w-5 h-5 rounded ${colorInfo.bg}`} />
            <span className="text-sm text-gray-600">{colorInfo.label}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">自動</span>
        )}
      </td>
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
          onClick={() => onToggleStatus(product)}
        >
          {product.status === 'Active' ? '上架中' : '已下架'}
        </Badge>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(product.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

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
    cardColor: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    setFormData({ name: '', price: '', isOnPromotion: false, promotionPrice: '', cardColor: '' });
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      isOnPromotion: product.isOnPromotion,
      promotionPrice: product.promotionPrice?.toString() ?? '',
      cardColor: product.cardColor ?? '',
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = products.findIndex((p) => p.id === active.id);
    const newIndex = products.findIndex((p) => p.id === over.id);

    const newProducts = arrayMove(products, oldIndex, newIndex);
    setProducts(newProducts);

    try {
      await reorderProducts(newProducts.map((p) => Number(p.id)));
      toast.success('排序已儲存');
    } catch (err) {
      console.error('Failed to reorder products:', err);
      toast.error('排序儲存失敗');
      fetchProducts();
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
      cardColor: formData.cardColor || null,
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-10 py-3 px-2"></th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">商品名稱</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">卡片顏色</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">價格</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">促銷</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">狀態</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">操作</th>
                </tr>
              </thead>
              <SortableContext items={products.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {products.map((product) => {
                    const colorInfo = CARD_COLORS.find(c => c.value === product.cardColor);
                    return (
                      <SortableRow
                        key={product.id}
                        product={product}
                        colorInfo={colorInfo}
                        onEdit={handleEditProduct}
                        onDelete={handleDeleteProduct}
                        onToggleStatus={handleToggleStatus}
                      />
                    );
                  })}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">沒有找到符合的商品</p>
          </div>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
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

            {/* 卡片顏色選擇 */}
            <div>
              <Label>卡片顏色</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {/* 自動（無設定） */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, cardColor: '' })}
                  className={`
                    w-full aspect-square rounded-lg border-2 flex items-center justify-center text-xs
                    ${!formData.cardColor ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-300'}
                    bg-gradient-to-br from-gray-200 to-gray-400
                  `}
                  title="自動（依 ID 分配）"
                >
                  <span className="text-gray-600 font-medium">自動</span>
                </button>
                {CARD_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, cardColor: color.value })}
                    className={`
                      w-full aspect-square rounded-lg border-2
                      ${color.bg}
                      ${formData.cardColor === color.value ? 'border-orange-500 ring-2 ring-orange-200' : 'border-transparent'}
                    `}
                    title={color.label}
                  />
                ))}
              </div>
              {formData.cardColor && (
                <p className="text-sm text-gray-500 mt-1">
                  已選擇：{CARD_COLORS.find(c => c.value === formData.cardColor)?.label}
                </p>
              )}
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

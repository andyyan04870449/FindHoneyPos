import { useState } from 'react';
import { Plus, Pencil, Trash2, Percent, DollarSign, Gift } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Switch } from '@/app/components/ui/switch';
import { toast } from 'sonner';

// 折扣類型
interface Discount {
  id: string;
  name: string;
  type: 'percentage' | 'amount' | 'gift';
  value: number;
  minPurchase: number;
  isActive: boolean;
  description: string;
}

// 模擬折扣數據
const initialDiscounts: Discount[] = [
  {
    id: '1',
    name: '9折優惠',
    type: 'percentage',
    value: 10,
    minPurchase: 0,
    isActive: true,
    description: '全場9折優惠',
  },
  {
    id: '2',
    name: '85折優惠',
    type: 'percentage',
    value: 15,
    minPurchase: 0,
    isActive: true,
    description: '全場85折優惠',
  },
  {
    id: '3',
    name: '8折優惠',
    type: 'percentage',
    value: 20,
    minPurchase: 0,
    isActive: true,
    description: '全場8折優惠',
  },
  {
    id: '4',
    name: '75折優惠',
    type: 'percentage',
    value: 25,
    minPurchase: 0,
    isActive: true,
    description: '全場75折優惠',
  },
  {
    id: '5',
    name: '滿500折50',
    type: 'amount',
    value: 50,
    minPurchase: 500,
    isActive: true,
    description: '消費滿NT$500折NT$50',
  },
  {
    id: '6',
    name: '滿1000折150',
    type: 'amount',
    value: 150,
    minPurchase: 1000,
    isActive: true,
    description: '消費滿NT$1,000折NT$150',
  },
  {
    id: '7',
    name: '買5送1',
    type: 'gift',
    value: 1,
    minPurchase: 5,
    isActive: false,
    description: '購買5件商品贈送1件',
  },
];

const discountTypeIcons = {
  percentage: Percent,
  amount: DollarSign,
  gift: Gift,
};

const discountTypeLabels = {
  percentage: '百分比折扣',
  amount: '金額折扣',
  gift: '整單贈送',
};

const discountTypeColors = {
  percentage: 'bg-orange-100 text-orange-700',
  amount: 'bg-blue-100 text-blue-700',
  gift: 'bg-purple-100 text-purple-700',
};

export function DiscountManagement() {
  const [discounts, setDiscounts] = useState<Discount[]>(initialDiscounts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'percentage' as 'percentage' | 'amount' | 'gift',
    value: '',
    minPurchase: '',
    description: '',
  });

  const handleAddDiscount = () => {
    setEditingDiscount(null);
    setFormData({
      name: '',
      type: 'percentage',
      value: '',
      minPurchase: '',
      description: '',
    });
    setIsDialogOpen(true);
  };

  const handleEditDiscount = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name,
      type: discount.type,
      value: discount.value.toString(),
      minPurchase: discount.minPurchase.toString(),
      description: discount.description,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteDiscount = (discountId: string) => {
    setDiscounts(discounts.filter((d) => d.id !== discountId));
    toast.success('折扣已刪除');
  };

  const handleToggleActive = (discountId: string) => {
    setDiscounts(
      discounts.map((d) =>
        d.id === discountId ? { ...d, isActive: !d.isActive } : d
      )
    );
    const discount = discounts.find((d) => d.id === discountId);
    toast.success(
      discount?.isActive ? '折扣已停用' : '折扣已啟用'
    );
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.value) {
      toast.error('請填寫必填欄位');
      return;
    }

    if (editingDiscount) {
      // 編輯折扣
      setDiscounts(
        discounts.map((d) =>
          d.id === editingDiscount.id
            ? {
                ...d,
                name: formData.name,
                type: formData.type,
                value: parseFloat(formData.value),
                minPurchase: parseFloat(formData.minPurchase) || 0,
                description: formData.description,
              }
            : d
        )
      );
      toast.success('折扣已更新');
    } else {
      // 新增折扣
      const newDiscount: Discount = {
        id: Date.now().toString(),
        name: formData.name,
        type: formData.type,
        value: parseFloat(formData.value),
        minPurchase: parseFloat(formData.minPurchase) || 0,
        isActive: true,
        description: formData.description,
      };
      setDiscounts([...discounts, newDiscount]);
      toast.success('折扣已新增');
    }

    setIsDialogOpen(false);
  };

  const getDiscountDisplay = (discount: Discount) => {
    if (discount.type === 'percentage') {
      return `${100 - discount.value}折`;
    } else if (discount.type === 'amount') {
      return `折NT$ ${discount.value}`;
    } else {
      return `贈送${discount.value}件`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">折扣管理</h2>
          <p className="text-gray-600 mt-1">設定各種折扣規則和優惠活動</p>
        </div>
        <Button onClick={handleAddDiscount} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          新增折扣
        </Button>
      </div>

      {/* Discounts Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {discounts.map((discount) => {
          const Icon = discountTypeIcons[discount.type];
          return (
            <Card key={discount.id} className="p-6 relative">
              {!discount.isActive && (
                <div className="absolute inset-0 bg-gray-900/5 rounded-lg pointer-events-none flex items-center justify-center">
                  <Badge variant="secondary" className="bg-gray-700 text-white pointer-events-auto">
                    已停用
                  </Badge>
                </div>
              )}
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${discountTypeColors[discount.type]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{discount.name}</h3>
                    <Badge variant="secondary" className="mt-1">
                      {discountTypeLabels[discount.type]}
                    </Badge>
                  </div>
                </div>
                <Switch
                  checked={discount.isActive}
                  onCheckedChange={() => handleToggleActive(discount.id)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-orange-600">
                    {getDiscountDisplay(discount)}
                  </span>
                </div>

                <p className="text-sm text-gray-600">{discount.description}</p>

                {discount.minPurchase > 0 && (
                  <div className="text-sm text-gray-500">
                    最低消費：
                    {discount.type === 'gift'
                      ? `${discount.minPurchase}件`
                      : `NT$ ${discount.minPurchase}`}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditDiscount(discount)}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    編輯
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDiscount(discount.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDiscount ? '編輯折扣' : '新增折扣'}
            </DialogTitle>
            <DialogDescription>
              {editingDiscount ? '修改折扣設定' : '建立新的折扣規則'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">折扣名稱</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="例如：9折優惠"
              />
            </div>

            <div>
              <Label htmlFor="type">折扣類型</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'percentage' | 'amount' | 'gift') =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">百分比折扣</SelectItem>
                  <SelectItem value="amount">金額折扣</SelectItem>
                  <SelectItem value="gift">整單贈送</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="value">
                {formData.type === 'percentage'
                  ? '折扣百分比'
                  : formData.type === 'amount'
                  ? '折扣金額'
                  : '贈送數量'}
              </Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
                placeholder={
                  formData.type === 'percentage'
                    ? '輸入折扣百分比（例如：10 = 9折）'
                    : formData.type === 'amount'
                    ? '輸入折扣金額'
                    : '輸入贈送數量'
                }
              />
              {formData.type === 'percentage' && (
                <p className="text-xs text-gray-500 mt-1">
                  例如：輸入10表示打9折，輸入20表示打8折
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="minPurchase">
                最低消費要求
                {formData.type === 'gift' && '（件數）'}
              </Label>
              <Input
                id="minPurchase"
                type="number"
                value={formData.minPurchase}
                onChange={(e) =>
                  setFormData({ ...formData, minPurchase: e.target.value })
                }
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="description">說明</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="輸入折扣說明"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {editingDiscount ? '更新' : '新增'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
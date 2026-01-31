import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Plus, Minus, Check } from 'lucide-react';
import type { Product, Addon, SelectedAddon, OrderItem } from '../types';
import { calculateUnitPrice } from '../utils/cartUtils';

interface ProductCustomizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  addons: Addon[];
  /** 正在編輯的購物車品項（含原始數量與加料） */
  editingItem: OrderItem | null;
  onConfirm: (product: Product, selectedAddons: SelectedAddon[], quantity: number) => void;
}

export function ProductCustomizeDialog({
  open,
  onOpenChange,
  product,
  addons,
  editingItem,
  onConfirm,
}: ProductCustomizeDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());

  // 開啟時初始化：數量預設 1，加料清空
  useEffect(() => {
    if (!open) return;
    setQuantity(1);
    setSelectedAddonIds(new Set());
  }, [open]);

  if (!product) return null;

  const selectedAddons: SelectedAddon[] = addons
    .filter(a => selectedAddonIds.has(a.id))
    .map(a => ({ id: a.id, name: a.name, price: a.price }));

  const maxQuantity = editingItem ? editingItem.quantity : Infinity;
  const unitPrice = calculateUnitPrice(product.price, selectedAddons);
  const subtotal = unitPrice * quantity;

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds(prev => {
      const next = new Set(prev);
      if (next.has(addonId)) {
        next.delete(addonId);
      } else {
        next.add(addonId);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(product, selectedAddons, quantity);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl w-[92vw] h-[75vh] !max-h-[85vh] overflow-hidden p-0 flex flex-col">
        {/* 左右兩欄 */}
        <div className="flex min-h-0 flex-1">
          {/* 左側：加料項目區 */}
          <div className="flex-[3] border-r border-gray-200 overflow-y-auto p-6">
            <h3 className="text-2xl font-bold mb-1">{product.name}</h3>
            <p className="text-lg text-gray-500 mb-5">NT$ {product.price}</p>

            {addons.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-4 text-gray-700">加料</h4>
                <div className="grid grid-cols-2 gap-3">
                  {addons.map(addon => (
                    <label
                      key={addon.id}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedAddonIds.has(addon.id)
                          ? 'border-brand-orange bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Checkbox
                        checked={selectedAddonIds.has(addon.id)}
                        onCheckedChange={() => toggleAddon(addon.id)}
                      />
                      <span className="flex-1 font-medium text-base text-gray-900">{addon.name}</span>
                      <Badge variant="secondary" className="text-sm">
                        +{addon.price}
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 右側：詳情 + 確認 */}
          <div className="flex-[2] flex flex-col min-h-0">
            {/* 上半：數量、小計 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* 數量控制 */}
              <div>
                <h4 className="text-lg font-semibold mb-1 text-gray-700">客製化數量</h4>
                {editingItem && (
                  <p className="text-sm text-gray-500 mb-3">
                    從 {editingItem.quantity} 個中選擇要客製化的數量
                  </p>
                )}
                <div className="flex items-center gap-4 justify-center">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors active:scale-95"
                  >
                    <Minus className="h-5 w-5 text-gray-700" strokeWidth={2.5} />
                  </button>
                  <span className="text-3xl font-bold text-gray-900 w-16 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => Math.min(q + 1, maxQuantity))}
                    disabled={quantity >= maxQuantity}
                    className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-orange hover:bg-brand-orange/90 active:bg-brand-orange/80 transition-colors active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* 加料明細 + 小計 */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-base text-gray-600">
                  <span>商品單價</span>
                  <span>NT$ {product.price}</span>
                </div>
                {selectedAddons.map(a => (
                  <div key={a.id} className="flex justify-between text-base text-gray-600">
                    <span>+ {a.name}</span>
                    <span>NT$ {a.price}</span>
                  </div>
                ))}
                {selectedAddons.length > 0 && (
                  <div className="flex justify-between text-base font-medium text-gray-700 border-t border-gray-200 pt-2">
                    <span>含加料單價</span>
                    <span>NT$ {unitPrice}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900 border-t border-gray-300 pt-2">
                  <span>小計</span>
                  <span className="text-brand-orange">NT$ {subtotal}</span>
                </div>
              </div>
            </div>

            {/* 下半：確認按鈕 */}
            <div className="shrink-0 p-6 border-t border-gray-200">
              <Button
                onClick={handleConfirm}
                className="w-full h-14 text-lg bg-brand-orange hover:bg-brand-orange/90 text-white"
              >
                <Check className="h-5 w-5 mr-2" />
                確認客製化 — NT$ {subtotal}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

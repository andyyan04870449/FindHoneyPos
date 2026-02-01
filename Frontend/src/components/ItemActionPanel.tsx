import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Gift, Scissors, DollarSign, Minus, Plus, Check } from 'lucide-react';
import type { OrderItem, PosDiscount } from '../types';

type ActionMode = null | 'split' | 'changePrice';

interface ItemActionPanelProps {
  item: OrderItem;
  discounts: PosDiscount[];
  onGift: (cartItemId: string) => void;
  onSplit: (cartItemId: string, splitQty: number) => void;
  onChangePrice: (cartItemId: string, newPrice: number, label: string) => void;
}

export function ItemActionPanel({
  item,
  discounts,
  onGift,
  onSplit,
  onChangePrice,
}: ItemActionPanelProps) {
  const [mode, setMode] = useState<ActionMode>(null);
  const [splitQty, setSplitQty] = useState(1);
  const [customPrice, setCustomPrice] = useState('');

  const maxSplit = item.quantity - 1;
  const canSplit = item.quantity > 1;
  const canGift = !item.isGift;

  // 加料總價
  const addonTotal = item.addons?.reduce((sum, a) => sum + a.price, 0) ?? 0;
  // 品項的基礎價格（不含加料）
  const basePrice = (item.originalPrice ?? item.price) - addonTotal;

  const quickPercentButtons = discounts.filter(d => d.type === 'percentage');
  const quickAmountButtons = discounts.filter(d => d.type === 'amount');

  const handleSplitConfirm = () => {
    onSplit(item.cartItemId, splitQty);
    setMode(null);
    setSplitQty(1);
  };

  const handleApplyPercentDiscount = (discountValue: number, name: string) => {
    // discountValue 是折扣百分比，例如 10 代表打9折
    const discountedBase = Math.round(basePrice * (1 - discountValue / 100));
    const newPrice = discountedBase + addonTotal;
    onChangePrice(item.cartItemId, newPrice, name);
    setMode(null);
  };

  const handleApplyAmountDiscount = (amount: number, name: string) => {
    const newPrice = Math.max(0, item.price - amount);
    onChangePrice(item.cartItemId, newPrice, name);
    setMode(null);
  };

  const handleCustomPriceConfirm = () => {
    const price = parseFloat(customPrice);
    if (isNaN(price) || price < 0) return;
    // 自訂價格為基礎價，加上加料價
    const newPrice = price + addonTotal;
    onChangePrice(item.cartItemId, newPrice, `自訂 NT$${price}`);
    setMode(null);
    setCustomPrice('');
  };

  return (
    <div className="bg-orange-50 border-2 border-brand-orange/30 rounded-lg p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
      {/* 操作按鈕列 */}
      {mode === null && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => { onGift(item.cartItemId); }}
            disabled={!canGift}
            className="flex-1 h-14 text-lg gap-2 border-2 hover:border-green-400 hover:bg-green-50"
          >
            <Gift className="h-5 w-5" />
            贈送
          </Button>
          <Button
            variant="outline"
            onClick={() => { setMode('split'); setSplitQty(1); }}
            disabled={!canSplit}
            className="flex-1 h-14 text-lg gap-2 border-2 hover:border-blue-400 hover:bg-blue-50"
          >
            <Scissors className="h-5 w-5" />
            分離
          </Button>
          <Button
            variant="outline"
            onClick={() => { setMode('changePrice'); setCustomPrice(''); }}
            className="flex-1 h-14 text-lg gap-2 border-2 hover:border-purple-400 hover:bg-purple-50"
          >
            <DollarSign className="h-5 w-5" />
            變更金額
          </Button>
        </div>
      )}

      {/* 分離：數量選擇器 */}
      {mode === 'split' && (
        <div className="space-y-3">
          <div className="text-base font-medium text-gray-700">選擇分離數量</div>
          <div className="flex items-center gap-4 justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSplitQty(q => Math.max(1, q - 1))}
              disabled={splitQty <= 1}
              className="h-12 w-12"
            >
              <Minus className="h-5 w-5" />
            </Button>
            <span className="text-3xl font-bold w-16 text-center">{splitQty}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSplitQty(q => Math.min(maxSplit, q + 1))}
              disabled={splitQty >= maxSplit}
              className="h-12 w-12"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="text-sm text-gray-500 text-center">
            分離後：{item.quantity - splitQty} + {splitQty}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setMode(null)}
              className="flex-1 h-12 text-base"
            >
              取消
            </Button>
            <Button
              onClick={handleSplitConfirm}
              className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check className="h-4 w-4 mr-1" />
              確認分離
            </Button>
          </div>
        </div>
      )}

      {/* 變更金額 Dialog */}
      <Dialog open={mode === 'changePrice'} onOpenChange={(open) => { if (!open) setMode(null); }}>
        <DialogContent className="max-w-lg" onClick={e => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="text-2xl">變更單品金額 — {item.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="text-base text-gray-500">
              目前單價：NT$ {item.price}（基礎 NT$ {basePrice} + 加料 NT$ {addonTotal}）
            </div>

            {/* 百分比折扣快捷鈕 */}
            {quickPercentButtons.length > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-2">折扣</div>
                <div className="grid grid-cols-4 gap-2">
                  {quickPercentButtons.map(btn => (
                    <Button
                      key={btn.id}
                      variant="outline"
                      onClick={() => handleApplyPercentDiscount(btn.value, btn.name)}
                      className="h-12 text-base"
                    >
                      {btn.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* 金額折扣快捷鈕 */}
            {quickAmountButtons.length > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-2">折抵金額</div>
                <div className="grid grid-cols-4 gap-2">
                  {quickAmountButtons.map(btn => (
                    <Button
                      key={btn.id}
                      variant="outline"
                      onClick={() => handleApplyAmountDiscount(btn.value, btn.name)}
                      className="h-12 text-base"
                    >
                      {btn.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* 自訂金額 */}
            <div>
              <div className="text-sm text-gray-500 mb-2">自訂基礎單價（NT$）</div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="輸入新的基礎單價"
                  value={customPrice}
                  onChange={e => setCustomPrice(e.target.value)}
                  className="h-12 text-lg flex-1"
                  min="0"
                />
                <Button
                  onClick={handleCustomPriceConfirm}
                  disabled={!customPrice || isNaN(parseFloat(customPrice)) || parseFloat(customPrice) < 0}
                  className="h-12 px-6 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Check className="h-4 w-4 mr-1" />
                  確認
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

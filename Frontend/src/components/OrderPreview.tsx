import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Trash2, ShoppingCart } from "lucide-react";
import type { OrderItem } from "../types";
import { CartItemRow } from "./CartItemRow";

interface OrderPreviewProps {
  items: OrderItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onClearAll: () => void;
  onOpenCheckout: () => void;
  onCustomize?: (item: OrderItem) => void;
  showActions?: boolean;
}

export function OrderPreview({ items, onUpdateQuantity, onClearAll, onOpenCheckout, onCustomize, showActions = true }: OrderPreviewProps) {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuantityChange = (item: OrderItem, delta: number) => {
    const newQuantity = Math.max(0, item.quantity + delta);
    onUpdateQuantity(item.cartItemId, newQuantity);
  };

  return (
    <Card className="h-full flex flex-col bg-white border border-gray-200 overflow-hidden">
      <div className="p-6 flex flex-col h-full">
        {/* 標題區域 - 固定 */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="flex items-center justify-center w-12 h-12 bg-brand-orange rounded-xl">
            <ShoppingCart className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">訂單明細</h2>
            {totalItems > 0 && (
              <p className="text-base text-gray-500">
                共 {totalItems} 項商品
              </p>
            )}
          </div>
        </div>

        {/* 訂單列表 - 可滾動 */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-medium mb-2">購物車是空的</p>
              <p className="text-base">點擊商品來加入購物車</p>
            </div>
          ) : (
            items.map((item, idx) => (
              <CartItemRow
                key={item.cartItemId}
                item={item}
                index={idx + 1}
                onQuantityChange={handleQuantityChange}
                onCustomize={onCustomize}
                variant="desktop"
              />
            ))
          )}
        </div>

        {/* 底部固定區域 - 合計和按鈕 */}
        {showActions && items.length > 0 && (
          <div className="shrink-0">
            <Separator className="mb-4" />

            {/* 合計區域 - 可點擊進入結帳 */}
            <button
              onClick={onOpenCheckout}
              className="w-full bg-gray-900 text-white p-5 rounded-xl text-center mb-4 hover:bg-gray-800 active:scale-[0.98] transition-all"
            >
              <div className="text-base text-gray-300 mb-2">
                點擊進入結帳
              </div>
              <div className="text-3xl font-bold text-brand-orange">
                NT$ {total}
              </div>
            </button>

            {/* 清空按鈕 */}
            <Button
              variant="outline"
              onClick={onClearAll}
              className="w-full h-14 text-base border-2 hover:bg-gray-50 active:scale-[0.98]"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              清空購物車
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ShoppingCart, Trash2 } from "lucide-react";
import { Separator } from "./ui/separator";
import type { OrderItem } from "../types";
import { CartItemRow } from "./CartItemRow";

interface MobileCartSheetProps {
  items: OrderItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onClearAll: () => void;
  onOpenCheckout: () => void;
  onCustomize?: (item: OrderItem) => void;
}

export function MobileCartSheet({
  items,
  onUpdateQuantity,
  onClearAll,
  onOpenCheckout,
  onCustomize,
}: MobileCartSheetProps) {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuantityChange = (item: OrderItem, delta: number) => {
    const newQuantity = Math.max(0, item.quantity + delta);
    onUpdateQuantity(item.cartItemId, newQuantity);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 z-50 bg-brand-orange hover:bg-brand-orange-dark text-white rounded-full w-16 h-16 shadow-xl lg:hidden active:scale-95"
          size="icon"
        >
          <ShoppingCart className="h-7 w-7" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-sm min-w-7 h-7 flex items-center justify-center rounded-full shadow-md">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[85vh] bg-white">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3 text-xl">
            <ShoppingCart className="h-6 w-6" />
            購物車
            {totalItems > 0 && (
              <Badge className="bg-brand-orange text-white text-base px-3 py-1">
                {totalItems} 項
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full mt-6">
          <div className="flex-1 overflow-y-auto space-y-3 pb-4">
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
                  variant="mobile"
                />
              ))
            )}
          </div>

          {items.length > 0 && (
            <>
              <Separator className="my-4" />

              {/* 合計區域 - 可點擊進入結帳 */}
              <button
                onClick={onOpenCheckout}
                className="w-full bg-gray-900 text-white p-5 rounded-xl text-center mb-5 hover:bg-gray-800 active:scale-[0.98] transition-all"
              >
                <div className="text-base text-gray-300 mb-2">
                  點擊進入結帳
                </div>
                <div className="text-3xl font-bold text-brand-orange">
                  NT$ {total}
                </div>
              </button>

              {/* 清空按鈕 */}
              <div className="pb-4">
                <Button
                  variant="outline"
                  onClick={onClearAll}
                  className="w-full h-14 text-base border-2 active:scale-95"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  清空購物車
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

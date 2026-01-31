import { useState, useEffect } from "react";
import { Package, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface InventoryCountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onConfirm: (inventoryData: Record<string, number>) => void;
  initialData?: Record<string, number>;
}

export function InventoryCountDialog({
  open,
  onOpenChange,
  products,
  onConfirm,
  initialData,
}: InventoryCountDialogProps) {
  const [inventory, setInventory] = useState<Record<string, number>>({});

  // 初始化庫存數據
  useEffect(() => {
    if (open) {
      const initialInventory: Record<string, number> = {};
      products.forEach(product => {
        initialInventory[product.id] = initialData?.[product.id] || 0;
      });
      setInventory(initialInventory);
    }
  }, [open, products, initialData]);

  const handleQuantityChange = (productId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setInventory(prev => ({
      ...prev,
      [productId]: Math.max(0, numValue)
    }));
  };

  const handleIncrement = (productId: string) => {
    setInventory(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const handleDecrement = (productId: string) => {
    setInventory(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) - 1)
    }));
  };

  const handleConfirm = () => {
    onConfirm(inventory);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const totalCount = Object.values(inventory).reduce((sum, count) => sum + count, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-orange rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">閉店庫存盤點</DialogTitle>
                <p className="text-sm text-gray-600 mt-1">
                  請輸入各品項今日閉店時剩餘數量
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">總剩餘數量</div>
              <div className="text-3xl font-bold text-brand-orange">{totalCount}</div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-brand-orange transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-500">NT$ {product.price}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDecrement(product.id)}
                    className="h-12 w-12 rounded-lg border-2"
                  >
                    <span className="text-xl font-bold">-</span>
                  </Button>

                  <Input
                    type="number"
                    min="0"
                    value={inventory[product.id] || 0}
                    onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                    className="h-12 text-center text-xl font-bold flex-1"
                  />

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleIncrement(product.id)}
                    className="h-12 w-12 rounded-lg border-2"
                  >
                    <span className="text-xl font-bold">+</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              size="lg"
              onClick={handleCancel}
              className="min-w-[120px]"
            >
              <X className="mr-2 h-5 w-5" />
              取消
            </Button>
            <Button
              size="lg"
              onClick={handleConfirm}
              className="min-w-[120px] bg-brand-orange hover:bg-brand-orange/90"
            >
              <Check className="mr-2 h-5 w-5" />
              確認並進入日結
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { ArrowLeft, ClipboardList, Loader2 } from "lucide-react";
import { posApi } from "../services/api";
import type { ShiftOrder } from "../types";

interface TodayOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftId: number | null;
}

export function TodayOrdersDialog({
  open,
  onOpenChange,
  shiftId,
}: TodayOrdersDialogProps) {
  const [orders, setOrders] = useState<ShiftOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ShiftOrder | null>(null);

  useEffect(() => {
    if (!open || !shiftId) return;
    setLoading(true);
    posApi
      .getShiftOrders(shiftId)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [open, shiftId]);

  const handleOpenChange = (value: boolean) => {
    if (!value) setSelectedOrder(null);
    onOpenChange(value);
  };

  // ---------- 詳情視圖 ----------
  if (selectedOrder) {
    const discount = selectedOrder.discountAmount;
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-brand-orange" />
              訂單詳情
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* 訂單資訊 */}
            <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">訂單編號</p>
                <p className="font-mono font-bold text-lg">{selectedOrder.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">時間</p>
                <p className="font-bold text-lg">
                  {new Date(selectedOrder.timestamp).toLocaleTimeString("zh-TW", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* 品項表格 */}
            <div className="bg-gray-50 border-2 border-gray-300 rounded-xl overflow-hidden">
              <div className="bg-gray-200 px-4 py-3">
                <h3 className="text-lg font-bold text-gray-900">品項明細</h3>
              </div>
              <div className="bg-white">
                <div className="bg-gray-100 px-4 py-2 font-semibold text-sm text-gray-700 grid grid-cols-12 gap-2 border-b-2 border-gray-300">
                  <div className="col-span-5">品名</div>
                  <div className="col-span-3">加料</div>
                  <div className="col-span-1 text-right">單價</div>
                  <div className="col-span-1 text-center">數量</div>
                  <div className="col-span-2 text-right">小計</div>
                </div>
                <div className="divide-y divide-gray-200">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`px-4 py-3 grid grid-cols-12 gap-2 items-center text-sm ${item.isGift ? 'bg-purple-50' : ''}`}
                    >
                      <div className="col-span-5 font-medium text-gray-900">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span>{item.name}</span>
                          {item.isGift && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded">招待</span>
                          )}
                          {item.itemDiscountLabel && !item.isGift && (
                            <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">{item.itemDiscountLabel}</span>
                          )}
                        </div>
                      </div>
                      <div className="col-span-3 text-gray-500 text-xs">
                        {item.addons.length > 0
                          ? item.addons.map((a) => a.name).join("、")
                          : "-"}
                      </div>
                      <div className="col-span-1 text-right text-gray-600">
                        {item.originalPrice != null && item.originalPrice !== item.price ? (
                          <div>
                            <div className="line-through text-gray-400 text-xs">${item.originalPrice}</div>
                            <div className="text-red-600">${item.price}</div>
                          </div>
                        ) : (
                          <span>${item.price}</span>
                        )}
                      </div>
                      <div className="col-span-1 text-center text-gray-600">
                        {item.quantity}
                      </div>
                      <div className="col-span-2 text-right font-bold text-gray-900">
                        ${item.subtotal}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 金額區塊 */}
            <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-base text-gray-600">
                <span>小計</span>
                <span>NT$ {selectedOrder.subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-base text-red-600">
                  <span>
                    折扣
                    {selectedOrder.discountType === 'percentage' && selectedOrder.discountValue != null && (
                      <span className="text-xs text-gray-500 ml-1">（{selectedOrder.discountValue / 10}折）</span>
                    )}
                    {selectedOrder.discountType === 'amount' && selectedOrder.discountValue != null && (
                      <span className="text-xs text-gray-500 ml-1">（折讓 NT${selectedOrder.discountValue}）</span>
                    )}
                    {selectedOrder.discountType === 'gift' && (
                      <span className="text-xs text-gray-500 ml-1">（招待）</span>
                    )}
                  </span>
                  <span>- NT$ {discount}</span>
                </div>
              )}
              {selectedOrder.customerTag && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>客戶標籤</span>
                  <span>{selectedOrder.customerTag}</span>
                </div>
              )}
              <div className="border-t-2 border-gray-300 pt-3 flex justify-between text-xl font-bold text-gray-900">
                <span>實收</span>
                <span className="text-brand-orange">NT$ {selectedOrder.total}</span>
              </div>
            </div>
          </div>

          {/* 底部按鈕 */}
          <div className="pt-4 border-t-2 border-gray-200">
            <Button
              variant="outline"
              onClick={() => setSelectedOrder(null)}
              className="h-12 min-w-[140px]"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              返回列表
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ---------- 列表視圖 ----------
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-brand-orange" />
            今日訂單
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-2">
            {new Date().toLocaleDateString("zh-TW", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
            {" · "}共 {orders.length} 筆
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-gray-300 rounded-xl overflow-hidden">
              {/* 表頭 */}
              <div className="bg-gray-100 px-4 py-3 font-semibold text-sm text-gray-700 grid grid-cols-12 gap-4 border-b-2 border-gray-300">
                <div className="col-span-2">訂單編號</div>
                <div className="col-span-2">時間</div>
                <div className="col-span-5">品項</div>
                <div className="col-span-3 text-right">實收</div>
              </div>

              {/* 列表 */}
              <div className="bg-white divide-y divide-gray-200 max-h-[60vh] overflow-y-auto">
                {orders.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg">今日尚無訂單</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="px-4 py-3 grid grid-cols-12 gap-4 items-center text-sm cursor-pointer hover:bg-orange-50 transition-colors"
                    >
                      <div className="col-span-2 font-mono text-gray-600">
                        {order.orderNumber}
                      </div>
                      <div className="col-span-2 text-gray-600">
                        {new Date(order.timestamp).toLocaleTimeString("zh-TW", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="col-span-5 text-gray-700">
                        {order.items
                          .slice(0, 2)
                          .map((item, idx) => (
                            <span key={idx}>
                              {idx > 0 && "、"}
                              {item.name} x{item.quantity}
                            </span>
                          ))}
                        {order.items.length > 2 && (
                          <span className="text-gray-400">
                            {" "}
                            +{order.items.length - 2} 項
                          </span>
                        )}
                      </div>
                      <div className="col-span-3 text-right font-bold text-gray-900">
                        NT$ {order.total}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

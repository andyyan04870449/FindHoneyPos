import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Calculator, Printer, TrendingUp, Trophy, ArrowLeft, Check, Package } from "lucide-react";
import type { CompletedOrder, InventoryData, Product, ShiftResponse } from "../types";

interface DailySettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: CompletedOrder[];
  incentiveEnabled?: boolean;
  incentiveTarget?: number;
  inventoryData?: Record<string, number>;
  onBackToInventory?: () => void;
  onConfirmSubmit?: (inventoryData: Record<string, number>) => void;
  currentShift?: ShiftResponse | null;
  products?: Product[];
}

export function DailySettlementDialog({
  open,
  onOpenChange,
  orders,
  incentiveEnabled = false,
  incentiveTarget = 0,
  inventoryData,
  onBackToInventory,
  onConfirmSubmit,
  currentShift,
  products,
}: DailySettlementDialogProps) {
  // 計算今日資料
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  });

  // 若有班次，使用後端即時統計；否則走前端計算
  const totalRevenue = currentShift ? currentShift.totalRevenue : todayOrders.reduce((sum, order) => sum + order.total, 0);
  const totalDiscount = currentShift ? currentShift.totalDiscount : todayOrders.reduce((sum, order) => {
    return sum + (order.subtotal - order.total);
  }, 0);
  const totalOrders = currentShift ? currentShift.totalOrders : todayOrders.length;

  // 計算已售出的商品數量（只計算實際收錢的訂單）— 激勵以天為單位，仍用前端計算
  const totalItemsSold = todayOrders
    .filter(order => order.total > 0)
    .reduce((total, order) => {
      return total + order.items.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);

  const incentiveProgress = incentiveTarget > 0 ? Math.min((totalItemsSold / incentiveTarget) * 100, 100) : 0;
  const incentiveAchieved = totalItemsSold >= incentiveTarget && incentiveTarget > 0;

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmSubmit = () => {
    if (onConfirmSubmit && inventoryData) {
      onConfirmSubmit(inventoryData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[1800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-brand-orange" />
            日結帳報表
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-2">
            {new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* 激勵進度（如果有啟用） */}
          {incentiveEnabled && (
            <div className={`mb-4 p-6 rounded-xl border-2 ${
              incentiveAchieved 
                ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300' 
                : 'bg-teal-50 border-teal-300'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {incentiveAchieved ? (
                    <Trophy className="h-6 w-6 text-yellow-500" />
                  ) : (
                    <TrendingUp className="h-6 w-6 text-teal-600" />
                  )}
                  激勵進度
                </h3>
                {incentiveAchieved && (
                  <span className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold text-sm">
                    🎉 目標達成！
                  </span>
                )}
              </div>
              
              <div className="space-y-3">
                {/* 進度條 */}
                <div className="bg-white/60 rounded-full h-10 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      incentiveAchieved 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-400' 
                        : 'bg-gradient-to-r from-teal-500 to-teal-600'
                    }`}
                    style={{ width: `${incentiveProgress}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bold text-gray-900">
                      {Math.round(incentiveProgress)}%
                    </span>
                  </div>
                </div>

                {/* 數量顯示 */}
                <div className="flex items-center justify-between text-lg">
                  <span className="text-gray-600">已售商品數量</span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold ${
                      incentiveAchieved ? 'text-yellow-600' : 'text-teal-600'
                    }`}>
                      {totalItemsSold}
                    </span>
                    <span className="text-gray-500">/ {incentiveTarget} 個</span>
                  </div>
                </div>

                {incentiveAchieved && (
                  <p className="text-sm text-gray-600 text-center mt-2 p-3 bg-yellow-100 rounded-lg">
                    恭喜！今日已達成銷售目標，員工可獲得獎勵 🎊
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 上方：統計資訊 + 金額結算 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* 左側：統計資訊 */}
            <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">統計資訊</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-300">
                  <span className="text-base text-gray-600">訂單總數</span>
                  <span className="text-2xl font-bold text-gray-900">{totalOrders} 筆</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-300">
                  <span className="text-base text-gray-600">折扣前金額</span>
                  <span className="text-xl font-semibold text-gray-700">NT$ {(totalRevenue + totalDiscount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base text-gray-600">優惠折扣</span>
                  <span className="text-xl font-semibold text-red-600">- NT$ {totalDiscount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 右側：金額結算 */}
            <div className="bg-brand-orange/10 border-2 border-brand-orange rounded-xl p-6 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-gray-900 mb-6">金額結算</h3>
              <div className="text-center">
                <p className="text-base text-gray-600 mb-2">應收現金</p>
                <p className="text-5xl font-bold text-brand-orange mb-4">
                  NT$ {totalRevenue.toLocaleString()}
                </p>
                <div className="h-px bg-brand-orange/30 my-4"></div>
                <p className="text-sm text-gray-500">請核對實際收到的現金金額</p>
              </div>
            </div>
          </div>

          {/* 下方：明細列表 */}
          <div className="bg-gray-50 border-2 border-gray-300 rounded-xl overflow-hidden">
            <div className="bg-gray-200 px-6 py-4">
              <h3 className="text-xl font-bold text-gray-900">明細</h3>
            </div>

            <div className="bg-white">
              <div className="bg-gray-100 px-4 py-3 font-semibold text-sm text-gray-700 grid grid-cols-12 gap-4 border-b-2 border-gray-300">
                <div className="col-span-2">訂單編號</div>
                <div className="col-span-2">時間</div>
                <div className="col-span-4">品項</div>
                <div className="col-span-1 text-right">小計</div>
                <div className="col-span-1 text-right">折扣</div>
                <div className="col-span-2 text-right">實收</div>
              </div>

              <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                {todayOrders.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Calculator className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>今日尚無訂單記錄</p>
                  </div>
                ) : (
                  todayOrders.map((order) => {
                    const discount = order.subtotal - order.total;
                    return (
                      <div key={order.id} className="px-4 py-3 hover:bg-gray-50 grid grid-cols-12 gap-4 items-center text-sm">
                        <div className="col-span-2 font-mono text-gray-600">#{order.id}</div>
                        <div className="col-span-2 text-gray-600">
                          {new Date(order.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="col-span-4 text-gray-700">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="text-xs">
                              {item.name} x{item.quantity}
                              {item.addons && item.addons.length > 0 && (
                                <span className="text-gray-400 ml-1">
                                  ({item.addons.map(a => a.name).join('、')})
                                </span>
                              )}
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className="text-xs text-gray-500">+ {order.items.length - 2} 項</div>
                          )}
                        </div>
                        <div className="col-span-1 text-right text-gray-600">
                          NT$ {order.subtotal}
                        </div>
                        <div className="col-span-1 text-right text-red-600">
                          {discount > 0 ? `-NT$ ${discount}` : '-'}
                        </div>
                        <div className="col-span-2 text-right font-bold text-gray-900">
                          NT$ {order.total}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 閉店盤點 */}
          {inventoryData && Object.keys(inventoryData).length > 0 && (
            <div className="bg-gray-50 border-2 border-gray-300 rounded-xl overflow-hidden mt-4">
              <div className="bg-gray-200 px-6 py-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="h-5 w-5 text-teal-600" />
                  閉店盤點
                </h3>
              </div>
              <div className="bg-white">
                <div className="bg-gray-100 px-4 py-3 font-semibold text-sm text-gray-700 grid grid-cols-2 gap-4 border-b-2 border-gray-300">
                  <div>品項名稱</div>
                  <div className="text-right">剩餘數量</div>
                </div>
                <div className="divide-y divide-gray-200">
                  {Object.entries(inventoryData).map(([productId, quantity]) => {
                    const product = products?.find(p => p.id === productId);
                    return (
                      <div key={productId} className="px-4 py-3 grid grid-cols-2 gap-4 items-center text-sm">
                        <div className="font-medium text-gray-700">
                          {product?.name ?? `商品 #${productId}`}
                        </div>
                        <div className="text-right font-bold text-teal-600">
                          {quantity}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
          {onBackToInventory && (
            <Button
              variant="outline"
              onClick={onBackToInventory}
              className="h-12 min-w-[140px]"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              返回盤點
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex-1 h-12"
          >
            <Printer className="h-5 w-5 mr-2" />
            列印報表
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            className="flex-1 h-12 bg-brand-orange hover:bg-brand-orange/90"
          >
            <Check className="h-5 w-5 mr-2" />
            確認提交
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
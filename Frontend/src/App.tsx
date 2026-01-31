import { useState, useCallback, useEffect } from "react";
import { TopBar } from "./components/TopBar";
import { ProductGrid } from "./components/ProductGrid";
import { OrderPreview } from "./components/OrderPreview";
import { MobileCartSheet } from "./components/MobileCartSheet";
import { CheckoutPanel } from "./components/CheckoutPanel";
import { DailySettlementDialog } from "./components/DailySettlementDialog";
import { IncentiveProgressBar } from "./components/IncentiveProgressBar";
import { InventoryCountDialog } from "./components/InventoryCountDialog";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useCart } from "./hooks/useCart";
import { useOrders } from "./hooks/useOrders";
import { useIncentive } from "./hooks/useIncentive";
import { logger } from "./utils/logger";
import { generateDeviceId } from "./utils/deviceId";
import { products } from "./data/products";
import { generateMockOrders } from "./data/mockOrders";
import { MENU_VERSION } from "./constants";
import type { DiscountInfo, InventoryData } from "./types";

export default function App() {
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [deviceId] = useState(generateDeviceId);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [settlementOpen, setSettlementOpen] = useState(false);
  const [inventoryCountOpen, setInventoryCountOpen] = useState(false);
  const [inventoryData, setInventoryData] = useState<InventoryData>({});

  const isOnline = useOnlineStatus();

  const {
    orderItems,
    setOrderItems,
    addToOrder,
    removeFromOrder,
    updateQuantity,
    clearAllItems,
    getProductQuantity,
  } = useCart();

  const {
    completedOrders,
    setCompletedOrders,
    orderCount,
    calculateTodayItemsSold,
    handleConfirmCheckout,
  } = useOrders({
    orderItems,
    setOrderItems: (items) => setOrderItems(items),
    isOnline,
    unsyncedCount,
    setUnsyncedCount,
  });

  const {
    incentiveEnabled,
    setIncentiveEnabled,
    incentiveTarget,
    setIncentiveTarget,
  } = useIncentive();

  // 初始化模擬訂單
  useEffect(() => {
    setCompletedOrders(generateMockOrders());
  }, [setCompletedOrders]);

  const todayItemsSold = calculateTodayItemsSold();

  // 網路狀態變化處理
  useEffect(() => {
    if (isOnline && unsyncedCount > 0) {
      toast.info(`網路已恢復，開始同步 ${unsyncedCount} 筆資料...`);
      handleSyncData();
    }
  }, [isOnline, unsyncedCount]);

  const handleOpenCheckout = useCallback(() => {
    if (orderItems.length === 0) {
      toast.error("請先選擇商品");
      return;
    }
    setCheckoutOpen(true);
  }, [orderItems]);

  const handleUpdateMenu = useCallback(() => {
    toast.loading("正在更新菜單...");
    logger.systemEvent('開始更新菜單');

    setTimeout(() => {
      toast.success("菜單更新完成");
      logger.systemEvent('菜單更新完成');
    }, 1500);
  }, []);

  const handleSyncData = useCallback(() => {
    if (!isOnline) {
      toast.error("網路未連線，無法同步資料");
      return;
    }

    logger.systemEvent('開始手動同步資料', { unsyncedCount });
    toast.loading("正在同步資料...");

    setTimeout(() => {
      setUnsyncedCount(0);
      toast.success("資料同步完成");
      logger.systemEvent('資料同步完成');
    }, 2000);
  }, [isOnline, unsyncedCount]);

  // 處理庫存盤點確認，然後打開日結帳
  const handleInventoryConfirm = useCallback((inventory: InventoryData) => {
    setInventoryData(inventory);
    setInventoryCountOpen(false);
    logger.userAction('完成庫存盤點', { inventory });
    setSettlementOpen(true);
  }, []);

  // 從日結帳返回庫存盤點
  const handleBackToInventory = useCallback(() => {
    setSettlementOpen(false);
    setInventoryCountOpen(true);
  }, []);

  // 最終提交（日結帳確認）
  const handleFinalSubmit = useCallback((inventory: InventoryData) => {
    logger.userAction('完成日結帳', {
      inventory,
      orderCount: completedOrders.length,
    });
    toast.success('日結帳已完成並記錄！');
  }, [completedOrders]);

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden">
      <TopBar
        isOnline={isOnline}
        menuVersion={MENU_VERSION}
        orderCount={orderCount}
        deviceId={deviceId}
        unsyncedCount={unsyncedCount}
        onUpdateMenu={handleUpdateMenu}
        onSyncData={handleSyncData}
        onOpenSettlement={() => setInventoryCountOpen(true)}
        incentiveEnabled={incentiveEnabled}
        incentiveTarget={incentiveTarget}
        onIncentiveToggle={setIncentiveEnabled}
        onIncentiveTargetChange={setIncentiveTarget}
      />

      <IncentiveProgressBar
        current={todayItemsSold}
        target={incentiveTarget}
        isEnabled={incentiveEnabled}
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0">
        <div className="flex-1 lg:w-[55%] min-h-0">
          <ProductGrid
            products={products}
            onAddToCart={addToOrder}
            onRemoveFromCart={removeFromOrder}
            getProductQuantity={getProductQuantity}
          />
        </div>

        <div className="hidden lg:block lg:w-[45%] min-h-0">
          <OrderPreview
            items={orderItems}
            onUpdateQuantity={updateQuantity}
            onClearAll={clearAllItems}
            onOpenCheckout={handleOpenCheckout}
          />
        </div>
      </div>

      <MobileCartSheet
        items={orderItems}
        onUpdateQuantity={updateQuantity}
        onClearAll={clearAllItems}
        onOpenCheckout={handleOpenCheckout}
      />

      <CheckoutPanel
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        items={orderItems}
        onConfirmCheckout={handleConfirmCheckout}
      />

      <InventoryCountDialog
        open={inventoryCountOpen}
        onOpenChange={setInventoryCountOpen}
        products={products}
        onConfirm={handleInventoryConfirm}
        initialData={inventoryData}
      />

      <DailySettlementDialog
        open={settlementOpen}
        onOpenChange={setSettlementOpen}
        orders={completedOrders}
        incentiveEnabled={incentiveEnabled}
        incentiveTarget={incentiveTarget}
        inventoryData={inventoryData}
        onBackToInventory={handleBackToInventory}
        onConfirmSubmit={handleFinalSubmit}
      />
      <Toaster richColors position="top-center" />
    </div>
  );
}

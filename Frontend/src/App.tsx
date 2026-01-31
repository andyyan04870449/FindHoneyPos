import { useState, useCallback, useEffect, useRef } from "react";
import { TopBar } from "./components/TopBar";
import { ProductGrid } from "./components/ProductGrid";
import { OrderPreview } from "./components/OrderPreview";
import { MobileCartSheet } from "./components/MobileCartSheet";
import { CheckoutPanel } from "./components/CheckoutPanel";
import { DailySettlementDialog } from "./components/DailySettlementDialog";
import { IncentiveProgressBar } from "./components/IncentiveProgressBar";
import { InventoryCountDialog } from "./components/InventoryCountDialog";
import { ProductCustomizeDialog } from "./components/ProductCustomizeDialog";
import { PosLoginPage } from "./components/PosLoginPage";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useCart } from "./hooks/useCart";
import { useOrders } from "./hooks/useOrders";
import { useIncentive } from "./hooks/useIncentive";
import { useProducts } from "./hooks/useProducts";
import { useAddons } from "./hooks/useAddons";
import { useDiscounts } from "./hooks/useDiscounts";
import { useAuth } from "./hooks/useAuth";
import { logger } from "./utils/logger";
import { generateDeviceId } from "./utils/deviceId";
import { posApi, ApiError } from "./services/api";
import { orderQueue } from "./services/orderQueue";
import { MENU_VERSION } from "./constants";
import type { InventoryData, Product, SelectedAddon, OrderItem } from "./types";
import { Loader2 } from "lucide-react";

export default function App() {
  const { user, isAuthenticated, isInitialized, isLoading: authLoading, login, logout, register } = useAuth();

  const [unsyncedCount, setUnsyncedCount] = useState(() => orderQueue.getCount());
  const [deviceId] = useState(generateDeviceId);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [settlementOpen, setSettlementOpen] = useState(false);
  const [inventoryCountOpen, setInventoryCountOpen] = useState(false);
  const [inventoryData, setInventoryData] = useState<InventoryData>({});
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customizeProduct, setCustomizeProduct] = useState<Product | null>(null);
  const [customizeItem, setCustomizeItem] = useState<OrderItem | null>(null);
  const syncingRef = useRef(false);

  const isOnline = useOnlineStatus();

  const { products, refetchProducts } = useProducts(isOnline);
  const { addons } = useAddons();
  const { discounts } = useDiscounts();

  const {
    orderItems,
    setOrderItems,
    addToOrderWithAddons,
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
    deviceId,
    setUnsyncedCount,
  });

  const {
    incentiveEnabled,
    incentiveTarget,
  } = useIncentive();

  const todayItemsSold = calculateTodayItemsSold();

  // 網路恢復時自動同步離線訂單
  useEffect(() => {
    if (!isOnline || syncingRef.current || !isAuthenticated) return;
    const count = orderQueue.getCount();
    if (count === 0) return;

    syncingRef.current = true;
    toast.info(`網路已恢復，開始同步 ${count} 筆資料...`);

    const pending = orderQueue.dequeueAll();
    posApi
      .syncOrders(pending)
      .then((res) => {
        setUnsyncedCount(0);
        toast.success(`同步完成：成功 ${res.syncedCount} 筆`);
        logger.systemEvent('自動同步完成', res);

        // 標記已同步
        const syncedIds = new Set(pending.map((p) => p.localId));
        setCompletedOrders((prev) =>
          prev.map((o) => (syncedIds.has(o.id) ? { ...o, synced: true } : o))
        );
      })
      .catch((err) => {
        const isClientError = err instanceof ApiError && err.status >= 400 && err.status < 500;
        if (isClientError) {
          // 4xx 資料有問題，丟棄不重試
          orderQueue.clear();
          setUnsyncedCount(0);
          toast.error('離線訂單資料異常，已清除');
          logger.error('自動同步失敗（資料異常已丟棄）', { error: String(err), count: pending.length });
        } else {
          // 5xx 或網路錯誤，放回佇列稍後重試
          pending.forEach((p) => orderQueue.enqueue(p.request));
          setUnsyncedCount(orderQueue.getCount());
          toast.error('同步失敗，將稍後重試');
          logger.error('自動同步失敗', { error: String(err) });
        }
      })
      .finally(() => {
        syncingRef.current = false;
      });
  }, [isOnline, setCompletedOrders, isAuthenticated]);

  // 點擊商品 → 直接加入標準品
  const handleProductClick = useCallback((product: Product) => {
    addToOrderWithAddons(product, [], 1);
    logger.userAction('加入購物車（標準品）', { productName: product.name });
  }, [addToOrderWithAddons]);

  // 從訂單明細點「客製化」按鈕 → 開啟彈窗
  const handleOpenCustomize = useCallback(
    (item: OrderItem) => {
      const product = products.find(p => p.id === item.id);
      if (!product) return;
      setCustomizeProduct(product);
      setCustomizeItem(item);
      setCustomizeOpen(true);
      logger.userAction('開啟客製化彈窗', { productName: item.name });
    },
    [products]
  );

  // 客製化確認 → 從原品項扣除數量，產生新的客製化品項
  const handleCustomizeConfirm = useCallback(
    (product: Product, selectedAddons: SelectedAddon[], quantity: number) => {
      if (customizeItem) {
        const remaining = customizeItem.quantity - quantity;
        // 原品項扣除客製化的數量（剩餘 0 則移除）
        updateQuantity(customizeItem.cartItemId, remaining);
      }
      // 加入客製化品項（若已存在同 cartItemId 則合併）
      addToOrderWithAddons(product, selectedAddons, quantity);
      setCustomizeItem(null);
      logger.userAction('完成客製化', {
        productName: product.name,
        addons: selectedAddons.map(a => a.name),
        quantity,
      });
    },
    [customizeItem, updateQuantity, addToOrderWithAddons]
  );

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
    refetchProducts()
      .then(() => toast.success("菜單更新完成"))
      .catch(() => toast.error("菜單更新失敗"))
      .finally(() => logger.systemEvent('菜單更新流程結束'));
  }, [refetchProducts]);

  const handleSyncData = useCallback(() => {
    if (!isOnline) {
      toast.error("網路未連線，無法同步資料");
      return;
    }

    const count = orderQueue.getCount();
    if (count === 0) {
      toast.info("沒有待同步的資料");
      return;
    }

    logger.systemEvent('開始手動同步資料', { count });
    toast.loading("正在同步資料...");

    const pending = orderQueue.dequeueAll();
    posApi
      .syncOrders(pending)
      .then((res) => {
        setUnsyncedCount(0);
        toast.success(`資料同步完成：成功 ${res.syncedCount} 筆`);
        logger.systemEvent('手動同步完成', res);

        const syncedIds = new Set(pending.map((p) => p.localId));
        setCompletedOrders((prev) =>
          prev.map((o) => (syncedIds.has(o.id) ? { ...o, synced: true } : o))
        );
      })
      .catch((err) => {
        const isClientError = err instanceof ApiError && err.status >= 400 && err.status < 500;
        if (isClientError) {
          orderQueue.clear();
          setUnsyncedCount(0);
          toast.error('離線訂單資料異常，已清除');
          logger.error('手動同步失敗（資料異常已丟棄）', { error: String(err), count: pending.length });
        } else {
          pending.forEach((p) => orderQueue.enqueue(p.request));
          setUnsyncedCount(orderQueue.getCount());
          toast.error("資料同步失敗");
          logger.error('手動同步失敗', { error: String(err) });
        }
      });
  }, [isOnline, setCompletedOrders]);

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
  const handleFinalSubmit = useCallback(
    async (inventory: InventoryData) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = completedOrders.filter((o) => {
        const d = new Date(o.timestamp);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });

      const totalRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
      const totalDiscount = todayOrders.reduce(
        (s, o) => s + (o.subtotal - o.total),
        0
      );

      // 計算激勵資料
      const itemsSold = todayOrders
        .filter(o => o.total > 0)
        .reduce((total, o) => total + o.items.reduce((sum, item) => sum + item.quantity, 0), 0);
      const achieved = incentiveEnabled && incentiveTarget > 0 && itemsSold >= incentiveTarget;

      if (isOnline) {
        toast.loading("正在提交日結帳...");
        try {
          await posApi.submitSettlement({
            deviceId,
            date: today.toISOString().slice(0, 10),
            inventory,
            totalOrders: todayOrders.length,
            totalRevenue,
            totalDiscount,
            incentiveTarget: incentiveEnabled ? incentiveTarget : 0,
            incentiveItemsSold: itemsSold,
            incentiveAchieved: achieved,
          });
          toast.dismiss();
          toast.success("日結帳已完成並記錄！");
          logger.userAction('日結帳提交成功');
        } catch (err) {
          toast.dismiss();
          toast.error("日結帳提交失敗，請稍後重試");
          logger.error('日結帳提交失敗', { error: String(err) });
        }
      } else {
        toast.success("日結帳已暫存，待網路恢復後同步");
        logger.userAction('日結帳離線暫存', { inventory });
      }
    },
    [completedOrders, isOnline, deviceId, incentiveEnabled, incentiveTarget]
  );

  // Auth loading state
  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        <Toaster richColors position="top-center" />
      </div>
    );
  }

  // Not authenticated - show login page
  if (!isAuthenticated) {
    return (
      <>
        <PosLoginPage
          isInitialized={isInitialized}
          onLogin={login}
          onRegister={register}
        />
        <Toaster richColors position="top-center" />
      </>
    );
  }

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
        userName={user?.displayName}
        onLogout={logout}
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
            onProductClick={handleProductClick}
            getProductQuantity={getProductQuantity}
          />
        </div>

        <div className="hidden lg:block lg:w-[45%] min-h-0">
          <OrderPreview
            items={orderItems}
            onUpdateQuantity={updateQuantity}
            onClearAll={clearAllItems}
            onOpenCheckout={handleOpenCheckout}
            onCustomize={handleOpenCustomize}
          />
        </div>
      </div>

      <MobileCartSheet
        items={orderItems}
        onUpdateQuantity={updateQuantity}
        onClearAll={clearAllItems}
        onOpenCheckout={handleOpenCheckout}
        onCustomize={handleOpenCustomize}
      />

      <CheckoutPanel
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        items={orderItems}
        discounts={discounts}
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
      <ProductCustomizeDialog
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        product={customizeProduct}
        addons={addons}
        editingItem={customizeItem}
        onConfirm={handleCustomizeConfirm}
      />

      <Toaster richColors position="top-center" />
    </div>
  );
}

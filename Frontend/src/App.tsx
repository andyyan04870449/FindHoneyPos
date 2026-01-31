import { useState, useCallback, useEffect } from "react";
import { TopBar } from "./components/TopBar";
import { ProductGrid } from "./components/ProductGrid";
import { OrderPreview } from "./components/OrderPreview";
import { MobileCartSheet } from "./components/MobileCartSheet";
import { CheckoutPanel, DiscountInfo } from "./components/CheckoutPanel";
import { DailySettlementDialog } from "./components/DailySettlementDialog";
import { IncentiveProgressBar } from "./components/IncentiveProgressBar";
import { InventoryCountDialog } from "./components/InventoryCountDialog";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { logger } from "./utils/logger";

interface Product {
  id: string;
  name: string;
  price: number;
  isPopular?: boolean;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// 模擬商品資料
const mockProducts: Product[] = [
  { id: "1", name: "奶油卡士達泡芙", price: 70, isPopular: true },
  { id: "2", name: "抹茶紅豆瑪德蓮", price: 70, isPopular: true },
  { id: "3", name: "巧克力舒芙蕾", price: 85 },
  { id: "4", name: "芝士蛋糕", price: 80, isPopular: true },
  { id: "5", name: "經典提拉米蘇", price: 85 },
  { id: "6", name: "檸檬塔", price: 65 },
  { id: "7", name: "草莓蛋糕", price: 75 },
  { id: "8", name: "焦糖布丁", price: 60 },
  { id: "9", name: "藍莓司康", price: 55 },
  { id: "10", name: "杏仁餅乾", price: 45 },
  { id: "11", name: "瑪德蓮", price: 50 },
  { id: "12", name: "巧克力泡芙", price: 65 },
  { id: "13", name: "黑森林蛋糕", price: 85 },
  { id: "14", name: "芒果慕斯", price: 80 },
  { id: "15", name: "法式馬卡龍", price: 45 },
];

// 生成裝置ID
const generateDeviceId = () => {
  const stored = localStorage.getItem('pos_device_id');
  if (stored) return stored;
  
  const newId = 'POS-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  localStorage.setItem('pos_device_id', newId);
  return newId;
};

// 生成模擬訂單資料
const generateMockOrders = () => {
  const stored = localStorage.getItem('pos_completed_orders');
  if (stored) {
    try {
      const orders = JSON.parse(stored);
      // 確保日期物件正確還原
      return orders.map((order: any) => ({
        ...order,
        timestamp: new Date(order.timestamp)
      }));
    } catch {
      // 如果解析失敗，生成新的模擬資料
    }
  }
  
  // 生成今天的模擬訂單
  const mockOrders = [];
  const today = new Date();
  
  for (let i = 1; i <= 15; i++) {
    const hour = 9 + Math.floor(Math.random() * 9); // 9:00 - 17:59
    const minute = Math.floor(Math.random() * 60);
    const orderTime = new Date(today);
    orderTime.setHours(hour, minute, 0, 0);
    
    // 隨機選擇 1-4 個商品
    const itemCount = 1 + Math.floor(Math.random() * 4);
    const items = [];
    let subtotal = 0;
    
    for (let j = 0; j < itemCount; j++) {
      const product = mockProducts[Math.floor(Math.random() * mockProducts.length)];
      const quantity = 1 + Math.floor(Math.random() * 3);
      items.push({
        name: product.name,
        quantity,
        price: product.price
      });
      subtotal += product.price * quantity;
    }
    
    // 隨機折扣
    let discount = undefined;
    let total = subtotal;
    const hasDiscount = Math.random() > 0.6;
    
    if (hasDiscount) {
      const discountType = Math.random();
      if (discountType < 0.4) {
        // 打折
        const percentage = [0.9, 0.85, 0.8, 0.75][Math.floor(Math.random() * 4)];
        discount = { type: 'percentage' as const, value: percentage };
        total = Math.round(subtotal * percentage);
      } else if (discountType < 0.8) {
        // 固定折扣
        const fixedAmount = [10, 20, 30, 50][Math.floor(Math.random() * 4)];
        discount = { type: 'fixed' as const, value: fixedAmount };
        total = Math.max(0, subtotal - fixedAmount);
      } else {
        // 整單贈送
        discount = { type: 'gift' as const, value: 100 };
        total = 0;
      }
    }
    
    mockOrders.push({
      id: String(126 + i).padStart(4, '0'),
      timestamp: orderTime,
      items,
      subtotal,
      discount,
      total
    });
  }
  
  // 儲存到 localStorage
  localStorage.setItem('pos_completed_orders', JSON.stringify(mockOrders));
  return mockOrders;
};

export default function App() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderCount, setOrderCount] = useState(125);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [deviceId] = useState(generateDeviceId);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [settlementOpen, setSettlementOpen] = useState(false);
  const [inventoryCountOpen, setInventoryCountOpen] = useState(false);
  const [inventoryData, setInventoryData] = useState<Record<string, number>>({});
  const [completedOrders, setCompletedOrders] = useState(generateMockOrders);
  
  // 激勵功能狀態 - 強制啟用
  const [incentiveEnabled, setIncentiveEnabled] = useState(true);
  const [incentiveTarget, setIncentiveTarget] = useState(125);
  
  // 首次載入時設置 localStorage
  useEffect(() => {
    localStorage.setItem('pos_incentive_enabled', 'true');
    localStorage.setItem('pos_incentive_target', '125');
  }, []);
  
  const isOnline = useOnlineStatus();

  // 計算當天已售出的商品數量（只計算實際收錢的訂單）
  const calculateTodayItemsSold = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return completedOrders
      .filter(order => {
        const orderDate = new Date(order.timestamp);
        orderDate.setHours(0, 0, 0, 0);
        // 只計算今天且實際收錢的訂單（total > 0）
        return orderDate.getTime() === today.getTime() && order.total > 0;
      })
      .reduce((total, order) => {
        // 累加所有商品的數量
        return total + order.items.reduce((sum, item) => sum + item.quantity, 0);
      }, 0);
  }, [completedOrders]);

  const todayItemsSold = calculateTodayItemsSold();

  // 載入儲存的訂單
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pos_cart');
      if (stored) {
        const cart = JSON.parse(stored);
        setOrderItems(cart);
        logger.systemEvent('載入儲存的購物車', { itemCount: cart.length });
      }
    } catch (error) {
      logger.error('載入購物車失敗', error);
    }
  }, []);

  // 儲存購物車到本地
  useEffect(() => {
    try {
      localStorage.setItem('pos_cart', JSON.stringify(orderItems));
    } catch (error) {
      logger.error('儲存購物車失敗', error);
    }
  }, [orderItems]);

  // 網路狀態變化處理
  useEffect(() => {
    if (isOnline && unsyncedCount > 0) {
      toast.info(`網路已恢復，開始同步 ${unsyncedCount} 筆資料...`);
      handleSyncData();
    }
  }, [isOnline, unsyncedCount]);

  const addToOrder = useCallback((product: Product) => {
    setOrderItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  }, []);

  const removeFromOrder = useCallback((productId: string) => {
    setOrderItems(prev => {
      return prev.map(item =>
        item.id === productId
          ? { ...item, quantity: Math.max(0, item.quantity - 1) }
          : item
      ).filter(item => item.quantity > 0);
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(prev => prev.filter(item => item.id !== productId));
    } else {
      setOrderItems(prev =>
        prev.map(item => {
          if (item.id === productId) {
            return { ...item, quantity };
          }
          return item;
        })
      );
    }
  }, []);

  const clearAllItems = useCallback(() => {
    if (window.confirm("確定要清除所有商品嗎？")) {
      setOrderItems([]);
      toast.success("已清除所有商品");
      logger.userAction('清空購物車');
    }
  }, []);

  const handleOpenCheckout = useCallback(() => {
    if (orderItems.length === 0) {
      toast.error("請先選擇商品");
      return;
    }
    setCheckoutOpen(true);
  }, [orderItems]);

  const handleConfirmCheckout = useCallback((discountInfo: DiscountInfo) => {
    logger.userAction('確認結帳', { 
      itemCount: orderItems.length,
      ...discountInfo
    });

    // 模擬結帳處理
    toast.loading("正在處理訂單...");
    
    setTimeout(() => {
      if (isOnline) {
        toast.success(`結帳成功！實付金額 NT$ ${discountInfo.finalTotal}`);
        setOrderCount(prev => prev + 1);
        setOrderItems([]);
        logger.systemEvent('訂單完成', { 
          orderNumber: orderCount + 1,
          ...discountInfo
        });
      } else {
        toast.success("訂單已暫存，將在網路恢復後同步");
        setUnsyncedCount(prev => prev + 1);
        setOrderItems([]);
        logger.systemEvent('訂單離線暫存', { 
          orderNumber: orderCount + 1,
          ...discountInfo
        });
      }
    }, 1500);
  }, [orderItems, isOnline, orderCount]);

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

  const getProductQuantity = useCallback((productId: string) => {
    const item = orderItems.find(item => item.id === productId);
    return item ? item.quantity : 0;
  }, [orderItems]);

  // 處理庫存盤點確認，然後打開日結帳
  const handleInventoryConfirm = useCallback((inventory: Record<string, number>) => {
    setInventoryData(inventory);
    setInventoryCountOpen(false);
    logger.userAction('完成庫存盤點', { inventory });
    // 打開日結帳對話框
    setSettlementOpen(true);
  }, []);

  // 從日結帳返回庫存盤點
  const handleBackToInventory = useCallback(() => {
    setSettlementOpen(false);
    setInventoryCountOpen(true);
  }, []);

  // 最終提交（日結帳確認）
  const handleFinalSubmit = useCallback((inventory: Record<string, number>) => {
    logger.userAction('完成日結帳', { 
      inventory,
      orderCount: completedOrders.length
    });
    toast.success('日結帳已完成並記錄！');
    // 這裡可以添加實際的數據提交邏輯
  }, [completedOrders]);

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden">
      {/* 頂部狀態列 - 固定高度 */}
      <TopBar 
        isOnline={isOnline}
        menuVersion="v2.1.3"
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

      {/* 激勵進度條 */}
      <IncentiveProgressBar 
        current={todayItemsSold}
        target={incentiveTarget}
        isEnabled={incentiveEnabled}
      />
      
      {/* 主要內容區 - 佔據剩餘空間 */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0">
        {/* 商品清單區 - 手機全寬，桌面55% */}
        <div className="flex-1 lg:w-[55%] min-h-0">
          <ProductGrid
            products={mockProducts}
            onAddToCart={addToOrder}
            onRemoveFromCart={removeFromOrder}
            getProductQuantity={getProductQuantity}
          />
        </div>

        {/* 訂單預覽區 - 手機隱藏，桌面45% */}
        <div className="hidden lg:block lg:w-[45%] min-h-0">
          <OrderPreview
            items={orderItems}
            onUpdateQuantity={updateQuantity}
            onClearAll={clearAllItems}
            onOpenCheckout={handleOpenCheckout}
          />
        </div>
      </div>

      {/* 手機版浮動購物車按鈕 */}
      <MobileCartSheet
        items={orderItems}
        onUpdateQuantity={updateQuantity}
        onClearAll={clearAllItems}
        onOpenCheckout={handleOpenCheckout}
      />

      {/* 結帳面板 */}
      <CheckoutPanel
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        items={orderItems}
        onConfirmCheckout={handleConfirmCheckout}
      />

      {/* 庫存盤點對話框 */}
      <InventoryCountDialog
        open={inventoryCountOpen}
        onOpenChange={setInventoryCountOpen}
        products={mockProducts}
        onConfirm={handleInventoryConfirm}
        initialData={inventoryData}
      />

      {/* 日結對話框 */}
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
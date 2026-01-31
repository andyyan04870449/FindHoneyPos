import { useState, useCallback } from 'react';
import type { CompletedOrder, DiscountInfo, OrderItem, CreateOrderRequest } from '../types';
import { INITIAL_ORDER_COUNT } from '../constants';
import { logger } from '../utils/logger';
import { toast } from 'sonner@2.0.3';
import { posApi } from '../services/api';
import { orderQueue } from '../services/orderQueue';

interface UseOrdersOptions {
  orderItems: OrderItem[];
  setOrderItems: (items: OrderItem[]) => void;
  isOnline: boolean;
  deviceId: string;
  setUnsyncedCount: React.Dispatch<React.SetStateAction<number>>;
}

function buildCreateOrderRequest(
  deviceId: string,
  orderItems: OrderItem[],
  discountInfo: DiscountInfo
): CreateOrderRequest {
  return {
    deviceId,
    items: orderItems.map((item) => {
      const addonTotal = item.addons?.reduce((sum, a) => sum + a.price, 0) ?? 0;
      return {
        productId: parseInt(item.id, 10) || 0,
        productName: item.name,
        price: item.price - addonTotal,
        quantity: item.quantity,
        addons: item.addons?.map((a) => ({
          productId: parseInt(a.id, 10) || 0,
          productName: a.name,
          price: a.price,
        })),
      };
    }),
    discountType: discountInfo.discountAmount > 0 ? discountInfo.type : undefined,
    discountValue: discountInfo.discountAmount > 0 ? discountInfo.value : undefined,
    discountAmount: discountInfo.discountAmount > 0 ? discountInfo.discountAmount : undefined,
    customerTag: discountInfo.customerTag,
  };
}

function buildCompletedOrder(
  orderId: string,
  orderItems: OrderItem[],
  discountInfo: DiscountInfo,
  synced: boolean
): CompletedOrder {
  return {
    id: orderId,
    timestamp: new Date(),
    items: orderItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      addons: item.addons,
    })),
    subtotal: discountInfo.originalTotal,
    discount:
      discountInfo.discountAmount > 0
        ? { type: discountInfo.type, value: discountInfo.value }
        : undefined,
    total: discountInfo.finalTotal,
    synced,
  };
}

export function useOrders({
  orderItems,
  setOrderItems,
  isOnline,
  deviceId,
  setUnsyncedCount,
}: UseOrdersOptions) {
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [orderCount, setOrderCount] = useState(INITIAL_ORDER_COUNT);

  const calculateTodayItemsSold = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return completedOrders
      .filter((order) => {
        const orderDate = new Date(order.timestamp);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime() && order.total > 0;
      })
      .reduce((total, order) => {
        return total + order.items.reduce((sum, item) => sum + item.quantity, 0);
      }, 0);
  }, [completedOrders]);

  const handleConfirmCheckout = useCallback(
    async (discountInfo: DiscountInfo) => {
      logger.userAction('確認結帳', {
        itemCount: orderItems.length,
        ...discountInfo,
      });

      const request = buildCreateOrderRequest(deviceId, orderItems, discountInfo);

      if (isOnline) {
        toast.loading('正在處理訂單...');
        try {
          const res = await posApi.createOrder(request);
          const order = buildCompletedOrder(
            res.orderId,
            orderItems,
            discountInfo,
            true
          );
          setCompletedOrders((prev) => [...prev, order]);
          setOrderCount(res.orderNumber);
          setOrderItems([]);
          toast.dismiss();
          toast.success(`結帳成功！實付金額 NT$ ${discountInfo.finalTotal}`);
          logger.systemEvent('訂單完成（線上）', { orderId: res.orderId });
        } catch (err) {
          // 線上失敗 → 放入佇列
          toast.dismiss();
          logger.warn('線上建單失敗，轉入離線佇列', { error: String(err) });
          const pending = orderQueue.enqueue(request);
          const order = buildCompletedOrder(
            pending.localId,
            orderItems,
            discountInfo,
            false
          );
          setCompletedOrders((prev) => [...prev, order]);
          setOrderCount((prev) => prev + 1);
          setUnsyncedCount(orderQueue.getCount());
          setOrderItems([]);
          toast.success('訂單已暫存，將在網路恢復後同步');
        }
      } else {
        // 離線 → 直接入佇列
        const pending = orderQueue.enqueue(request);
        const order = buildCompletedOrder(
          pending.localId,
          orderItems,
          discountInfo,
          false
        );
        setCompletedOrders((prev) => [...prev, order]);
        setOrderCount((prev) => prev + 1);
        setUnsyncedCount(orderQueue.getCount());
        setOrderItems([]);
        toast.success('訂單已暫存，將在網路恢復後同步');
        logger.systemEvent('訂單離線暫存', { localId: pending.localId });
      }
    },
    [orderItems, isOnline, deviceId, setOrderItems, setUnsyncedCount]
  );

  return {
    completedOrders,
    setCompletedOrders,
    orderCount,
    calculateTodayItemsSold,
    handleConfirmCheckout,
  };
}

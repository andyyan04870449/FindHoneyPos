import { useState, useCallback } from 'react';
import type { CompletedOrder, DiscountInfo, OrderItem } from '../types';
import { INITIAL_ORDER_COUNT } from '../constants';
import { logger } from '../utils/logger';
import { toast } from 'sonner@2.0.3';

interface UseOrdersOptions {
  orderItems: OrderItem[];
  setOrderItems: (items: OrderItem[]) => void;
  isOnline: boolean;
  unsyncedCount: number;
  setUnsyncedCount: React.Dispatch<React.SetStateAction<number>>;
}

export function useOrders({
  orderItems,
  setOrderItems,
  isOnline,
  unsyncedCount,
  setUnsyncedCount,
}: UseOrdersOptions) {
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [orderCount, setOrderCount] = useState(INITIAL_ORDER_COUNT);

  const calculateTodayItemsSold = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return completedOrders
      .filter(order => {
        const orderDate = new Date(order.timestamp);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime() && order.total > 0;
      })
      .reduce((total, order) => {
        return total + order.items.reduce((sum, item) => sum + item.quantity, 0);
      }, 0);
  }, [completedOrders]);

  const handleConfirmCheckout = useCallback((discountInfo: DiscountInfo) => {
    logger.userAction('確認結帳', {
      itemCount: orderItems.length,
      ...discountInfo,
    });

    toast.loading("正在處理訂單...");

    setTimeout(() => {
      if (isOnline) {
        toast.success(`結帳成功！實付金額 NT$ ${discountInfo.finalTotal}`);
        setOrderCount(prev => prev + 1);
        setOrderItems([]);
        logger.systemEvent('訂單完成', {
          orderNumber: orderCount + 1,
          ...discountInfo,
        });
      } else {
        toast.success("訂單已暫存，將在網路恢復後同步");
        setUnsyncedCount(prev => prev + 1);
        setOrderItems([]);
        logger.systemEvent('訂單離線暫存', {
          orderNumber: orderCount + 1,
          ...discountInfo,
        });
      }
    }, 1500);
  }, [orderItems, isOnline, orderCount, setOrderItems, setUnsyncedCount]);

  return {
    completedOrders,
    setCompletedOrders,
    orderCount,
    calculateTodayItemsSold,
    handleConfirmCheckout,
  };
}

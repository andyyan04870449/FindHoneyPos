import { useState, useCallback, useEffect } from 'react';
import type { Product, OrderItem } from '../types';
import { STORAGE_KEYS } from '../constants';
import { logger } from '../utils/logger';
import { toast } from 'sonner@2.0.3';

export function useCart() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // 載入儲存的購物車
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CART);
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
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(orderItems));
    } catch (error) {
      logger.error('儲存購物車失敗', error);
    }
  }, [orderItems]);

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

  const getProductQuantity = useCallback((productId: string) => {
    const item = orderItems.find(item => item.id === productId);
    return item ? item.quantity : 0;
  }, [orderItems]);

  return {
    orderItems,
    setOrderItems,
    addToOrder,
    removeFromOrder,
    updateQuantity,
    clearAllItems,
    getProductQuantity,
  };
}

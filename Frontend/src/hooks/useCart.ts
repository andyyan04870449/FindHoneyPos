import { useState, useCallback, useEffect } from 'react';
import type { Product, OrderItem, SelectedAddon } from '../types';
import { STORAGE_KEYS } from '../constants';
import { logger } from '../utils/logger';
import { toast } from 'sonner';
import { generateCartItemId, calculateUnitPrice } from '../utils/cartUtils';

export function useCart() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // 載入儲存的購物車（含遷移舊資料）
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CART);
      if (stored) {
        const cart: OrderItem[] = JSON.parse(stored);
        // 遷移：若缺少 cartItemId，自動補上
        const migrated = cart.map(item => ({
          ...item,
          cartItemId: item.cartItemId || item.id,
        }));
        setOrderItems(migrated);
        logger.systemEvent('載入儲存的購物車', { itemCount: migrated.length });
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

  const addToOrderWithAddons = useCallback(
    (product: Product, addons: SelectedAddon[], quantity: number) => {
      const cartItemId = generateCartItemId(product.id, addons);
      const basePrice = (product.isOnPromotion && product.promotionPrice != null) ? product.promotionPrice : product.price;
      const unitPrice = calculateUnitPrice(basePrice, addons);

      setOrderItems(prev => {
        const existing = prev.find(item => item.cartItemId === cartItemId);
        if (existing) {
          return prev.map(item =>
            item.cartItemId === cartItemId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [
          ...prev,
          {
            id: product.id,
            cartItemId,
            name: product.name,
            price: unitPrice,
            quantity,
            addons: addons.length > 0 ? addons : undefined,
          },
        ];
      });
    },
    []
  );

  const removeFromOrder = useCallback((cartItemId: string) => {
    setOrderItems(prev =>
      prev
        .map(item =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
    } else {
      setOrderItems(prev =>
        prev.map(item =>
          item.cartItemId === cartItemId ? { ...item, quantity } : item
        )
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

  // 加總同商品所有變體的數量
  const getProductQuantity = useCallback(
    (productId: string) => {
      return orderItems
        .filter(item => item.id === productId)
        .reduce((sum, item) => sum + item.quantity, 0);
    },
    [orderItems]
  );

  return {
    orderItems,
    setOrderItems,
    addToOrderWithAddons,
    removeFromOrder,
    updateQuantity,
    clearAllItems,
    getProductQuantity,
  };
}

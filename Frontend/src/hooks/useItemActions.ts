import { useCallback } from 'react';
import type { OrderItem } from '../types';
import { generateUniqueCartItemId } from '../utils/cartUtils';

interface UseItemActionsOptions {
  orderItems: OrderItem[];
  setOrderItems: (items: OrderItem[]) => void;
}

export function useItemActions({ orderItems, setOrderItems }: UseItemActionsOptions) {
  /**
   * 贈送品項
   * qty=1 → 原地改為 price=0, isGift=true
   * qty>1 → 原品項 qty-1，新增一行 qty=1, price=0, isGift=true
   */
  const giftItem = useCallback((cartItemId: string) => {
    const idx = orderItems.findIndex(i => i.cartItemId === cartItemId);
    if (idx === -1) return;

    const item = orderItems[idx];
    const newItems = [...orderItems];

    if (item.quantity === 1) {
      newItems[idx] = {
        ...item,
        originalPrice: item.originalPrice ?? item.price,
        price: 0,
        addons: item.addons?.map(a => ({ ...a, price: 0 })),
        isGift: true,
        itemDiscountLabel: '贈送',
      };
    } else {
      // 原品項數量 -1
      newItems[idx] = { ...item, quantity: item.quantity - 1 };
      // 新增贈送行
      const giftId = generateUniqueCartItemId(item.cartItemId, 'gift');
      const giftEntry: OrderItem = {
        ...item,
        cartItemId: giftId,
        quantity: 1,
        originalPrice: item.price,
        price: 0,
        addons: item.addons?.map(a => ({ ...a, price: 0 })),
        isGift: true,
        itemDiscountLabel: '贈送',
        splitSource: item.cartItemId,
      };
      newItems.splice(idx + 1, 0, giftEntry);
    }

    setOrderItems(newItems);
  }, [orderItems, setOrderItems]);

  /**
   * 分離品項
   * 從原品項拆出 splitQty 個成為獨立行
   */
  const splitItem = useCallback((cartItemId: string, splitQty: number) => {
    const idx = orderItems.findIndex(i => i.cartItemId === cartItemId);
    if (idx === -1) return;

    const item = orderItems[idx];
    if (splitQty <= 0 || splitQty >= item.quantity) return;

    const newItems = [...orderItems];
    // 原品項減少數量
    newItems[idx] = { ...item, quantity: item.quantity - splitQty };
    // 新增分離行
    const splitId = generateUniqueCartItemId(item.cartItemId, 'split');
    const splitItemObj: OrderItem = {
      ...item,
      cartItemId: splitId,
      quantity: splitQty,
      splitSource: item.cartItemId,
    };
    newItems.splice(idx + 1, 0, splitItemObj);

    setOrderItems(newItems);
  }, [orderItems, setOrderItems]);

  /**
   * 變更單品單價
   * 記錄 originalPrice 和 label
   */
  const changeItemPrice = useCallback((cartItemId: string, newPrice: number, label: string) => {
    const idx = orderItems.findIndex(i => i.cartItemId === cartItemId);
    if (idx === -1) return;

    const item = orderItems[idx];
    const newItems = [...orderItems];
    newItems[idx] = {
      ...item,
      originalPrice: item.originalPrice ?? item.price,
      price: newPrice,
      itemDiscountLabel: label,
      isGift: false,
    };

    setOrderItems(newItems);
  }, [orderItems, setOrderItems]);

  return { giftItem, splitItem, changeItemPrice };
}

import type { CompletedOrder } from '../types';
import { STORAGE_KEYS } from '../constants';
import { products } from './products';

export function generateMockOrders(): CompletedOrder[] {
  const stored = localStorage.getItem(STORAGE_KEYS.COMPLETED_ORDERS);
  if (stored) {
    try {
      const orders = JSON.parse(stored);
      return orders.map((order: any) => ({
        ...order,
        timestamp: new Date(order.timestamp),
      }));
    } catch {
      // 如果解析失敗，生成新的模擬資料
    }
  }

  const mockOrders: CompletedOrder[] = [];
  const today = new Date();

  for (let i = 1; i <= 15; i++) {
    const hour = 9 + Math.floor(Math.random() * 9); // 9:00 - 17:59
    const minute = Math.floor(Math.random() * 60);
    const orderTime = new Date(today);
    orderTime.setHours(hour, minute, 0, 0);

    const itemCount = 1 + Math.floor(Math.random() * 4);
    const items: CompletedOrder['items'] = [];
    let subtotal = 0;

    for (let j = 0; j < itemCount; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = 1 + Math.floor(Math.random() * 3);
      items.push({
        name: product.name,
        quantity,
        price: product.price,
      });
      subtotal += product.price * quantity;
    }

    let discount: CompletedOrder['discount'] = undefined;
    let total = subtotal;
    const hasDiscount = Math.random() > 0.6;

    if (hasDiscount) {
      const discountType = Math.random();
      if (discountType < 0.4) {
        const percentage = [0.9, 0.85, 0.8, 0.75][Math.floor(Math.random() * 4)];
        discount = { type: 'percentage' as const, value: percentage };
        total = Math.round(subtotal * percentage);
      } else if (discountType < 0.8) {
        const fixedAmount = [10, 20, 30, 50][Math.floor(Math.random() * 4)];
        discount = { type: 'amount' as const, value: fixedAmount };
        total = Math.max(0, subtotal - fixedAmount);
      } else {
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
      total,
    });
  }

  localStorage.setItem(STORAGE_KEYS.COMPLETED_ORDERS, JSON.stringify(mockOrders));
  return mockOrders;
}

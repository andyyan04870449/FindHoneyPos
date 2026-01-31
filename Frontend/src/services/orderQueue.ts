import { STORAGE_KEYS } from '../constants';
import { logger } from '../utils/logger';
import type { PendingOrder, CreateOrderRequest } from '../types';

function load(): PendingOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENDING_ORDERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(orders: PendingOrder[]): void {
  localStorage.setItem(STORAGE_KEYS.PENDING_ORDERS, JSON.stringify(orders));
}

export const orderQueue = {
  /** 加入一筆待同步訂單 */
  enqueue(request: CreateOrderRequest): PendingOrder {
    const pending: PendingOrder = {
      localId: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      request,
      createdAt: new Date().toISOString(),
    };
    const queue = load();
    queue.push(pending);
    save(queue);
    logger.info('訂單加入離線佇列', { localId: pending.localId });
    return pending;
  },

  /** 取出全部待同步訂單並清空佇列 */
  dequeueAll(): PendingOrder[] {
    const queue = load();
    if (queue.length > 0) {
      save([]);
      logger.info('取出全部離線訂單', { count: queue.length });
    }
    return queue;
  },

  /** 取得待同步數量 */
  getCount(): number {
    return load().length;
  },

  /** 清空佇列 */
  clear(): void {
    save([]);
    logger.info('清空離線訂單佇列');
  },
};

export const STORAGE_KEYS = {
  DEVICE_ID: 'pos_device_id',
  CART: 'pos_cart',
  COMPLETED_ORDERS: 'pos_completed_orders',
  LOGS: 'pos_logs',
  INCENTIVE_ENABLED: 'pos_incentive_enabled',
  INCENTIVE_TARGET: 'pos_incentive_target',
  PENDING_ORDERS: 'pos_pending_orders',
} as const;

export const DEFAULT_INCENTIVE_TARGET = 125;

export const MAX_LOG_ENTRIES = {
  MEMORY: 1000,
  STORAGE: 100,
} as const;

export const HEARTBEAT_INTERVAL = 30000;

export const MENU_VERSION = 'v2.1.3';


export const INITIAL_ORDER_COUNT = 125;

export const DEFAULT_ADDONS = [
  { id: 'cream', name: '鮮奶油', price: 15 },
  { id: 'chocolate', name: '巧克力醬', price: 10 },
  { id: 'caramel', name: '焦糖醬', price: 10 },
  { id: 'nuts', name: '堅果碎', price: 20 },
  { id: 'red_bean', name: '紅豆', price: 15 },
  { id: 'matcha', name: '抹茶粉', price: 10 },
  { id: 'honey', name: '蜂蜜', price: 10 },
  { id: 'mochi', name: '麻糬', price: 15 },
] as const;

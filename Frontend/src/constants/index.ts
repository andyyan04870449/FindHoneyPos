export const STORAGE_KEYS = {
  DEVICE_ID: 'pos_device_id',
  CART: 'pos_cart',
  COMPLETED_ORDERS: 'pos_completed_orders',
  LOGS: 'pos_logs',
  PENDING_ORDERS: 'pos_pending_orders',
} as const;

export const MAX_LOG_ENTRIES = {
  MEMORY: 1000,
  STORAGE: 100,
} as const;

export const HEARTBEAT_INTERVAL = 30000;

export const MENU_VERSION = 'v2.1.3';


export const INITIAL_ORDER_COUNT = 125;


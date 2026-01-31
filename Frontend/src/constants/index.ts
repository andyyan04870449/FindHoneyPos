export const STORAGE_KEYS = {
  DEVICE_ID: 'pos_device_id',
  CART: 'pos_cart',
  COMPLETED_ORDERS: 'pos_completed_orders',
  LOGS: 'pos_logs',
  INCENTIVE_ENABLED: 'pos_incentive_enabled',
  INCENTIVE_TARGET: 'pos_incentive_target',
} as const;

export const DEFAULT_INCENTIVE_TARGET = 125;

export const MAX_LOG_ENTRIES = {
  MEMORY: 1000,
  STORAGE: 100,
} as const;

export const HEARTBEAT_INTERVAL = 30000;

export const MENU_VERSION = 'v2.1.3';

export const QUICK_DISCOUNT_PERCENTAGES = [
  { label: '9折', value: 10 },
  { label: '85折', value: 15 },
  { label: '8折', value: 20 },
  { label: '75折', value: 25 },
] as const;

export const QUICK_DISCOUNT_AMOUNTS = [
  { label: '-50', value: 50 },
  { label: '100', value: 100 },
  { label: '200', value: 200 },
  { label: '500', value: 500 },
] as const;

export const INITIAL_ORDER_COUNT = 125;

export interface Product {
  id: string;
  name: string;
  price: number;
  isPopular?: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CompletedOrder {
  id: string;
  timestamp: Date;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  discount?: {
    type: 'percentage' | 'fixed' | 'gift';
    value: number;
  };
  total: number;
}

export interface DiscountInfo {
  type: DiscountType;
  value: number;
  label: string;
  originalTotal: number;
  discountAmount: number;
  finalTotal: number;
}

export type DiscountType = 'percentage' | 'amount' | 'free';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

export type InventoryData = Record<string, number>;

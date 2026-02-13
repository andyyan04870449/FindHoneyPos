export interface Product {
  id: string;
  name: string;
  price: number;
  isOnPromotion?: boolean;
  promotionPrice?: number;
  cardColor?: string;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
}

export interface SelectedAddon {
  id: string;
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  cartItemId: string;
  name: string;
  price: number;
  quantity: number;
  addons?: SelectedAddon[];
  isGift?: boolean;
  originalPrice?: number;
  itemDiscountLabel?: string;
  splitSource?: string;
}

export type DiscountType = 'percentage' | 'amount' | 'gift';

export interface CompletedOrder {
  id: string;
  timestamp: Date;
  items: { name: string; quantity: number; price: number; addons?: SelectedAddon[] }[];
  subtotal: number;
  discount?: {
    type: DiscountType;
    value: number;
  };
  total: number;
  synced?: boolean;
}

export interface DiscountInfo {
  type: DiscountType;
  value: number;
  label: string;
  originalTotal: number;
  discountAmount: number;
  finalTotal: number;
  customerTag?: string;
}

export interface PosDiscount {
  id: string;
  name: string;
  type: DiscountType;
  value: number;
  minPurchase: number;
  description?: string;
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

export type InventoryData = Record<string, number>;

// --- API 相關型別 ---

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface CreateOrderRequest {
  deviceId: string;
  items: {
    productId: number;
    productName: string;
    price: number;
    quantity: number;
    addons?: { productId: number; productName: string; price: number }[];
    isGift?: boolean;
    originalPrice?: number;
    itemDiscountLabel?: string;
  }[];
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  customerTag?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  orderNumber: number;
}

export interface BatchSyncResponse {
  syncedCount: number;
  failedCount: number;
}

export interface SubmitSettlementRequest {
  deviceId: string;
  inventoryCounts: Record<number, number>;
  incentiveTarget?: number;
  incentiveItemsSold?: number;
  incentiveAchieved?: boolean;
}

export interface SettlementResponse {
  settlementId: string;
}

export interface SyncStatusResponse {
  pendingCount: number;
  lastSyncTime?: string;
}

export interface PendingOrder {
  localId: string;
  request: CreateOrderRequest;
  createdAt: string;
}

// Auth Types
export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  isActive: boolean;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface SystemStatus {
  initialized: boolean;
}

export interface IncentiveSettingsResponse {
  isEnabled: boolean;
  dailyTarget: number;
  updatedAt: string;
}

// --- 班次相關型別 ---

export interface ShiftResponse {
  id: number;
  deviceId: string | null;
  status: string;
  openedAt: string;
  closedAt: string | null;
  totalOrders: number;
  totalRevenue: number;
  totalDiscount: number;
  netRevenue: number;
  settlementId: number | null;
}

export interface ShiftStatusResponse {
  hasOpenShift: boolean;
  shift: ShiftResponse | null;
}

export interface CloseShiftRequest {
  inventoryCounts: Record<number, number>;
  incentiveTarget?: number;
  incentiveItemsSold?: number;
  incentiveAchieved?: boolean;
}

export interface CloseShiftResponse {
  shift: ShiftResponse;
  settlement: SettlementResponse;
}

// --- 班次訂單 ---

export interface ShiftOrderAddon {
  name: string;
  price: number;
}

export interface ShiftOrderItem {
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  addons: ShiftOrderAddon[];
  isGift: boolean;
  originalPrice?: number;
  itemDiscountLabel?: string;
}

export interface ShiftOrder {
  id: number;
  orderNumber: string;
  timestamp: string;
  items: ShiftOrderItem[];
  subtotal: number;
  discountAmount: number;
  discountType: string | null;
  discountValue: number | null;
  total: number;
  status: string;
  paymentMethod: string;
  customerTag: string | null;
}

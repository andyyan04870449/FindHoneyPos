export interface Product {
  id: string;
  name: string;
  price: number;
  status: 'Active' | 'Inactive';
}

export interface OrderItemAddon {
  name: string;
  price: number;
}

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  addons: OrderItemAddon[];
}

export interface Order {
  id: number;
  orderNumber: string;
  timestamp: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  status: 'completed' | 'cancelled';
  paymentMethod: string;
  discountType?: string;
  discountValue?: number;
}

export interface Discount {
  id: string;
  name: string;
  type: 'percentage' | 'amount' | 'gift';
  value: number;
  minPurchase: number;
  isActive: boolean;
  description: string;
}

export interface LineOASettings {
  channelId: string;
  channelSecret: string;
  accessToken: string;
  isConnected: boolean;
  autoReply: boolean;
  orderNotification: boolean;
  promotionNotification: boolean;
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'order' | 'promotion' | 'daily_report';
  content: string;
  isActive: boolean;
}

export interface KPIData {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

export interface DailyReportData {
  date: Date;
  orderCount: number;
  totalRevenue: number;
  totalDiscount: number;
  netRevenue: number;
  stockSold: number;
  averageOrderValue: number;
  comparisonYesterday: {
    revenue: number;
    orders: number;
  };
}

export interface HourlySales {
  hour: string;
  sales: number;
  orders: number;
}

export interface CategorySales {
  name: string;
  value: number;
  percentage: number;
}

export interface PaymentMethodStats {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface TopProduct {
  name: string;
  quantity?: number;
  sales?: number;
  revenue: string | number;
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

export interface AuditLogEntry {
  id: number;
  userId?: number;
  username: string;
  action: string;
  detail?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface IncentiveSettings {
  isEnabled: boolean;
  dailyTarget: number;
  updatedAt: string;
}

export interface IncentiveHistory {
  id: number;
  date: string;
  target: number;
  itemsSold: number;
  achieved: boolean;
  submittedAt: string;
}

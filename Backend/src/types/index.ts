export interface Product {
  id: string;
  name: string;
  price: number;
  status: 'active' | 'inactive';
}

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  time: Date;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'completed' | 'cancelled';
  paymentMethod: string;
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

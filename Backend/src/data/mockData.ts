import type { Product, Order, Discount, DailyReportData, HourlySales, CategorySales, PaymentMethodStats, TopProduct, MessageTemplate } from '../types';

export const mockProducts: Product[] = [
  { id: '1', name: '杏仁餅乾', price: 45, status: 'active' },
  { id: '2', name: '巧克力泡芙', price: 65, status: 'active' },
  { id: '3', name: '草莓蛋糕', price: 75, status: 'active' },
  { id: '4', name: '焦糖布丁', price: 60, status: 'active' },
  { id: '5', name: '芒果慕斯', price: 80, status: 'active' },
  { id: '6', name: '芝士蛋糕', price: 80, status: 'active' },
  { id: '7', name: '法式馬卡龍', price: 45, status: 'active' },
  { id: '8', name: '藍莓司康', price: 55, status: 'active' },
  { id: '9', name: '抹茶紅豆瑪德蓮', price: 70, status: 'active' },
  { id: '10', name: '檸檬塔', price: 65, status: 'active' },
];

export const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: '#0127',
    time: new Date('2026-01-31T09:20:00'),
    items: [
      { name: '藍莓司康', price: 55, quantity: 3, subtotal: 165 },
      { name: '抹茶紅豆瑪德蓮', price: 70, quantity: 3, subtotal: 210 },
    ],
    subtotal: 440,
    discount: 66,
    total: 374,
    status: 'completed',
    paymentMethod: '現金',
  },
  {
    id: '2',
    orderNumber: '#0128',
    time: new Date('2026-01-31T10:45:00'),
    items: [
      { name: '芒果慕斯', price: 80, quantity: 2, subtotal: 160 },
      { name: '草莓蛋糕', price: 75, quantity: 3, subtotal: 225 },
    ],
    subtotal: 610,
    discount: 0,
    total: 610,
    status: 'completed',
    paymentMethod: '信用卡',
  },
  {
    id: '3',
    orderNumber: '#0129',
    time: new Date('2026-01-31T11:30:00'),
    items: [
      { name: '巧克力泡芙', price: 65, quantity: 5, subtotal: 325 },
      { name: '芝士蛋糕', price: 80, quantity: 2, subtotal: 160 },
    ],
    subtotal: 485,
    discount: 48,
    total: 437,
    status: 'completed',
    paymentMethod: '現金',
  },
  {
    id: '4',
    orderNumber: '#0130',
    time: new Date('2026-01-31T12:15:00'),
    items: [
      { name: '杏仁餅乾', price: 45, quantity: 4, subtotal: 180 },
      { name: '法式馬卡龍', price: 45, quantity: 2, subtotal: 90 },
    ],
    subtotal: 270,
    discount: 0,
    total: 270,
    status: 'completed',
    paymentMethod: 'LINE Pay',
  },
  {
    id: '5',
    orderNumber: '#0131',
    time: new Date('2026-01-31T13:20:00'),
    items: [
      { name: '焦糖布丁', price: 60, quantity: 3, subtotal: 180 },
      { name: '檸檬塔', price: 65, quantity: 2, subtotal: 130 },
    ],
    subtotal: 310,
    discount: 31,
    total: 279,
    status: 'completed',
    paymentMethod: '現金',
  },
  {
    id: '6',
    orderNumber: '#0132',
    time: new Date('2026-01-31T14:00:00'),
    items: [
      { name: '草莓蛋糕', price: 75, quantity: 1, subtotal: 75 },
    ],
    subtotal: 75,
    discount: 0,
    total: 75,
    status: 'cancelled',
    paymentMethod: '現金',
  },
];

export const mockDiscounts: Discount[] = [
  {
    id: '1',
    name: '9折優惠',
    type: 'percentage',
    value: 10,
    minPurchase: 0,
    isActive: true,
    description: '全場9折優惠',
  },
  {
    id: '2',
    name: '85折優惠',
    type: 'percentage',
    value: 15,
    minPurchase: 0,
    isActive: true,
    description: '全場85折優惠',
  },
  {
    id: '3',
    name: '8折優惠',
    type: 'percentage',
    value: 20,
    minPurchase: 0,
    isActive: true,
    description: '全場8折優惠',
  },
  {
    id: '4',
    name: '75折優惠',
    type: 'percentage',
    value: 25,
    minPurchase: 0,
    isActive: true,
    description: '全場75折優惠',
  },
  {
    id: '5',
    name: '滿500折50',
    type: 'amount',
    value: 50,
    minPurchase: 500,
    isActive: true,
    description: '消費滿NT$500折NT$50',
  },
  {
    id: '6',
    name: '滿1000折150',
    type: 'amount',
    value: 150,
    minPurchase: 1000,
    isActive: true,
    description: '消費滿NT$1,000折NT$150',
  },
  {
    id: '7',
    name: '買5送1',
    type: 'gift',
    value: 1,
    minPurchase: 5,
    isActive: false,
    description: '購買5件商品贈送1件',
  },
];

export function generateDashboardKPI() {
  return [
    {
      title: '今日營業額',
      value: 'NT$ 45,320',
      change: '+12.5%',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '今日訂單',
      value: '156',
      change: '+8.2%',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: '商品數量',
      value: '125',
      change: '+5',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: '平均客單價',
      value: 'NT$ 290',
      change: '+3.8%',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];
}

export const salesData = [
  { date: '1/25', sales: 32000, orders: 120 },
  { date: '1/26', sales: 38000, orders: 145 },
  { date: '1/27', sales: 41000, orders: 152 },
  { date: '1/28', sales: 35000, orders: 128 },
  { date: '1/29', sales: 42000, orders: 158 },
  { date: '1/30', sales: 48000, orders: 172 },
  { date: '1/31', sales: 45320, orders: 156 },
];

export const dashboardTopProducts: TopProduct[] = [
  { name: '抹茶紅豆瑪德蓮', sales: 245, revenue: 'NT$ 17,150' },
  { name: '巧克力泡芙', sales: 198, revenue: 'NT$ 12,870' },
  { name: '草莓蛋糕', sales: 176, revenue: 'NT$ 13,200' },
  { name: '芝士蛋糕', sales: 165, revenue: 'NT$ 13,200' },
  { name: '焦糖布丁', sales: 142, revenue: 'NT$ 8,520' },
];

export const dailyReportData: DailyReportData = {
  date: new Date('2026-01-31'),
  orderCount: 156,
  totalRevenue: 45320,
  totalDiscount: 5160,
  netRevenue: 40160,
  stockSold: 587,
  averageOrderValue: 290,
  comparisonYesterday: {
    revenue: 12.5,
    orders: 8.2,
  },
};

export const hourlySales: HourlySales[] = [
  { hour: '09:00', sales: 2400, orders: 8 },
  { hour: '10:00', sales: 3800, orders: 12 },
  { hour: '11:00', sales: 4200, orders: 15 },
  { hour: '12:00', sales: 5800, orders: 22 },
  { hour: '13:00', sales: 6200, orders: 24 },
  { hour: '14:00', sales: 5400, orders: 19 },
  { hour: '15:00', sales: 4800, orders: 18 },
  { hour: '16:00', sales: 4200, orders: 16 },
  { hour: '17:00', sales: 5200, orders: 20 },
  { hour: '18:00', sales: 3320, orders: 12 },
];

export const categorySales: CategorySales[] = [
  { name: '蛋糕', value: 15800, percentage: 35 },
  { name: '泡芙', value: 12650, percentage: 28 },
  { name: '餅乾', value: 9060, percentage: 20 },
  { name: '布丁', value: 5430, percentage: 12 },
  { name: '其他', value: 2260, percentage: 5 },
];

export const paymentMethodStats: PaymentMethodStats[] = [
  { method: '現金', count: 85, amount: 24650, percentage: 54.5 },
  { method: '信用卡', count: 45, amount: 13590, percentage: 30.0 },
  { method: 'LINE Pay', count: 26, amount: 7080, percentage: 15.6 },
];

export const reportTopProducts: TopProduct[] = [
  { name: '抹茶紅豆瑪德蓮', quantity: 45, revenue: 3150 },
  { name: '巧克力泡芙', quantity: 38, revenue: 2470 },
  { name: '草莓蛋糕', quantity: 35, revenue: 2625 },
  { name: '芝士蛋糕', quantity: 32, revenue: 2560 },
  { name: '焦糖布丁', quantity: 28, revenue: 1680 },
];

export const messageTemplates: MessageTemplate[] = [
  {
    id: '1',
    name: '訂單確認通知',
    type: 'order',
    content: '您的訂單 {order_number} 已確認！\n總金額：NT$ {total}\n預計完成時間：{estimated_time}',
    isActive: true,
  },
  {
    id: '2',
    name: '每日營業報表',
    type: 'daily_report',
    content: '【日結報表】\n日期：{date}\n訂單數：{order_count}\n營業額：NT$ {revenue}\n實收金額：NT$ {net_revenue}',
    isActive: true,
  },
  {
    id: '3',
    name: '促銷活動通知',
    type: 'promotion',
    content: '🎉 限時優惠活動！\n{promotion_title}\n{promotion_description}\n活動期間：{start_date} - {end_date}',
    isActive: false,
  },
];


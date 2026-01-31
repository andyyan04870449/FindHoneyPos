import { useState } from 'react';
import { Calendar, Download, Printer, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { toast } from 'sonner';

// 日報表數據
const dailyReportData = {
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

// 小時銷售數據
const hourlySales = [
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

// 分類銷售數據
const categorySales = [
  { name: '蛋糕', value: 15800, percentage: 35 },
  { name: '泡芙', value: 12650, percentage: 28 },
  { name: '餅乾', value: 9060, percentage: 20 },
  { name: '布丁', value: 5430, percentage: 12 },
  { name: '其他', value: 2260, percentage: 5 },
];

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];

// 付款方式統計
const paymentMethods = [
  { method: '現金', count: 85, amount: 24650, percentage: 54.5 },
  { method: '信用卡', count: 45, amount: 13590, percentage: 30.0 },
  { method: 'LINE Pay', count: 26, amount: 7080, percentage: 15.6 },
];

// 熱銷商品
const topProducts = [
  { name: '抹茶紅豆瑪德蓮', quantity: 45, revenue: 3150 },
  { name: '巧克力泡芙', quantity: 38, revenue: 2470 },
  { name: '草莓蛋糕', quantity: 35, revenue: 2625 },
  { name: '芝士蛋糕', quantity: 32, revenue: 2560 },
  { name: '焦糖布丁', quantity: 28, revenue: 1680 },
];

export function DailyReport() {
  const [selectedDate, setSelectedDate] = useState('today');

  const handleExport = () => {
    toast.success('報表匯出成功');
  };

  const handlePrint = () => {
    window.print();
    toast.success('準備列印報表');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">日結報表</h2>
          <p className="text-gray-600 mt-1">
            {format(dailyReportData.date, 'yyyy年M月d日')} 星期{format(dailyReportData.date, 'EEEE')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">今天</SelectItem>
              <SelectItem value="yesterday">昨天</SelectItem>
              <SelectItem value="week">本週</SelectItem>
              <SelectItem value="month">本月</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            列印
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            <Download className="h-4 w-4 mr-2" />
            匯出
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">訂單總數</p>
              <p className="text-3xl font-bold mt-2">{dailyReportData.orderCount}</p>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>+{dailyReportData.comparisonYesterday.orders}%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">總營業額</p>
              <p className="text-3xl font-bold mt-2 text-orange-600">
                NT$ {dailyReportData.totalRevenue.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>+{dailyReportData.comparisonYesterday.revenue}%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <p className="text-sm text-gray-600">折扣優惠</p>
            <p className="text-3xl font-bold mt-2 text-red-600">
              -NT$ {dailyReportData.totalDiscount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              佔營業額 {((dailyReportData.totalDiscount / dailyReportData.totalRevenue) * 100).toFixed(1)}%
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <p className="text-sm text-gray-600">平均客單價</p>
            <p className="text-3xl font-bold mt-2">
              NT$ {dailyReportData.averageOrderValue}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              已售商品數：{dailyReportData.stockSold}
            </p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Hourly Sales */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">每小時營業額</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#f97316" name="營業額 (NT$)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Category Sales */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">分類銷售佔比</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categorySales}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categorySales.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">付款方式統計</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  付款方式
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  筆數
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  金額
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  佔比
                </th>
              </tr>
            </thead>
            <tbody>
              {paymentMethods.map((payment) => (
                <tr key={payment.method} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{payment.method}</td>
                  <td className="py-3 px-4 text-right">{payment.count}</td>
                  <td className="py-3 px-4 text-right font-semibold">
                    NT$ {payment.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Badge variant="secondary">{payment.percentage}%</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top Products */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">今日熱銷商品 Top 5</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  排名
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  商品名稱
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  銷售數量
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  營業額
                </th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={product.name} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold">
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium">{product.name}</td>
                  <td className="py-3 px-4 text-right">{product.quantity}</td>
                  <td className="py-3 px-4 text-right font-semibold text-orange-600">
                    NT$ {product.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-6 bg-orange-50 border-orange-200">
        <h3 className="text-lg font-semibold mb-4">日結匯總</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">營業額小計</span>
            <span className="font-semibold">
              NT$ {dailyReportData.totalRevenue.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-red-600">
            <span>優惠折扣</span>
            <span className="font-semibold">
              -NT$ {dailyReportData.totalDiscount.toLocaleString()}
            </span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">實收現金</span>
              <span className="text-2xl font-bold text-orange-600">
                NT$ {dailyReportData.netRevenue.toLocaleString()}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            請核對實際收到的現金金額，並確認提交日結報表
          </p>
        </div>
      </Card>
    </div>
  );
}

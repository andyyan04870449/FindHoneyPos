import { useState, useEffect } from 'react';
import { Download, Printer, TrendingUp, Loader2 } from 'lucide-react';
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PIE_CHART_COLORS } from '@/constants';
import type { DailyReportData, HourlySales, CategorySales, PaymentMethodStats, TopProduct } from '@/types';

export function DailyReport() {
  const [selectedDate, setSelectedDate] = useState('today');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<DailyReportData | null>(null);
  const [hourlySales, setHourlySales] = useState<HourlySales[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [paymentMethodStats, setPaymentMethodStats] = useState<PaymentMethodStats[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const dateParam = `?date=${selectedDate}`;
        const [daily, hourly, category, payment, top] = await Promise.all([
          api<DailyReportData>(`/api/admin/reports/daily${dateParam}`),
          api<HourlySales[]>(`/api/admin/reports/hourly-sales${dateParam}`),
          api<CategorySales[]>(`/api/admin/reports/category-sales${dateParam}`),
          api<PaymentMethodStats[]>(`/api/admin/reports/payment-methods${dateParam}`),
          api<TopProduct[]>(`/api/admin/reports/top-products${dateParam}`),
        ]);
        setReportData({ ...daily, date: new Date(daily.date) });
        setHourlySales(hourly);
        setCategorySales(category);
        setPaymentMethodStats(payment);
        setTopProducts(top);
      } catch (err) {
        console.error('Failed to fetch report data:', err);
        toast.error('載入報表失敗');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedDate]);

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/admin/reports/export?date=${selectedDate}&format=csv`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${selectedDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('報表匯出成功');
    } catch (err) {
      console.error('Failed to export report:', err);
      toast.error('匯出報表失敗');
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success('準備列印報表');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">無法載入報表資料，請確認 API 服務是否啟動</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">日結報表</h2>
          <p className="text-gray-600 mt-1">
            {format(reportData.date, 'yyyy年M月d日')} 星期{format(reportData.date, 'EEEE')}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">訂單總數</p>
              <p className="text-3xl font-bold mt-2">{reportData.orderCount}</p>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>+{reportData.comparisonYesterday.orders}%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">總營業額</p>
              <p className="text-3xl font-bold mt-2 text-orange-600">
                NT$ {reportData.totalRevenue.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>+{reportData.comparisonYesterday.revenue}%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <p className="text-sm text-gray-600">折扣優惠</p>
            <p className="text-3xl font-bold mt-2 text-red-600">
              -NT$ {reportData.totalDiscount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              佔營業額 {((reportData.totalDiscount / reportData.totalRevenue) * 100).toFixed(1)}%
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <p className="text-sm text-gray-600">平均客單價</p>
            <p className="text-3xl font-bold mt-2">
              NT$ {reportData.averageOrderValue}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              已售商品數：{reportData.stockSold}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                {categorySales.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">付款方式統計</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">付款方式</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">筆數</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">金額</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">佔比</th>
              </tr>
            </thead>
            <tbody>
              {paymentMethodStats.map((payment) => (
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

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">今日熱銷商品 Top 5</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">排名</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">商品名稱</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">銷售數量</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">營業額</th>
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
                    NT$ {typeof product.revenue === 'number' ? product.revenue.toLocaleString() : product.revenue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6 bg-orange-50 border-orange-200">
        <h3 className="text-lg font-semibold mb-4">日結匯總</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">營業額小計</span>
            <span className="font-semibold">
              NT$ {reportData.totalRevenue.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-red-600">
            <span>優惠折扣</span>
            <span className="font-semibold">
              -NT$ {reportData.totalDiscount.toLocaleString()}
            </span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">實收現金</span>
              <span className="text-2xl font-bold text-orange-600">
                NT$ {reportData.netRevenue.toLocaleString()}
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

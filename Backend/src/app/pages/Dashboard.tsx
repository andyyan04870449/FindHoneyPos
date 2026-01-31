import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart, DollarSign, Package, Loader2, Plus, BarChart3, Percent } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/lib/api';
import type { TopProduct } from '@/types';

interface KPIItem {
  title: string;
  value: string;
  change: string;
  color: string;
  bgColor: string;
}

interface SalesTrendItem {
  date: string;
  sales: number;
  orders: number;
}

interface AddonTrendItem {
  date: string;
  revenue: number;
  count: number;
}

interface TopAddon {
  name: string;
  quantity: number;
  revenue: number;
}

interface AddonCombination {
  product: string;
  addon: string;
  count: number;
  revenue: number;
}

const kpiIcons = [DollarSign, ShoppingCart, Package, TrendingUp];
const addonKpiIcons = [DollarSign, Plus, Percent];

export function Dashboard() {
  const [kpiData, setKpiData] = useState<KPIItem[]>([]);
  const [salesData, setSalesData] = useState<SalesTrendItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [addonKpiData, setAddonKpiData] = useState<KPIItem[]>([]);
  const [addonTrendData, setAddonTrendData] = useState<AddonTrendItem[]>([]);
  const [topAddons, setTopAddons] = useState<TopAddon[]>([]);
  const [addonCombinations, setAddonCombinations] = useState<AddonCombination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [kpi, trend, top] = await Promise.all([
          api<KPIItem[]>('/api/admin/dashboard/kpi'),
          api<SalesTrendItem[]>('/api/admin/dashboard/sales-trend?days=7'),
          api<TopProduct[]>('/api/admin/dashboard/top-products?limit=5'),
        ]);
        setKpiData(kpi);
        setSalesData(trend);
        setTopProducts(top);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }
      try {
        const [addonKpi, addonTrend, addons, combos] = await Promise.all([
          api<KPIItem[]>('/api/admin/dashboard/addon-kpi'),
          api<AddonTrendItem[]>('/api/admin/reports/addon-trend?days=7'),
          api<TopAddon[]>('/api/admin/reports/top-addons'),
          api<AddonCombination[]>('/api/admin/reports/addon-combinations'),
        ]);
        console.log('[Addon] kpi:', addonKpi, 'trend:', addonTrend, 'top:', addons, 'combos:', combos);
        setAddonKpiData(addonKpi);
        setAddonTrendData(addonTrend);
        setTopAddons(addons);
        setAddonCombinations(combos);
      } catch (err) {
        console.error('Failed to fetch addon data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const statsData = kpiData.map((item, index) => ({
    ...item,
    icon: kpiIcons[index],
  }));

  const addonStatsData = addonKpiData.map((item, index) => ({
    ...item,
    icon: addonKpiIcons[index],
  }));

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                <p className="mt-2 text-sm text-green-600">{stat.change}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">近7日營業額趨勢</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#f97316"
                strokeWidth={2}
                name="營業額 (NT$)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">近7日訂單數量</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#f97316" name="訂單數" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">熱銷商品排行</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
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
                  <td className="py-3 px-4 text-right">{product.sales}</td>
                  <td className="py-3 px-4 text-right font-semibold text-orange-600">{product.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Addon Section Divider */}
      <div className="border-t pt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">加料分析</h2>
      </div>

      {/* Addon KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {addonStatsData.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                <p className="mt-2 text-sm text-green-600">{stat.change}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Addon Trend Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">近7日加料營收趨勢</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={addonTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="#8b5cf6" name="加料營收 (NT$)" />
            <Line yAxisId="right" type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} name="加料次數" />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Addons & Addon Combinations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Addons */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">熱門加料排行</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">排名</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">加料名稱</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">數量</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">營收</th>
                </tr>
              </thead>
              <tbody>
                {topAddons.map((addon, index) => (
                  <tr key={addon.name} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold">
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{addon.name}</td>
                    <td className="py-3 px-4 text-right">{addon.quantity}</td>
                    <td className="py-3 px-4 text-right font-semibold text-purple-600">NT$ {addon.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Addon Product Combinations */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">加料 × 商品組合排行</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">排名</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">商品</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">加料</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">次數</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">營收</th>
                </tr>
              </thead>
              <tbody>
                {addonCombinations.slice(0, 10).map((combo, index) => (
                  <tr key={`${combo.product}-${combo.addon}`} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold">
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{combo.product}</td>
                    <td className="py-3 px-4">{combo.addon}</td>
                    <td className="py-3 px-4 text-right">{combo.count}</td>
                    <td className="py-3 px-4 text-right font-semibold text-purple-600">NT$ {combo.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

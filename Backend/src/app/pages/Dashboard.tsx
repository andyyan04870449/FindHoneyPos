import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart, DollarSign, Package, Loader2, Plus, Percent, Users, BarChart3 } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
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

interface TagStat {
  tag: string;
  orders: number;
  revenue: number;
  percentage?: number;
}

interface CustomerTagKpi {
  gender: TagStat[];
  age: TagStat[];
}

const kpiIcons = [DollarSign, ShoppingCart, Package, TrendingUp];
const addonKpiIcons = [DollarSign, Plus, Percent];
const GENDER_COLORS = ['#3b82f6', '#ec4899', '#9ca3af'];
const AGE_COLORS = ['#f97316', '#8b5cf6', '#9ca3af'];

export function Dashboard() {
  const [kpiData, setKpiData] = useState<KPIItem[]>([]);
  const [salesData, setSalesData] = useState<SalesTrendItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [addonKpiData, setAddonKpiData] = useState<KPIItem[]>([]);
  const [addonTrendData, setAddonTrendData] = useState<AddonTrendItem[]>([]);
  const [topAddons, setTopAddons] = useState<TopAddon[]>([]);
  const [addonCombinations, setAddonCombinations] = useState<AddonCombination[]>([]);
  const [customerTagKpi, setCustomerTagKpi] = useState<CustomerTagKpi | null>(null);
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
        setAddonKpiData(addonKpi);
        setAddonTrendData(addonTrend);
        setTopAddons(addons);
        setAddonCombinations(combos);
      } catch (err) {
        console.error('Failed to fetch addon data:', err);
      }
      try {
        const tagKpi = await api<CustomerTagKpi>('/api/admin/dashboard/customer-tag-kpi');
        setCustomerTagKpi(tagKpi);
      } catch (err) {
        console.error('Failed to fetch customer tag data:', err);
      }
      setLoading(false);
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
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="w-full">
        <TabsTrigger value="overview">
          <BarChart3 className="h-4 w-4 mr-1" />
          營業總覽
        </TabsTrigger>
        <TabsTrigger value="addon">
          <Plus className="h-4 w-4 mr-1" />
          加料分析
        </TabsTrigger>
        <TabsTrigger value="customer">
          <Users className="h-4 w-4 mr-1" />
          客群分析
        </TabsTrigger>
      </TabsList>

      {/* ===== 營業總覽 ===== */}
      <TabsContent value="overview" className="space-y-6">
        {/* KPI Cards */}
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
                <Line type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={2} name="營業額 (NT$)" />
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
      </TabsContent>

      {/* ===== 加料分析 ===== */}
      <TabsContent value="addon" className="space-y-6">
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
      </TabsContent>

      {/* ===== 客群分析 ===== */}
      <TabsContent value="customer" className="space-y-6">
        {customerTagKpi ? (
          <>
            {/* Gender & Age Pie Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">性別分布</h3>
                <div className="flex items-center">
                  <ResponsiveContainer width="50%" height={250}>
                    <PieChart>
                      <Pie
                        data={customerTagKpi.gender}
                        dataKey="orders"
                        nameKey="tag"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ tag, percent }) => `${tag} ${(percent * 100).toFixed(0)}%`}
                      >
                        {customerTagKpi.gender.map((_, i) => (
                          <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value} 筆`, '訂單數']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-3">
                    {customerTagKpi.gender.map((item, i) => {
                      const total = customerTagKpi.gender.reduce((s, g) => s + g.orders, 0);
                      const pct = total > 0 ? ((item.orders / total) * 100).toFixed(1) : '0';
                      return (
                        <div key={item.tag} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: GENDER_COLORS[i % GENDER_COLORS.length] }} />
                            <span className="text-sm font-medium">{item.tag}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold">{item.orders} 筆</span>
                            <span className="text-xs text-gray-500 ml-2">({pct}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">年齡層分布</h3>
                <div className="flex items-center">
                  <ResponsiveContainer width="50%" height={250}>
                    <PieChart>
                      <Pie
                        data={customerTagKpi.age}
                        dataKey="orders"
                        nameKey="tag"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ tag, percent }) => `${tag} ${(percent * 100).toFixed(0)}%`}
                      >
                        {customerTagKpi.age.map((_, i) => (
                          <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value} 筆`, '訂單數']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-3">
                    {customerTagKpi.age.map((item, i) => {
                      const total = customerTagKpi.age.reduce((s, a) => s + a.orders, 0);
                      const pct = total > 0 ? ((item.orders / total) * 100).toFixed(1) : '0';
                      return (
                        <div key={item.tag} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: AGE_COLORS[i % AGE_COLORS.length] }} />
                            <span className="text-sm font-medium">{item.tag}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold">{item.orders} 筆</span>
                            <span className="text-xs text-gray-500 ml-2">({pct}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>

            {/* Revenue Bar Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">性別營收比較</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={customerTagKpi.gender}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tag" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`NT$ ${value.toLocaleString()}`, '營收']} />
                    <Bar dataKey="revenue" name="營收 (NT$)">
                      {customerTagKpi.gender.map((_, i) => (
                        <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">年齡層營收比較</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={customerTagKpi.age}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tag" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`NT$ ${value.toLocaleString()}`, '營收']} />
                    <Bar dataKey="revenue" name="營收 (NT$)">
                      {customerTagKpi.age.map((_, i) => (
                        <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Detail Tables */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">性別明細</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">標籤</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">訂單數</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">營收</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">占比</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerTagKpi.gender.map((item, i) => {
                      const total = customerTagKpi.gender.reduce((s, g) => s + g.orders, 0);
                      const pct = total > 0 ? ((item.orders / total) * 100).toFixed(1) : '0';
                      return (
                        <tr key={item.tag} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: GENDER_COLORS[i % GENDER_COLORS.length] }} />
                              <span className="font-medium">{item.tag}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">{item.orders}</td>
                          <td className="py-3 px-4 text-right font-semibold text-blue-600">NT$ {item.revenue.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-gray-500">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">年齡層明細</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">標籤</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">訂單數</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">營收</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">占比</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerTagKpi.age.map((item, i) => {
                      const total = customerTagKpi.age.reduce((s, a) => s + a.orders, 0);
                      const pct = total > 0 ? ((item.orders / total) * 100).toFixed(1) : '0';
                      return (
                        <tr key={item.tag} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: AGE_COLORS[i % AGE_COLORS.length] }} />
                              <span className="font-medium">{item.tag}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">{item.orders}</td>
                          <td className="py-3 px-4 text-right font-semibold text-orange-600">NT$ {item.revenue.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-gray-500">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </div>
          </>
        ) : (
          <Card className="p-12 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">尚無客群資料</p>
            <p className="text-sm mt-1">結帳時標記客群後即可在此檢視分析</p>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}

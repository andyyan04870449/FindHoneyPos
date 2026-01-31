import { TrendingUp, ShoppingCart, DollarSign, Package } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// 模擬數據
const statsData = [
  {
    title: '今日營業額',
    value: 'NT$ 45,320',
    change: '+12.5%',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    title: '今日訂單',
    value: '156',
    change: '+8.2%',
    icon: ShoppingCart,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: '商品數量',
    value: '125',
    change: '+5',
    icon: Package,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    title: '平均客單價',
    value: 'NT$ 290',
    change: '+3.8%',
    icon: TrendingUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
];

const salesData = [
  { date: '1/25', sales: 32000, orders: 120 },
  { date: '1/26', sales: 38000, orders: 145 },
  { date: '1/27', sales: 41000, orders: 152 },
  { date: '1/28', sales: 35000, orders: 128 },
  { date: '1/29', sales: 42000, orders: 158 },
  { date: '1/30', sales: 48000, orders: 172 },
  { date: '1/31', sales: 45320, orders: 156 },
];

const topProducts = [
  { name: '抹茶紅豆瑪德蓮', sales: 245, revenue: 'NT$ 17,150' },
  { name: '巧克力泡芙', sales: 198, revenue: 'NT$ 12,870' },
  { name: '草莓蛋糕', sales: 176, revenue: 'NT$ 13,200' },
  { name: '芝士蛋糕', sales: 165, revenue: 'NT$ 13,200' },
  { name: '焦糖布丁', sales: 142, revenue: 'NT$ 8,520' },
];

export function Dashboard() {
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
        {/* Sales Chart */}
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

        {/* Orders Chart */}
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
                  <td className="py-3 px-4 text-right">{product.sales}</td>
                  <td className="py-3 px-4 text-right font-semibold text-orange-600">
                    {product.revenue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

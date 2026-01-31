import { useState } from 'react';
import { Eye, Calendar, Filter } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { format } from 'date-fns';

// 訂單數據類型
interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
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

// 模擬訂單數據
const mockOrders: Order[] = [
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

export function OrderManagement() {
  const [orders] = useState<Order[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  // 統計數據
  const stats = {
    total: orders.length,
    completed: orders.filter((o) => o.status === 'completed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
    totalRevenue: orders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">訂單管理</h2>
        <p className="text-gray-600 mt-1">查看和管理所有訂單記錄</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">總訂單數</p>
          <p className="text-2xl font-bold mt-2">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">已完成</p>
          <p className="text-2xl font-bold mt-2 text-green-600">{stats.completed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">已取消</p>
          <p className="text-2xl font-bold mt-2 text-red-600">{stats.cancelled}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">總營業額</p>
          <p className="text-2xl font-bold mt-2 text-orange-600">
            NT$ {stats.totalRevenue.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">篩選：</span>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="訂單狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部訂單</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  訂單編號
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  時間
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  品項
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  小計
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  折扣
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  實收
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  付款方式
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  狀態
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {format(order.time, 'HH:mm')}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {order.items
                      .map((item) => `${item.name} x${item.quantity}`)
                      .join(', ')
                      .slice(0, 30)}
                    {order.items.length > 1 && '...'}
                  </td>
                  <td className="py-3 px-4 text-right">NT$ {order.subtotal}</td>
                  <td className="py-3 px-4 text-right text-red-600">
                    {order.discount > 0 ? `-NT$ ${order.discount}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">
                    NT$ {order.total}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="secondary">{order.paymentMethod}</Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge
                      variant={order.status === 'completed' ? 'default' : 'secondary'}
                      className={
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }
                    >
                      {order.status === 'completed' ? '已完成' : '已取消'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetail(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">沒有符合條件的訂單</p>
          </div>
        )}
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>訂單詳情 {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">訂單時間</p>
                  <p className="font-medium">
                    {format(selectedOrder.time, 'yyyy/MM/dd HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">付款方式</p>
                  <p className="font-medium">{selectedOrder.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">訂單狀態</p>
                  <Badge
                    variant={
                      selectedOrder.status === 'completed' ? 'default' : 'secondary'
                    }
                    className={
                      selectedOrder.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }
                  >
                    {selectedOrder.status === 'completed' ? '已完成' : '已取消'}
                  </Badge>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold mb-3">訂單明細</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          NT$ {item.price} x {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">NT$ {item.subtotal}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">共 {selectedOrder.items.length} 項商品</span>
                  <span></span>
                </div>
                <div className="flex justify-between">
                  <span>小計</span>
                  <span>NT$ {selectedOrder.subtotal}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>優惠折扣</span>
                    <span>- NT$ {selectedOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>實付金額</span>
                  <span className="text-orange-600">NT$ {selectedOrder.total}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Eye, Filter, Loader2 } from 'lucide-react';
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
import { toast } from 'sonner';
import type { Order } from '@/types';
import { api } from '@/lib/api';

interface OrderStats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({ totalOrders: 0, completedOrders: 0, cancelledOrders: 0, totalRevenue: 0 });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const data = await api<Order[]>(`/api/admin/orders${params}`);
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      toast.error('載入訂單失敗');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api<OrderStats>('/api/admin/orders/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch order stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">訂單管理</h2>
        <p className="text-gray-600 mt-1">查看和管理所有訂單記錄</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">總訂單數</p>
          <p className="text-2xl font-bold mt-2">{stats.totalOrders}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">已完成</p>
          <p className="text-2xl font-bold mt-2 text-green-600">{stats.completedOrders}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">已取消</p>
          <p className="text-2xl font-bold mt-2 text-red-600">{stats.cancelledOrders}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">總營業額</p>
          <p className="text-2xl font-bold mt-2 text-orange-600">
            NT$ {stats.totalRevenue.toLocaleString()}
          </p>
        </Card>
      </div>

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

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">訂單編號</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">時間</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">品項</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">小計</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">折扣</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">實收</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">付款方式</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">狀態</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {format(new Date(order.timestamp), 'HH:mm')}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="space-y-0.5">
                      {order.items.map((item, idx) => (
                        <div key={idx}>
                          <span>{item.name}</span>
                          {item.addons?.length > 0 && (
                            <span className="text-xs text-orange-600">
                              {' '}
                              {item.addons.map((a) => `+${a.name}`).join(' ')}
                            </span>
                          )}
                          <span className="text-gray-500"> x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">NT$ {order.subtotal}</td>
                  <td className="py-3 px-4 text-right text-red-600">
                    {order.discountAmount > 0 ? `-NT$ ${order.discountAmount}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">NT$ {order.total}</td>
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
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetail(order)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">沒有符合條件的訂單</p>
          </div>
        )}
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>訂單詳情 {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">訂單時間</p>
                  <p className="font-medium">{format(new Date(selectedOrder.timestamp), 'yyyy/MM/dd HH:mm')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">付款方式</p>
                  <p className="font-medium">{selectedOrder.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">訂單狀態</p>
                  <Badge
                    variant={selectedOrder.status === 'completed' ? 'default' : 'secondary'}
                    className={
                      selectedOrder.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }
                  >
                    {selectedOrder.status === 'completed' ? '已完成' : '已取消'}
                  </Badge>
                </div>
                {selectedOrder.customerTag && (
                  <div>
                    <p className="text-sm text-gray-600">客戶標籤</p>
                    <Badge variant="secondary">{selectedOrder.customerTag}</Badge>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-3">訂單明細</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className={`p-3 rounded-lg ${item.isGift ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.name}</p>
                          {item.isGift && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">招待</Badge>
                          )}
                          {item.itemDiscountLabel && !item.isGift && (
                            <Badge className="bg-red-100 text-red-700 text-xs">{item.itemDiscountLabel}</Badge>
                          )}
                        </div>
                        <p className="font-semibold">NT$ {item.subtotal}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {item.originalPrice != null && item.originalPrice !== item.price ? (
                          <>
                            <span className="line-through text-gray-400">NT$ {item.originalPrice}</span>
                            <span className="text-red-600">NT$ {item.price}</span>
                            <span>x {item.quantity}</span>
                          </>
                        ) : (
                          <span>NT$ {item.price} x {item.quantity}</span>
                        )}
                      </div>
                      {item.addons?.length > 0 && (
                        <p className="text-xs text-orange-600 mt-1">
                          {item.addons.map((a) => `+ ${a.name} NT$${a.price}`).join(' / ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">共 {selectedOrder.items.length} 項商品</span>
                  <span></span>
                </div>
                <div className="flex justify-between">
                  <span>小計</span>
                  <span>NT$ {selectedOrder.subtotal}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>
                      折扣
                      {selectedOrder.discountType === 'percentage' && selectedOrder.discountValue != null && (
                        <span className="text-xs text-gray-500 ml-1">（{selectedOrder.discountValue / 10}折）</span>
                      )}
                      {selectedOrder.discountType === 'amount' && selectedOrder.discountValue != null && (
                        <span className="text-xs text-gray-500 ml-1">（折讓 NT${selectedOrder.discountValue}）</span>
                      )}
                      {selectedOrder.discountType === 'gift' && (
                        <span className="text-xs text-gray-500 ml-1">（招待）</span>
                      )}
                    </span>
                    <span>-NT$ {selectedOrder.discountAmount}</span>
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

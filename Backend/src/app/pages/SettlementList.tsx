import { useState, useEffect, useCallback } from 'react';
import { Loader2, Eye, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { toast } from 'sonner';
import type { SettlementRecord, SettlementDetail } from '@/types';

const PAGE_SIZE = 20;

interface PagedResponse {
  success: boolean;
  data: SettlementRecord[];
  total: number;
  page: number;
  pageSize: number;
}

interface DetailResponse {
  success: boolean;
  data: SettlementDetail;
}

export function SettlementList() {
  const [records, setRecords] = useState<SettlementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<SettlementDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), pageSize: PAGE_SIZE.toString() });
      const res = await fetch(`/api/admin/settlements?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const json: PagedResponse = await res.json();
      setRecords(json.data);
      setTotal(json.total);
    } catch {
      toast.error('載入日結紀錄失敗');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleViewDetail = async (id: number) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = await fetch(`/api/admin/settlements/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const json: DetailResponse = await res.json();
      setDetail(json.data);
    } catch {
      toast.error('載入明細失敗');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-TW');
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-TW');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">日結紀錄</h2>
        <p className="text-gray-600 mt-1">查看每日結帳紀錄與庫存盤點</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead className="text-right">訂單數</TableHead>
                  <TableHead className="text-right">營業額</TableHead>
                  <TableHead className="text-right">折扣</TableHead>
                  <TableHead className="text-right">實收</TableHead>
                  <TableHead className="text-center">激勵達標</TableHead>
                  <TableHead className="text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      沒有日結紀錄
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                      <TableCell className="text-right">{record.totalOrders}</TableCell>
                      <TableCell className="text-right">NT$ {record.totalRevenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-red-500">-NT$ {record.totalDiscount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold text-orange-600">NT$ {record.netRevenue.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        {record.incentiveAchieved ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(record.id)}>
                          <Eye className="h-4 w-4 mr-1" />
                          查看明細
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                共 {total} 筆，第 {page} / {totalPages} 頁
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  上一頁
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  下一頁
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>日結明細</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
          {detailLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : detail ? (
            <div className="space-y-6">
              {/* Summary */}

              <div className="bg-orange-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">日期</span>
                  <span className="font-medium">{formatDate(detail.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">提交時間</span>
                  <span className="font-medium">{formatDateTime(detail.submittedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">訂單數</span>
                  <span className="font-medium">{detail.totalOrders} 筆</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">營業額</span>
                  <span className="font-medium">NT$ {detail.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">折扣金額</span>
                  <span className="font-medium text-red-500">-NT$ {detail.totalDiscount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 font-semibold">實收金額</span>
                  <span className="font-bold text-orange-600">NT$ {detail.netRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">激勵目標</span>
                  <span className="font-medium">{detail.incentiveTarget} 隻</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">實際銷售</span>
                  <span className="font-medium">{detail.incentiveItemsSold} 隻</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">達標狀態</span>
                  <span className={`font-medium ${detail.incentiveAchieved ? 'text-green-600' : 'text-gray-400'}`}>
                    {detail.incentiveAchieved ? '已達標' : '未達標'}
                  </span>
                </div>
              </div>

              {/* Inventory Counts */}
              {detail.inventoryCounts.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">庫存盤點</h4>
                  <div className="bg-white rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>商品名稱</TableHead>
                          <TableHead className="text-right">售出數量</TableHead>
                          <TableHead className="text-right">盤點剩餘</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.inventoryCounts.map((item) => (
                          <TableRow key={item.productId}>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell className="text-right text-blue-600">{item.soldQuantity ?? 0}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

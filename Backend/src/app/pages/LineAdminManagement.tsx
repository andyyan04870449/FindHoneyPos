import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Loader2, Check, X, Trash2, RefreshCw, Users, UserCheck, UserX, Clock } from 'lucide-react';
import { getLineAdmins, approveLineAdmin, rejectLineAdmin, removeLineAdmin } from '@/lib/api';
import { toast } from 'sonner';
import type { LineAdmin } from '@/types';

export function LineAdminManagement() {
  const [admins, setAdmins] = useState<LineAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLineAdmins();
      setAdmins(data);
    } catch (err) {
      toast.error('載入 LINE 管理員清單失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      const updated = await approveLineAdmin(id);
      setAdmins((prev) => prev.map((a) => (a.id === id ? updated : a)));
      toast.success('已核可管理員申請');
    } catch (err) {
      toast.error('核可失敗');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      const updated = await rejectLineAdmin(id);
      setAdmins((prev) => prev.map((a) => (a.id === id ? updated : a)));
      toast.success('已拒絕管理員申請');
    } catch (err) {
      toast.error('拒絕失敗');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (id: number) => {
    if (!window.confirm('確定要移除此 LINE 管理員嗎？移除後將不再收到系統通知。')) return;
    setActionLoading(id);
    try {
      await removeLineAdmin(id);
      setAdmins((prev) => prev.filter((a) => a.id !== id));
      toast.success('已移除 LINE 管理員');
    } catch (err) {
      toast.error('移除失敗');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (admin: LineAdmin) => {
    if (!admin.isActive && admin.status === 'Approved') {
      return <Badge variant="outline" className="text-gray-500">已停用</Badge>;
    }
    switch (admin.status) {
      case 'Pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">待審核</Badge>;
      case 'Approved':
        return <Badge className="bg-green-500 text-white">已核可</Badge>;
      case 'Rejected':
        return <Badge variant="destructive">已拒絕</Badge>;
      default:
        return <Badge variant="outline">{admin.status}</Badge>;
    }
  };

  const pendingCount = admins.filter((a) => a.status === 'Pending').length;
  const approvedCount = admins.filter((a) => a.status === 'Approved' && a.isActive).length;

  return (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">待審核</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">已核可</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">總計</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* 主要內容 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>LINE 管理員審核</CardTitle>
              <CardDescription>
                管理透過 LINE 申請的管理員，核可後將收到系統重要通知（如關班日結）
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAdmins} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              重新載入
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>目前沒有 LINE 管理員申請</p>
              <p className="text-sm mt-2">用戶可在 LINE OA 輸入 /auth 申請成為管理員</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>LINE 用戶</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>申請時間</TableHead>
                  <TableHead>審核資訊</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id} className={admin.status === 'Pending' ? 'bg-yellow-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {admin.pictureUrl ? (
                          <img
                            src={admin.pictureUrl}
                            alt={admin.displayName || 'LINE 用戶'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{admin.displayName || '未命名用戶'}</div>
                          <div className="text-xs text-gray-500 font-mono">
                            {admin.lineUserId.slice(0, 20)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(admin)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(admin.createdAt).toLocaleString('zh-TW')}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {admin.approvedByName && (
                        <div>
                          <div>{admin.status === 'Approved' ? '核可者' : '拒絕者'}: {admin.approvedByName}</div>
                          {admin.approvedAt && (
                            <div className="text-xs">
                              {new Date(admin.approvedAt).toLocaleString('zh-TW')}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {admin.status === 'Pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-300 hover:bg-green-50"
                              onClick={() => handleApprove(admin.id)}
                              disabled={actionLoading === admin.id}
                            >
                              {actionLoading === admin.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  核可
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => handleReject(admin.id)}
                              disabled={actionLoading === admin.id}
                            >
                              {actionLoading === admin.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <X className="h-4 w-4 mr-1" />
                                  拒絕
                                </>
                              )}
                            </Button>
                          </>
                        )}
                        {admin.status === 'Approved' && admin.isActive && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleRemove(admin.id)}
                            disabled={actionLoading === admin.id}
                          >
                            {actionLoading === admin.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-1" />
                                移除
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 說明卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">使用說明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>1. 用戶在 LINE OA 輸入 <code className="bg-gray-100 px-1 rounded">/auth</code> 申請成為管理員</p>
          <p>2. 申請會出現在此頁面，管理員可以核可或拒絕</p>
          <p>3. 核可後，該用戶將收到系統重要通知，包括：</p>
          <ul className="list-disc list-inside ml-4">
            <li>關班通知（營業額、訂單數等）</li>
            <li>日結通知</li>
          </ul>
          <p>4. 可隨時移除管理員，移除後將停止接收通知</p>
        </CardContent>
      </Card>
    </div>
  );
}

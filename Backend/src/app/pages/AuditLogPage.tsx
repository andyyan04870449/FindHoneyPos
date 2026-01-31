import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { AuditLogEntry } from '@/types';

const AUDIT_ACTIONS = [
  { value: '', label: '全部操作' },
  { value: 'Register', label: '註冊' },
  { value: 'Login', label: '登入' },
  { value: 'Logout', label: '登出' },
  { value: 'ChangePassword', label: '變更密碼' },
  { value: 'CreateUser', label: '建立帳號' },
  { value: 'UpdateUser', label: '更新帳號' },
  { value: 'DisableUser', label: '停用帳號' },
  { value: 'EnableUser', label: '啟用帳號' },
  { value: 'ResetPassword', label: '重設密碼' },
];

const ACTION_LABELS: Record<string, string> = Object.fromEntries(
  AUDIT_ACTIONS.filter(a => a.value).map(a => [a.value, a.label])
);

const PAGE_SIZE = 20;

interface PagedResponse {
  success: boolean;
  data: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), pageSize: PAGE_SIZE.toString() });
      if (actionFilter) params.set('action', actionFilter);

      const res = await fetch(`/api/admin/audit-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const json: PagedResponse = await res.json();
      setLogs(json.data);
      setTotal(json.total);
    } catch {
      toast.error('載入操作紀錄失敗');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-TW');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">操作紀錄</h2>
          <p className="text-gray-600 mt-1">查看系統操作歷史紀錄</p>
        </div>
        <div className="w-48">
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="全部操作" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部操作</SelectItem>
              {AUDIT_ACTIONS.filter(a => a.value).map((a) => (
                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
                  <TableHead>時間</TableHead>
                  <TableHead>使用者</TableHead>
                  <TableHead>操作</TableHead>
                  <TableHead>詳情</TableHead>
                  <TableHead>IP 位址</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      沒有操作紀錄
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">{log.username}</TableCell>
                      <TableCell>{ACTION_LABELS[log.action] || log.action}</TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-xs truncate">
                        {log.detail || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">{log.ipAddress || '-'}</TableCell>
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
    </div>
  );
}

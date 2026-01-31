import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Save, Loader2, Trophy, X as XIcon, Check } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Badge } from '@/app/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { toast } from 'sonner';
import type { IncentiveSettings, IncentiveHistory } from '@/types';
import { api } from '@/lib/api';

export function IncentiveManagement() {
  const [settings, setSettings] = useState<IncentiveSettings | null>(null);
  const [history, setHistory] = useState<IncentiveHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [dailyTarget, setDailyTarget] = useState('125');

  const fetchData = useCallback(async () => {
    try {
      const [settingsData, historyData] = await Promise.all([
        api<IncentiveSettings>('/api/admin/incentive'),
        api<IncentiveHistory[]>('/api/admin/incentive/history'),
      ]);
      setSettings(settingsData);
      setIsEnabled(settingsData.isEnabled);
      setDailyTarget(String(settingsData.dailyTarget));
      setHistory(historyData);
    } catch (err) {
      toast.error('載入激勵設定失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    const target = parseInt(dailyTarget);
    if (isNaN(target) || target <= 0) {
      toast.error('請輸入有效的目標數量');
      return;
    }

    setSaving(true);
    try {
      const updated = await api<IncentiveSettings>('/api/admin/incentive', {
        method: 'PUT',
        body: JSON.stringify({ isEnabled, dailyTarget: target }),
      });
      setSettings(updated);
      toast.success('激勵設定已更新');
    } catch (err) {
      toast.error('更新激勵設定失敗');
    } finally {
      setSaving(false);
    }
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
      {/* 設定卡片 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-teal-600" />
          激勵設定
        </h3>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-teal-50 rounded-lg border border-teal-200">
            <div>
              <p className="font-medium text-teal-900">啟用激勵進度系統</p>
              <p className="text-sm text-teal-700 mt-1">
                啟用後，POS 前端會顯示激勵進度條
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              className="data-[state=checked]:bg-teal-600"
            />
          </div>

          {isEnabled && (
            <div className="space-y-3">
              <Label htmlFor="dailyTarget" className="text-base font-medium">
                每日銷售目標（個）
              </Label>
              <Input
                id="dailyTarget"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(e.target.value)}
                type="number"
                min="1"
                className="max-w-xs"
                placeholder="請輸入目標數量"
              />
              <p className="text-sm text-gray-500">
                設定每日需售出的商品數量目標，達成後員工可獲得獎勵
              </p>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            儲存設定
          </Button>

          {settings && (
            <p className="text-xs text-gray-400">
              上次更新：{new Date(settings.updatedAt).toLocaleString('zh-TW')}
            </p>
          )}
        </div>
      </Card>

      {/* 歷史記錄 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          激勵達成歷史
        </h3>

        {history.length === 0 ? (
          <p className="text-gray-500 text-center py-8">尚無日結資料</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead className="text-right">目標</TableHead>
                  <TableHead className="text-right">銷售數</TableHead>
                  <TableHead className="text-right">達成率</TableHead>
                  <TableHead className="text-center">狀態</TableHead>
                  <TableHead>提交時間</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => {
                  const rate = item.target > 0
                    ? Math.round((item.itemsSold / item.target) * 100)
                    : 0;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.date}</TableCell>
                      <TableCell className="text-right">{item.target}</TableCell>
                      <TableCell className="text-right">{item.itemsSold}</TableCell>
                      <TableCell className="text-right">{rate}%</TableCell>
                      <TableCell className="text-center">
                        {item.achieved ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Check className="h-3 w-3 mr-1" />
                            達成
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-gray-600">
                            <XIcon className="h-3 w-3 mr-1" />
                            未達成
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(item.submittedAt).toLocaleString('zh-TW')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

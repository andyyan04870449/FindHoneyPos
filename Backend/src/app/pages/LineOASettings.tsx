import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Settings, Users, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { toast } from 'sonner';
import type { LineOASettings as LineOASettingsType, MessageTemplate } from '@/types';
import { api } from '@/lib/api';

interface BroadcastRecord {
  id: string;
  name: string;
  sentAt: string;
  status: string;
}

export function LineOASettings() {
  const [settings, setSettings] = useState<LineOASettingsType>({
    channelId: '',
    channelSecret: '',
    accessToken: '',
    isConnected: false,
    autoReply: true,
    orderNotification: true,
    promotionNotification: false,
  });
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastRecord[]>([]);
  const [testMessage, setTestMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('order');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [settingsData, templatesData, historyData] = await Promise.all([
        api<LineOASettingsType>('/api/admin/line-settings'),
        api<MessageTemplate[]>('/api/admin/line-settings/templates'),
        api<BroadcastRecord[]>('/api/admin/line-settings/broadcast-history'),
      ]);
      setSettings(settingsData);
      setTemplates(templatesData);
      setBroadcastHistory(historyData);
    } catch (err) {
      console.error('Failed to fetch LINE OA data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveSettings = async () => {
    if (!settings.channelId || !settings.channelSecret || !settings.accessToken) {
      toast.error('請填寫所有必填欄位');
      return;
    }

    try {
      await api('/api/admin/line-settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      toast.success('LINE OA 設定已保存');
      fetchData();
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error('保存設定失敗');
    }
  };

  const handleTestConnection = async () => {
    if (!settings.channelId || !settings.channelSecret || !settings.accessToken) {
      toast.error('請先完成 LINE OA 設定');
      return;
    }

    try {
      await api('/api/admin/line-settings/test-connection', { method: 'POST' });
      toast.success('連線測試成功！');
      setSettings({ ...settings, isConnected: true });
    } catch (err) {
      console.error('Failed to test connection:', err);
      toast.error('連線測試失敗');
    }
  };

  const handleSendBroadcast = async () => {
    if (!testMessage.trim()) {
      toast.error('請輸入測試訊息');
      return;
    }

    if (!settings.isConnected) {
      toast.error('請先連接 LINE OA');
      return;
    }

    try {
      await api('/api/admin/line-settings/broadcast', {
        method: 'POST',
        body: JSON.stringify({ template: selectedTemplate, message: testMessage }),
      });
      toast.success('訊息已發送');
      setTestMessage('');
      fetchData();
    } catch (err) {
      console.error('Failed to send broadcast:', err);
      toast.error('發送訊息失敗');
    }
  };

  const handleToggleTemplate = async (templateId: string) => {
    try {
      await api(`/api/admin/line-settings/templates/${templateId}/toggle`, { method: 'PATCH' });
      toast.success('範本狀態已更新');
      fetchData();
    } catch (err) {
      console.error('Failed to toggle template:', err);
      toast.error('更新範本狀態失敗');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const stats = {
    followers: 1250,
    messagesThisMonth: 3840,
    responseRate: 95.5,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">LINE OA 整合</h2>
          <p className="text-gray-600 mt-1">設定 LINE 官方帳號串接與訊息推播</p>
        </div>
        <div className="flex items-center gap-2">
          {settings.isConnected ? (
            <Badge className="bg-green-100 text-green-700">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              已連接
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
              <XCircle className="h-4 w-4 mr-1" />
              未連接
            </Badge>
          )}
        </div>
      </div>

      {settings.isConnected && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">好友人數</p>
                <p className="text-2xl font-bold">{stats.followers}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">本月訊息數</p>
                <p className="text-2xl font-bold">{stats.messagesThisMonth}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <CheckCircle2 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">回覆率</p>
                <p className="text-2xl font-bold">{stats.responseRate}%</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            基本設定
          </TabsTrigger>
          <TabsTrigger value="templates">
            <MessageSquare className="h-4 w-4 mr-2" />
            訊息範本
          </TabsTrigger>
          <TabsTrigger value="broadcast">
            <Send className="h-4 w-4 mr-2" />
            推播訊息
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">LINE OA 連接設定</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="channelId">Channel ID</Label>
                <Input
                  id="channelId"
                  value={settings.channelId}
                  onChange={(e) => setSettings({ ...settings, channelId: e.target.value })}
                  placeholder="請輸入 LINE Channel ID"
                />
              </div>
              <div>
                <Label htmlFor="channelSecret">Channel Secret</Label>
                <Input
                  id="channelSecret"
                  type="password"
                  value={settings.channelSecret}
                  onChange={(e) => setSettings({ ...settings, channelSecret: e.target.value })}
                  placeholder="請輸入 LINE Channel Secret"
                />
              </div>
              <div>
                <Label htmlFor="accessToken">Channel Access Token</Label>
                <Input
                  id="accessToken"
                  type="password"
                  value={settings.accessToken}
                  onChange={(e) => setSettings({ ...settings, accessToken: e.target.value })}
                  placeholder="請輸入 LINE Channel Access Token"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleTestConnection} variant="outline" className="flex-1">
                  測試連線
                </Button>
                <Button onClick={handleSaveSettings} className="flex-1 bg-orange-500 hover:bg-orange-600">
                  保存設定
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">自動通知設定</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">自動回覆</p>
                  <p className="text-sm text-gray-600">自動回覆客戶訊息</p>
                </div>
                <Switch
                  checked={settings.autoReply}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoReply: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">訂單通知</p>
                  <p className="text-sm text-gray-600">新訂單時發送通知給管理員</p>
                </div>
                <Switch
                  checked={settings.orderNotification}
                  onCheckedChange={(checked) => setSettings({ ...settings, orderNotification: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">促銷活動通知</p>
                  <p className="text-sm text-gray-600">自動推播促銷活動訊息</p>
                </div>
                <Switch
                  checked={settings.promotionNotification}
                  onCheckedChange={(checked) => setSettings({ ...settings, promotionNotification: checked })}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">訊息範本管理</h3>
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{template.name}</h4>
                      <Badge variant="secondary" className="mt-1">
                        {template.type === 'order'
                          ? '訂單通知'
                          : template.type === 'promotion'
                          ? '促銷活動'
                          : '日結報表'}
                      </Badge>
                    </div>
                    <Switch
                      checked={template.isActive}
                      onCheckedChange={() => handleToggleTemplate(template.id)}
                    />
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                    {template.content}
                  </div>
                  <Button variant="outline" size="sm">編輯範本</Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="broadcast" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">發送推播訊息</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template">選擇範本</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">訂單確認通知</SelectItem>
                    <SelectItem value="daily_report">每日營業報表</SelectItem>
                    <SelectItem value="promotion">促銷活動通知</SelectItem>
                    <SelectItem value="custom">自訂訊息</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message">訊息內容</Label>
                <Textarea
                  id="message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="輸入要發送的訊息..."
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  可使用變數：{'{order_number}'}, {'{total}'}, {'{date}'}, {'{revenue}'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSendBroadcast}
                  className="bg-orange-500 hover:bg-orange-600"
                  disabled={!settings.isConnected}
                >
                  <Send className="h-4 w-4 mr-2" />
                  發送測試訊息
                </Button>
                <Button variant="outline" disabled={!settings.isConnected}>
                  發送給所有好友
                </Button>
              </div>
              {!settings.isConnected && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    請先在「基本設定」中完成 LINE OA 連接設定
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">發送記錄</h3>
            <div className="space-y-2">
              {broadcastHistory.map((record) => (
                <div key={record.id} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">{record.name}</p>
                    <p className="text-sm text-gray-600">{record.sentAt}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">{record.status}</Badge>
                </div>
              ))}
              {broadcastHistory.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">暫無發送記錄</p>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

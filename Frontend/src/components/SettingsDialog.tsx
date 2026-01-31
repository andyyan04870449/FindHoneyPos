import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { 
  Settings, 
  Smartphone, 
  Database, 
  Download, 
  Trash2,
  Wifi,
  WifiOff,
  TrendingUp
} from "lucide-react";
import { logger } from "../utils/logger";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOnline: boolean;
  deviceId: string;
  menuVersion: string;
  unsyncedCount: number;
  onSyncData: () => void;
  incentiveEnabled: boolean;
  incentiveTarget: number;
  onIncentiveToggle: (enabled: boolean) => void;
  onIncentiveTargetChange: (target: number) => void;
}

export function SettingsDialog({ 
  open,
  onOpenChange,
  isOnline, 
  deviceId, 
  menuVersion, 
  unsyncedCount,
  onSyncData,
  incentiveEnabled,
  incentiveTarget,
  onIncentiveToggle,
  onIncentiveTargetChange
}: SettingsDialogProps) {
  const logs = logger.getLogs();
  const [tempTarget, setTempTarget] = useState(incentiveTarget.toString());

  const handleIncentiveTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTempTarget(value);
    
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      onIncentiveTargetChange(numValue);
    }
  };

  const handleExportLogs = () => {
    const logData = logger.exportLogs();
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pos-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    logger.userAction('匯出日誌');
  };

  const handleClearLogs = () => {
    if (window.confirm('確定要清除所有日誌嗎？此操作無法復原。')) {
      logger.clearLogs();
      logger.userAction('清除日誌');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            系統設定
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="status" className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status">系統狀態</TabsTrigger>
            <TabsTrigger value="incentive">激勵進度</TabsTrigger>
            <TabsTrigger value="logs">操作日誌</TabsTrigger>
            <TabsTrigger value="sync">資料同步</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  裝置資訊
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">裝置ID:</span>
                    <Badge variant="outline">{deviceId}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">瀏覽器:</span>
                    <span>{navigator.userAgent.split(' ')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">螢幕:</span>
                    <span>{window.screen.width} × {window.screen.height}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">系統狀態</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">網路狀態:</span>
                    <div className="flex items-center gap-1">
                      {isOnline ? (
                        <>
                          <Wifi className="h-4 w-4 text-green-500" />
                          <Badge className="bg-green-500 text-white">線上</Badge>
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-4 w-4 text-red-500" />
                          <Badge variant="destructive">離線</Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">菜單版本:</span>
                    <Badge>{menuVersion}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">本地儲存:</span>
                    <Badge className="bg-blue-500 text-white">
                      {logs.length} 筆日誌
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">操作記錄 ({logs.length})</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleExportLogs}>
                  <Download className="h-4 w-4 mr-1" />
                  匯出
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={handleClearLogs}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  清除
                </Button>
              </div>
            </div>

            <ScrollArea className="h-80 border rounded-lg p-3">
              <div className="space-y-2">
                {logs.slice(-50).reverse().map((log, index) => (
                  <div key={index} className="text-xs">
                    <div className="flex items-start gap-2">
                      <Badge 
                        variant={
                          log.level === 'ERROR' ? 'destructive' : 
                          log.level === 'WARN' ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {log.level}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-mono text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                        <div className="mt-1">{log.message}</div>
                        {log.data && (
                          <pre className="mt-1 text-gray-600 bg-gray-50 p-1 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                    <Separator className="mt-2" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sync" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  資料同步
                </h3>
                <Badge 
                  variant={unsyncedCount > 0 ? "destructive" : "secondary"}
                >
                  {unsyncedCount} 筆待同步
                </Badge>
              </div>

              <div className="text-sm text-gray-600">
                當網路恢復時，系統會自動同步未上傳的訂單資料。
              </div>

              {unsyncedCount > 0 && (
                <Button 
                  onClick={onSyncData}
                  disabled={!isOnline}
                  className="w-full"
                >
                  立即同步資料
                </Button>
              )}

              <div className="border rounded-lg p-3 bg-gray-50">
                <h4 className="font-medium mb-2">同步狀態說明</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 線上模式：訂單即時上傳</li>
                  <li>• 離線模式：訂單暫存本地</li>
                  <li>• 網路恢復：自動批次同步</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="incentive" className="mt-4">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-teal-50 rounded-lg border-2 border-teal-200">
                <div>
                  <h3 className="font-bold flex items-center gap-2 text-teal-900">
                    <TrendingUp className="h-5 w-5" />
                    激勵進度系統
                  </h3>
                  <p className="text-sm text-teal-700 mt-1">
                    啟用後，系統會在頂部顯示進度條，以實際收錢的商品數量計算
                  </p>
                </div>
                <Switch 
                  checked={incentiveEnabled}
                  onCheckedChange={onIncentiveToggle}
                  className="data-[state=checked]:bg-teal-600"
                />
              </div>

              {incentiveEnabled && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-3">
                    <Label htmlFor="incentiveTarget" className="text-base font-medium">
                      每日銷售目標（個）
                    </Label>
                    <Input 
                      id="incentiveTarget"
                      value={tempTarget}
                      onChange={handleIncentiveTargetChange}
                      type="number"
                      min="0"
                      className="text-lg h-12"
                      placeholder="請輸入目標數量"
                    />
                    <p className="text-sm text-gray-500">
                      設定每日需售出的商品數量目標，達成後員工可獲得獎勵
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium mb-3">功能說明</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>✓ 進度條會顯示在頂部狀態列下方</li>
                      <li>✓ 只計算實際收錢的訂單（贈送單不計算）</li>
                      <li>✓ 達成目標時會顯示慶祝動畫</li>
                      <li>✓ 日結帳時會顯示當天的進度統計</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
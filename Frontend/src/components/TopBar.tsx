import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Wifi, WifiOff, Menu, X, Settings, RefreshCw, Database, Calculator, LogOut } from "lucide-react";
import { SettingsDialog } from "./SettingsDialog";
import logoImage from 'figma:asset/0823fe84278739e4331a8463c99173e87d691257.png';

interface TopBarProps {
  isOnline: boolean;
  menuVersion: string;
  orderCount: number;
  deviceId: string;
  unsyncedCount: number;
  onUpdateMenu: () => void;
  onSyncData: () => void;
  onOpenSettlement: () => void;
  incentiveEnabled: boolean;
  incentiveTarget: number;
  onIncentiveToggle: (enabled: boolean) => void;
  onIncentiveTargetChange: (target: number) => void;
  userName?: string;
  onLogout?: () => void;
}

export function TopBar({
  isOnline,
  menuVersion,
  orderCount,
  deviceId,
  unsyncedCount,
  onUpdateMenu,
  onSyncData,
  onOpenSettlement,
  incentiveEnabled,
  incentiveTarget,
  onIncentiveToggle,
  onIncentiveTargetChange,
  userName,
  onLogout,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className="bg-white border-b-2 border-gray-200 shadow-sm shrink-0">
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-5">
            {/* 漢堡選單按鈕 */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors active:scale-95 relative z-50"
            >
              {menuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>

            {/* Logo區域 */}
            <div className="flex items-center gap-3">
              <img 
                src={logoImage} 
                alt="尋蜜 Find Honey Logo" 
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  尋蜜點餐系統
                </h1>
                <p className="text-sm text-gray-500">
                  Find Honey POS
                </p>
              </div>
            </div>
            
            {/* 連線狀態 */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2.5 min-w-24">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <span className="text-base font-medium text-gray-700">
                {isOnline ? "線上" : "離線"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* 菜單版本 */}
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">菜單版本</p>
              <Badge variant="outline" className="text-base px-3 py-1 border-2">
                {menuVersion}
              </Badge>
            </div>
            
            {/* 今日訂單 */}
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">今日訂單</p>
              <Badge className="bg-brand-orange text-white text-base px-3 py-1">
                {orderCount} 筆
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* 遮罩層 */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* 側邊選單 - 從左側滑入 */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        menuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b-2 border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">選單</h2>
            <button
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-6 w-6 text-gray-700" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-2">
          <Button
            variant="ghost"
            onClick={() => {
              onUpdateMenu();
              setMenuOpen(false);
            }}
            className="w-full justify-start h-14 text-base hover:bg-gray-50"
          >
            <RefreshCw className="h-5 w-5 mr-3" />
            更新菜單
          </Button>

          {!isOnline && unsyncedCount > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                onSyncData();
                setMenuOpen(false);
              }}
              className="w-full justify-start h-14 text-base hover:bg-gray-50"
            >
              <Database className="h-5 w-5 mr-3" />
              同步資料 ({unsyncedCount})
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={() => {
              setSettingsOpen(true);
              setMenuOpen(false);
            }}
            className="w-full justify-start h-14 text-base hover:bg-gray-50"
          >
            <Settings className="h-5 w-5 mr-3" />
            系統設定
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              onOpenSettlement();
              setMenuOpen(false);
            }}
            className="w-full justify-start h-14 text-base hover:bg-gray-50"
          >
            <Calculator className="h-5 w-5 mr-3" />
            日結帳
          </Button>

          {onLogout && (
            <>
              <div className="border-t my-2" />
              {userName && (
                <div className="px-4 py-2 text-sm text-gray-500">
                  登入帳號：{userName}
                </div>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  onLogout();
                  setMenuOpen(false);
                }}
                className="w-full justify-start h-14 text-base text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-5 w-5 mr-3" />
                登出
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 設定對話框 */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        isOnline={isOnline}
        deviceId={deviceId}
        menuVersion={menuVersion}
        unsyncedCount={unsyncedCount}
        onSyncData={onSyncData}
        incentiveEnabled={incentiveEnabled}
        incentiveTarget={incentiveTarget}
        onIncentiveToggle={onIncentiveToggle}
        onIncentiveTargetChange={onIncentiveTargetChange}
      />
    </>
  );
}
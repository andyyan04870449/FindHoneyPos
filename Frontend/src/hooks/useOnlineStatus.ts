import { useState, useEffect, useRef } from 'react';
import { logger } from '../utils/logger';
import { HEARTBEAT_INTERVAL } from '../constants';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const isOnlineRef = useRef(isOnline);

  // 保持 ref 同步
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.systemEvent('網路連線恢復');
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.systemEvent('網路連線中斷');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 定期檢查網路狀態
    const checkConnection = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch('/ping', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const online = response.ok;
        if (online !== isOnlineRef.current) {
          setIsOnline(online);
          logger.systemEvent(online ? '伺服器連線恢復' : '伺服器連線失敗');
        }
      } catch {
        clearTimeout(timeoutId);
        if (isOnlineRef.current) {
          setIsOnline(false);
          logger.systemEvent('伺服器連線檢查失敗');
        }
      }
    };

    const interval = setInterval(checkConnection, HEARTBEAT_INTERVAL);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []); // 移除 isOnline 依賴，改用 ref

  return isOnline;
}
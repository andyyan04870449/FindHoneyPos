import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import { HEARTBEAT_INTERVAL } from '../constants';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
      try {
        const response = await fetch('/ping', { 
          method: 'HEAD',
          cache: 'no-cache',
          timeout: 5000 
        });
        const online = response.ok;
        if (online !== isOnline) {
          setIsOnline(online);
          logger.systemEvent(online ? '伺服器連線恢復' : '伺服器連線失敗');
        }
      } catch {
        if (isOnline) {
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
  }, [isOnline]);

  return isOnline;
}
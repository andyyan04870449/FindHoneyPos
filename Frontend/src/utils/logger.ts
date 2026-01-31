import type { LogLevel, LogEntry } from '../types';
import { MAX_LOG_ENTRIES, STORAGE_KEYS } from '../constants';

class Logger {
  private logs: LogEntry[] = [];

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private addLog(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      data
    };

    this.logs.push(entry);
    if (this.logs.length > MAX_LOG_ENTRIES.MEMORY) {
      this.logs.shift();
    }

    // 儲存到 localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(this.logs.slice(-MAX_LOG_ENTRIES.STORAGE)));
    } catch (e) {
      console.warn('無法儲存日誌到 localStorage');
    }

    // 彩色控制台輸出
    const style = this.getConsoleStyle(level);
    console.log(
      `%c[${level}] ${this.formatTimestamp()} - ${message}`,
      style,
      data || ''
    );
  }

  private getConsoleStyle(level: LogLevel): string {
    switch (level) {
      case 'DEBUG':
        return 'color: #6B7280; font-weight: normal;';
      case 'INFO':
        return 'color: #10B981; font-weight: bold;';
      case 'WARN':
        return 'color: #F59E0B; font-weight: bold;';
      case 'ERROR':
        return 'color: #EF4444; font-weight: bold; background: #FEE2E2; padding: 2px 4px;';
      default:
        return 'color: inherit;';
    }
  }

  debug(message: string, data?: any) {
    this.addLog('DEBUG', message, data);
  }

  info(message: string, data?: any) {
    this.addLog('INFO', message, data);
  }

  warn(message: string, data?: any) {
    this.addLog('WARN', message, data);
  }

  error(message: string, data?: any) {
    this.addLog('ERROR', message, data);
  }

  // 用戶操作記錄
  userAction(action: string, details?: any) {
    this.info(`用戶操作: ${action}`, details);
  }

  // 系統事件記錄
  systemEvent(event: string, details?: any) {
    this.info(`系統事件: ${event}`, details);
  }

  // 獲取日誌
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // 清除日誌
  clearLogs() {
    this.logs = [];
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    this.info('日誌已清除');
  }

  // 匯出日誌
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // 初始化時載入儲存的日誌
  loadStoredLogs() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (stored) {
        const parsedLogs = JSON.parse(stored);
        this.logs = parsedLogs;
        this.info('已載入儲存的日誌', { count: parsedLogs.length });
      }
    } catch (e) {
      this.warn('無法載入儲存的日誌');
    }
  }
}

// 創建全域實例
export const logger = new Logger();

// 頁面載入時初始化
if (typeof window !== 'undefined') {
  logger.loadStoredLogs();
  logger.systemEvent('應用程式啟動');
}

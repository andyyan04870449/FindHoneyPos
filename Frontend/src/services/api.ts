import { logger } from '../utils/logger';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

import type {
  Addon,
  ApiResponse,
  AuthResponse,
  Product,
  PosDiscount,
  CreateOrderRequest,
  CreateOrderResponse,
  BatchSyncResponse,
  SubmitSettlementRequest,
  SettlementResponse,
  SyncStatusResponse,
  SystemStatus,
  PendingOrder,
  IncentiveSettingsResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;
const TOKEN_KEY = 'pos_auth_token';

function getBaseUrl(): string {
  if (import.meta.env.DEV) return '';
  return API_BASE || '';
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${getBaseUrl()}${endpoint}`;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    onUnauthorized?.();
    logger.error('API 401 未授權', { endpoint });
    throw new Error('未授權，請重新登入');
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    logger.error(`API 錯誤 [${response.status}] ${endpoint}`, { errorText });
    throw new ApiError(`API 錯誤: ${response.status} ${response.statusText}`, response.status);
  }

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    logger.error(`API 回傳失敗: ${endpoint}`, { message: json.message });
    throw new Error(json.message || 'API 回傳失敗');
  }

  return json.data as T;
}

/** Auth API (no token required) */
async function fetchAuthApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${getBaseUrl()}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    let message = `API 錯誤: ${response.status}`;
    try {
      const json = JSON.parse(errorText);
      if (json.message) message = json.message;
    } catch {
      if (errorText) message = errorText;
    }
    throw new Error(message);
  }

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new Error(json.message || 'API 回傳失敗');
  }

  return json.data as T;
}

export const authApi = {
  getStatus(): Promise<SystemStatus> {
    return fetchAuthApi<SystemStatus>('/api/auth/status');
  },

  login(username: string, password: string): Promise<AuthResponse> {
    return fetchAuthApi<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  register(username: string, password: string, confirmPassword: string, displayName: string): Promise<AuthResponse> {
    return fetchAuthApi<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, confirmPassword, displayName }),
    });
  },
};

export const posApi = {
  /** 取得商品列表 */
  getProducts(): Promise<Product[]> {
    return fetchApi<Product[]>('/api/pos/products');
  },

  /** 取得加料列表 */
  getAddons(): Promise<Addon[]> {
    return fetchApi<Addon[]>('/api/pos/addons');
  },

  /** 建立訂單 */
  createOrder(req: CreateOrderRequest): Promise<CreateOrderResponse> {
    return fetchApi<CreateOrderResponse>('/api/pos/orders', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  /** 批次同步離線訂單 */
  syncOrders(orders: PendingOrder[]): Promise<BatchSyncResponse> {
    return fetchApi<BatchSyncResponse>('/api/pos/sync/orders', {
      method: 'POST',
      body: JSON.stringify({ orders }),
    });
  },

  /** 取得目前啟用的折扣 */
  getActiveDiscounts(): Promise<PosDiscount[]> {
    return fetchApi<PosDiscount[]>('/api/pos/discounts/active');
  },

  /** 提交日結帳 */
  submitSettlement(req: SubmitSettlementRequest): Promise<SettlementResponse> {
    return fetchApi<SettlementResponse>('/api/pos/inventory/settlement', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  /** 取得今日結帳資料 */
  getTodaySettlement(): Promise<unknown> {
    return fetchApi('/api/pos/inventory/today');
  },

  /** 取得同步狀態 */
  getSyncStatus(deviceId: string): Promise<SyncStatusResponse> {
    return fetchApi<SyncStatusResponse>(
      `/api/pos/sync/status?deviceId=${encodeURIComponent(deviceId)}`
    );
  },

  /** 取得激勵設定 */
  getIncentiveSettings(): Promise<IncentiveSettingsResponse> {
    return fetchApi<IncentiveSettingsResponse>('/api/pos/incentive/settings');
  },
};

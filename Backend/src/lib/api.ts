const API_BASE = '';

const TOKEN_KEY = 'auth_token';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
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

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('未授權，請重新登入');
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(errorText || `API error: ${res.status}`);
  }

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new Error(json.message || 'API request failed');
  }

  return json.data;
}

/** For auth endpoints that don't need token */
export async function authApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    let message = `API error: ${res.status}`;
    try {
      const json = JSON.parse(errorText);
      if (json.message) message = json.message;
    } catch {
      if (errorText) message = errorText;
    }
    throw new Error(message);
  }

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new Error(json.message || 'API request failed');
  }

  return json.data;
}

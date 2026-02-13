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

// Material API
import type { Material, MaterialStockRecord, MaterialAlert, MaterialStatusSummary, ProductWithRecipes, ProductRecipe, LineAdmin } from '@/types';

export const getMaterials = (search?: string, status?: string) =>
  api<Material[]>(`/api/admin/materials?${new URLSearchParams({ ...(search && { search }), ...(status && { status }) })}`);

export const getMaterial = (id: number) => api<Material>(`/api/admin/materials/${id}`);

export const createMaterial = (data: { name: string; unit: string; currentStock?: number; alertThreshold?: number; status?: string }) =>
  api<Material>('/api/admin/materials', { method: 'POST', body: JSON.stringify(data) });

export const updateMaterial = (id: number, data: { name: string; unit: string; alertThreshold: number; status: string }) =>
  api<Material>(`/api/admin/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteMaterial = (id: number) =>
  api<{ deleted: boolean }>(`/api/admin/materials/${id}`, { method: 'DELETE' });

export const toggleMaterialStatus = (id: number) =>
  api<Material>(`/api/admin/materials/${id}/status`, { method: 'PATCH' });

export const stockIn = (id: number, quantity: number, note?: string) =>
  api<MaterialStockRecord>(`/api/admin/materials/${id}/stock-in`, { method: 'POST', body: JSON.stringify({ quantity, note }) });

export const adjustStock = (id: number, newStock: number, note?: string) =>
  api<MaterialStockRecord>(`/api/admin/materials/${id}/adjust`, { method: 'POST', body: JSON.stringify({ newStock, note }) });

export const wasteStock = (id: number, quantity: number, note?: string) =>
  api<MaterialStockRecord>(`/api/admin/materials/${id}/waste`, { method: 'POST', body: JSON.stringify({ quantity, note }) });

export const getStockRecords = (params?: { materialId?: number; changeType?: string; startDate?: string; endDate?: string; page?: number; pageSize?: number }) =>
  api<MaterialStockRecord[]>(`/api/admin/materials/records?${new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]))}`);

export const getMaterialAlerts = () => api<MaterialAlert[]>('/api/admin/materials/alerts');

export const resolveAlert = (id: number) =>
  api<{ resolved: boolean }>(`/api/admin/materials/alerts/${id}/resolve`, { method: 'POST' });

export const getLowStockMaterials = () => api<Material[]>('/api/admin/materials/low-stock');

export const getMaterialStatus = () => api<MaterialStatusSummary>('/api/admin/materials/status');

// Recipe API
export const getProductRecipes = (productId: number) =>
  api<ProductRecipe[]>(`/api/admin/recipes/products/${productId}`);

export const updateProductRecipes = (productId: number, recipes: { materialId: number; quantity: number }[]) =>
  api<ProductRecipe[]>(`/api/admin/recipes/products/${productId}`, { method: 'PUT', body: JSON.stringify({ recipes }) });

export const getProductsWithRecipes = () =>
  api<ProductWithRecipes[]>('/api/admin/recipes/products-with-recipes');

// Dashboard Material API
export const getDashboardMaterialStatus = () => api<MaterialStatusSummary>('/api/admin/dashboard/material-status');

export const getDashboardLowStockAlerts = () => api<MaterialAlert[]>('/api/admin/dashboard/low-stock-alerts');

// Product Reorder API
export const reorderProducts = (productIds: number[]) =>
  api<{ reordered: boolean }>('/api/admin/products/reorder', { method: 'PATCH', body: JSON.stringify({ productIds }) });

// LINE Admin API
export const getLineAdmins = () => api<LineAdmin[]>('/api/admin/line-admins');

export const approveLineAdmin = (id: number) =>
  api<LineAdmin>(`/api/admin/line-admins/${id}/approve`, { method: 'POST', body: JSON.stringify({}) });

export const rejectLineAdmin = (id: number) =>
  api<LineAdmin>(`/api/admin/line-admins/${id}/reject`, { method: 'POST', body: JSON.stringify({}) });

export const removeLineAdmin = (id: number) =>
  api<boolean>(`/api/admin/line-admins/${id}`, { method: 'DELETE' });

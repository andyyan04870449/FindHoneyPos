import { STORAGE_KEYS } from '../constants';

export function generateDeviceId(): string {
  const stored = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (stored) return stored;

  const newId = 'POS-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  localStorage.setItem(STORAGE_KEYS.DEVICE_ID, newId);
  return newId;
}

import type { SelectedAddon } from '../types';

let _uniqueCounter = 0;

/**
 * 產生不會被合併的唯一購物車品項 ID
 * 格式: {baseId}__{suffix}_{timestamp}_{counter}
 * 雙底線區隔避免與加料 ID 衝突
 */
export function generateUniqueCartItemId(baseId: string, suffix: string): string {
  _uniqueCounter++;
  return `${baseId}__${suffix}_${Date.now()}_${_uniqueCounter}`;
}

/**
 * 產生購物車品項唯一 ID
 * 無加料: "3"
 * 有加料: "3_addon_caramel_addon_cream" (sorted)
 */
export function generateCartItemId(productId: string, addons: SelectedAddon[]): string {
  if (addons.length === 0) return productId;
  const sorted = [...addons].sort((a, b) => a.id.localeCompare(b.id));
  const suffix = sorted.map(a => `addon_${a.id}`).join('_');
  return `${productId}_${suffix}`;
}

/**
 * 計算含加料的單價
 */
export function calculateUnitPrice(basePrice: number, addons: SelectedAddon[]): number {
  return basePrice + addons.reduce((sum, a) => sum + a.price, 0);
}

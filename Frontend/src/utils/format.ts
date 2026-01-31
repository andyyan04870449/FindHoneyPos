/**
 * 格式化金額為 NT$ 格式
 */
export function formatPrice(price: number): string {
  return `NT$ ${price.toLocaleString()}`;
}

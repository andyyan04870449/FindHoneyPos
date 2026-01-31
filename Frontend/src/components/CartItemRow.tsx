import { Plus, Minus } from "lucide-react";
import { Badge } from "./ui/badge";
import type { OrderItem } from "../types";

interface CartItemRowProps {
  item: OrderItem;
  index: number;
  onQuantityChange: (item: OrderItem, delta: number) => void;
  onCustomize?: (item: OrderItem) => void;
  /** 按鈕大小變體: desktop 較小, mobile 較大 */
  variant?: 'desktop' | 'mobile';
}

export function CartItemRow({ item, index, onQuantityChange, onCustomize, variant = 'desktop' }: CartItemRowProps) {
  const btnSize = variant === 'mobile' ? 'w-10 h-10' : 'w-9 h-9';
  const iconSize = variant === 'mobile' ? 'h-5 w-5' : 'h-4 w-4';
  const gapClass = variant === 'mobile' ? 'gap-3' : 'gap-2';
  const outerGapClass = variant === 'mobile' ? 'gap-4' : 'gap-3';
  const minWidthClass = variant === 'mobile' ? 'min-w-20' : 'min-w-[70px]';

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className={`flex items-center ${outerGapClass}`}>
        {/* 流水號 */}
        <span className="shrink-0 w-7 text-sm font-bold text-gray-400 text-center">
          {index}
        </span>

        {/* 商品資訊 */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-base text-gray-900 mb-1 truncate">
            {item.name}
          </h4>
          {item.addons && item.addons.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {item.addons.map(addon => (
                <Badge key={addon.id} variant="secondary" className="text-xs px-1.5 py-0">
                  {addon.name}
                </Badge>
              ))}
            </div>
          )}
          <p className="text-sm text-gray-600">NT$ {item.price}</p>
        </div>

        {/* 客製化按鈕 */}
        {onCustomize && (
          <button
            onClick={() => onCustomize(item)}
            className="shrink-0 min-w-[120px] px-6 py-2.5 rounded-xl text-base text-center font-bold text-brand-orange bg-brand-orange/10 hover:bg-brand-orange/20 active:bg-brand-orange/30 border-2 border-brand-orange/30 transition-colors active:scale-95"
          >
            加料
          </button>
        )}

        {/* 數量控制按鈕 */}
        <div className={`flex items-center ${gapClass} bg-white rounded-lg p-1 shadow-sm`}>
          <button
            onClick={() => onQuantityChange(item, -1)}
            className={`flex items-center justify-center ${btnSize} rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors active:scale-95`}
          >
            <Minus className={`${iconSize} text-gray-700`} strokeWidth={2.5} />
          </button>

          <span className="w-8 text-center font-bold text-base text-gray-900">
            {item.quantity}
          </span>

          <button
            onClick={() => onQuantityChange(item, 1)}
            className={`flex items-center justify-center ${btnSize} rounded-lg bg-brand-orange hover:bg-brand-orange/90 active:bg-brand-orange/80 transition-colors active:scale-95`}
          >
            <Plus className={`${iconSize} text-white`} strokeWidth={2.5} />
          </button>
        </div>

        {/* 小計 */}
        <div className={`text-right ${minWidthClass}`}>
          <span className="font-bold text-base text-gray-900">
            NT$ {item.price * item.quantity}
          </span>
        </div>
      </div>
    </div>
  );
}

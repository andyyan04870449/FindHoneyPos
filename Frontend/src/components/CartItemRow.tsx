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
    <div className="bg-gray-50 rounded-xl px-4 py-2">
      {/* 上行：流水號 + 品名 + 小計 */}
      <div className="flex items-start gap-2 mb-1">
        <span className="shrink-0 w-7 text-sm font-bold text-gray-400 text-center leading-6">
          {index}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-base text-gray-900 leading-6">
            {item.name}
          </h4>
          {item.addons && item.addons.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.addons.map(addon => (
                <Badge key={addon.id} variant="secondary" className="text-xs px-1.5 py-0">
                  {addon.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <span className="font-bold text-base text-gray-900">
            NT$ {item.price * item.quantity}
          </span>
        </div>
      </div>

      {/* 下行：加料按鈕 + 數量控制 */}
      <div className="flex items-center justify-end gap-1.5 ml-9">
        {onCustomize && (
          <button
            onClick={() => onCustomize(item)}
            className="shrink-0 px-2 py-0.5 rounded-lg text-xs text-center font-bold text-brand-orange bg-brand-orange/10 hover:bg-brand-orange/20 active:bg-brand-orange/30 border border-brand-orange/30 transition-colors active:scale-95"
          >
            加料
          </button>
        )}

        <div className="flex items-center gap-1 bg-white rounded-md p-0.5 shadow-sm">
          <button
            onClick={() => onQuantityChange(item, -1)}
            className="flex items-center justify-center w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors active:scale-95"
          >
            <Minus className="h-3 w-3 text-gray-700" strokeWidth={2.5} />
          </button>

          <span className="w-5 text-center font-bold text-sm text-gray-900">
            {item.quantity}
          </span>

          <button
            onClick={() => onQuantityChange(item, 1)}
            className="flex items-center justify-center w-5 h-5 rounded bg-brand-orange hover:bg-brand-orange/90 active:bg-brand-orange/80 transition-colors active:scale-95"
          >
            <Plus className="h-3 w-3 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

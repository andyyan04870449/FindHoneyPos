import { Badge } from "./ui/badge";
import { Tag } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isOnPromotion?: boolean;
  promotionPrice?: number;
  cardColor?: string;
  onClick: () => void;
}

// 20 色對應表
const COLOR_MAP: Record<string, { bg: string; dark: string }> = {
  red: { bg: 'bg-red-600', dark: 'bg-red-800' },
  orange: { bg: 'bg-orange-600', dark: 'bg-orange-800' },
  amber: { bg: 'bg-amber-600', dark: 'bg-amber-800' },
  yellow: { bg: 'bg-yellow-500', dark: 'bg-yellow-700' },
  lime: { bg: 'bg-lime-600', dark: 'bg-lime-800' },
  green: { bg: 'bg-green-600', dark: 'bg-green-800' },
  emerald: { bg: 'bg-emerald-600', dark: 'bg-emerald-800' },
  teal: { bg: 'bg-teal-600', dark: 'bg-teal-800' },
  cyan: { bg: 'bg-cyan-600', dark: 'bg-cyan-800' },
  sky: { bg: 'bg-sky-600', dark: 'bg-sky-800' },
  blue: { bg: 'bg-blue-600', dark: 'bg-blue-800' },
  indigo: { bg: 'bg-indigo-600', dark: 'bg-indigo-800' },
  violet: { bg: 'bg-violet-600', dark: 'bg-violet-800' },
  purple: { bg: 'bg-purple-600', dark: 'bg-purple-800' },
  fuchsia: { bg: 'bg-fuchsia-600', dark: 'bg-fuchsia-800' },
  pink: { bg: 'bg-pink-600', dark: 'bg-pink-800' },
  rose: { bg: 'bg-rose-600', dark: 'bg-rose-800' },
  slate: { bg: 'bg-slate-600', dark: 'bg-slate-800' },
  gray: { bg: 'bg-gray-600', dark: 'bg-gray-800' },
  stone: { bg: 'bg-stone-600', dark: 'bg-stone-800' },
};

// 預設顏色（用於 fallback hash）
const DEFAULT_COLORS = Object.values(COLOR_MAP);

function getColorByHash(id: string): { bg: string; dark: string } {
  const numId = parseInt(id, 10) || id.charCodeAt(0);
  return DEFAULT_COLORS[numId % DEFAULT_COLORS.length];
}

function getColor(id: string, cardColor?: string): { bg: string; dark: string } {
  if (cardColor && COLOR_MAP[cardColor]) {
    return COLOR_MAP[cardColor];
  }
  return getColorByHash(id);
}

export function ProductCard({
  id,
  name,
  price,
  quantity,
  isOnPromotion,
  promotionPrice,
  cardColor,
  onClick,
}: ProductCardProps) {
  const showPromoPrice = isOnPromotion && promotionPrice != null;
  const color = getColor(id, cardColor);
  const displayPrice = showPromoPrice ? promotionPrice : price;

  return (
    <div
      onClick={onClick}
      className={`
        relative h-24 sm:h-28 md:h-32 cursor-pointer transition-all duration-150
        rounded-lg overflow-hidden
        ${color.bg}
        ${quantity > 0 ? 'ring-4 ring-brand-orange shadow-xl' : ''}
        active:scale-[0.98] active:shadow-sm
        hover:shadow-lg hover:brightness-110
      `}
    >
      {/* 數量標示 - 右上角 */}
      {quantity > 0 && (
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
          <div className="min-w-6 h-6 sm:min-w-8 sm:h-8 md:min-w-9 md:h-9 px-1.5 sm:px-2 bg-brand-orange rounded-full flex items-center justify-center text-white text-xs sm:text-sm md:text-base font-bold shadow-md">
            {quantity}
          </div>
        </div>
      )}

      {/* 促銷標籤 */}
      {showPromoPrice && (
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
          <Badge className="bg-yellow-400 text-yellow-900 text-[10px] sm:text-xs px-1 sm:px-1.5 py-0 h-4 sm:h-5 flex items-center gap-0.5">
            <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            促銷
          </Badge>
        </div>
      )}

      <div className="flex flex-col h-full">
        {/* 商品名稱區 */}
        <div className="flex-1 flex items-center justify-center px-2 py-1">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white text-center leading-tight line-clamp-2">
            {name}
          </h3>
        </div>

        {/* 價格區 - 深色底條 */}
        <div className={`${color.dark} px-3 py-1.5 sm:py-2`}>
          <p className="text-base sm:text-lg md:text-xl font-bold text-white text-center">
            ${displayPrice}
            {showPromoPrice && (
              <span className="text-xs sm:text-sm text-white/60 line-through ml-2">
                ${price}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// 匯出顏色選項供後台使用
export const CARD_COLOR_OPTIONS = Object.keys(COLOR_MAP);

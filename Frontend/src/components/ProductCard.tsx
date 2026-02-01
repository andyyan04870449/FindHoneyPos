import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tag } from "lucide-react";

interface ProductCardProps {
  name: string;
  price: number;
  quantity: number;
  isOnPromotion?: boolean;
  promotionPrice?: number;
  onClick: () => void;
}

export function ProductCard({
  name,
  price,
  quantity,
  isOnPromotion,
  promotionPrice,
  onClick,
}: ProductCardProps) {
  const showPromoPrice = isOnPromotion && promotionPrice != null;

  return (
    <Card
      onClick={onClick}
      className={`
        relative p-3 sm:p-4 md:p-5 lg:p-6 h-24 sm:h-28 md:h-32 cursor-pointer transition-all duration-150
        bg-white border-2 overflow-visible
        ${quantity > 0
          ? 'border-brand-orange shadow-lg bg-orange-50/30'
          : 'border-gray-200 hover:border-brand-orange/50'
        }
        active:scale-[0.98] active:shadow-sm
        hover:shadow-lg hover:border-brand-orange/70
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

      <div className="flex flex-col justify-between h-full overflow-hidden">
        {/* 商品名稱 - 全寬顯示 */}
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 leading-snug line-clamp-2 flex-shrink-0">
          {name}
        </h3>

        {/* 價格區 */}
        {showPromoPrice ? (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mt-auto">
            <Badge className="bg-red-500 text-white text-[10px] sm:text-xs px-1 sm:px-1.5 py-0 h-4 sm:h-5 flex items-center gap-0.5 shrink-0">
              <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              促銷
            </Badge>
            <span className="text-base sm:text-lg md:text-xl font-bold text-red-600">
              NT$ {promotionPrice}
            </span>
            <span className="text-xs sm:text-sm text-gray-400 line-through">
              NT$ {price}
            </span>
          </div>
        ) : (
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-auto">
            NT$ {price}
          </p>
        )}
      </div>
    </Card>
  );
}

import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Star } from "lucide-react";

interface ProductCardProps {
  name: string;
  price: number;
  quantity: number;
  isPopular?: boolean;
  onClick: () => void;
}

export function ProductCard({
  name,
  price,
  quantity,
  isPopular,
  onClick,
}: ProductCardProps) {
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
      {/* 熱門標籤 - 放在右上角內部 */}
      {isPopular && (
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
          <Badge className="bg-red-500 text-white text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 sm:py-1 h-5 sm:h-6 md:h-7 flex items-center gap-0.5 sm:gap-1 shadow-md">
            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 fill-current" />
            熱門
          </Badge>
        </div>
      )}

      {/* 數量標示 - 放在左上角內部 */}
      {quantity > 0 && (
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
          <div className="min-w-6 h-6 sm:min-w-8 sm:h-8 md:min-w-9 md:h-9 px-1.5 sm:px-2 bg-brand-orange rounded-full flex items-center justify-center text-white text-xs sm:text-sm md:text-base font-bold shadow-md">
            {quantity}
          </div>
        </div>
      )}

      <div className="flex flex-col justify-center h-full">
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 leading-snug line-clamp-2 mb-1 sm:mb-2">
          {name}
        </h3>
        <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
          NT$ {price}
        </p>
      </div>
    </Card>
  );
}

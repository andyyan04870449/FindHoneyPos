import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Star } from "lucide-react";
import { logger } from "../utils/logger";

interface ProductCardProps {
  name: string;
  price: number;
  quantity: number;
  isPopular?: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
}

export function ProductCard({ 
  name, 
  price, 
  quantity, 
  isPopular, 
  onIncrease, 
  onDecrease 
}: ProductCardProps) {
  
  const handleCardClick = () => {
    onIncrease();
    logger.userAction('加入購物車', { productName: name, newQuantity: quantity + 1 });
  };

  return (
    <Card 
      onClick={handleCardClick}
      className={`
        relative p-6 h-36 cursor-pointer transition-all duration-150
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
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-red-500 text-white text-sm px-2 py-1 h-6 flex items-center gap-1 shadow-md">
            <Star className="h-3 w-3 fill-current" />
            熱門
          </Badge>
        </div>
      )}

      {/* 數量標示 - 放在左上角內部 */}
      {quantity > 0 && (
        <div className="absolute top-2 left-2 z-10">
          <div className="min-w-8 h-8 px-2 bg-brand-orange rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
            {quantity}
          </div>
        </div>
      )}

      <div className="flex flex-col justify-center h-full">
        <h3 className="text-lg font-semibold text-gray-900 leading-snug line-clamp-2 mb-2">
          {name}
        </h3>
        <p className="text-2xl font-bold text-gray-900">
          NT$ {price}
        </p>
      </div>
    </Card>
  );
}
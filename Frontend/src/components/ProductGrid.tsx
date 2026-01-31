import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './ui/input';
import { ProductCard } from './ProductCard';
import { logger } from '../utils/logger';
import type { Product } from '../types';

interface ProductGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  getProductQuantity: (productId: string) => number;
}

export function ProductGrid({
  products,
  onProductClick,
  getProductQuantity,
}: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const safeProducts = Array.isArray(products) ? products : [];

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return safeProducts;

    const term = searchTerm.toLowerCase();
    const filtered = safeProducts.filter(product =>
      product.name.toLowerCase().includes(term) ||
      product.id.toLowerCase().includes(term)
    );

    logger.debug('商品搜尋', { searchTerm, resultCount: filtered.length });
    return filtered;
  }, [safeProducts, searchTerm]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      logger.userAction('搜尋商品', { searchTerm: value });
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    logger.userAction('清除搜尋');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 搜尋列 - 固定在頂部 */}
      <div className="shrink-0 mb-2 md:mb-3 lg:mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="搜尋商品名稱或編號..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-11 pr-11 h-10 md:h-11 lg:h-12 text-base"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* 搜尋結果提示 */}
        {searchTerm && (
          <div className="text-sm text-gray-600 mt-2">
            找到 {filteredProducts.length} 項商品
            {filteredProducts.length === 0 && (
              <span className="text-gray-500 ml-2">試試其他關鍵字</span>
            )}
          </div>
        )}
      </div>

      {/* 商品網格 - 可滾動區域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 md:gap-3 lg:gap-4 pb-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              name={product.name}
              price={product.price}
              quantity={getProductQuantity(product.id)}
              isPopular={product.isPopular}
              onClick={() => onProductClick(product)}
            />
          ))}
        </div>

        {/* 空狀態 */}
        {filteredProducts.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">找不到商品</h3>
            <p className="text-base text-gray-500">請嘗試其他關鍵字或清除搜尋條件</p>
          </div>
        )}
      </div>
    </div>
  );
}

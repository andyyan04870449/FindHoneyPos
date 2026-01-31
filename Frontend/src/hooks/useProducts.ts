import { useState, useEffect, useCallback } from 'react';
import type { Product } from '../types';
import { posApi } from '../services/api';
import { products as localProducts } from '../data/products';
import { logger } from '../utils/logger';

export function useProducts(isOnline: boolean) {
  const [products, setProducts] = useState<Product[]>(localProducts);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await posApi.getProducts();
      setProducts(Array.isArray(data) ? data : localProducts);
      logger.info('從 API 載入商品成功', { count: data.length });
    } catch (err) {
      logger.warn('從 API 載入商品失敗，使用本地資料', { error: String(err) });
      setProducts(localProducts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOnline) {
      fetchProducts();
    }
  }, [isOnline, fetchProducts]);

  return { products, loading, refetchProducts: fetchProducts };
}

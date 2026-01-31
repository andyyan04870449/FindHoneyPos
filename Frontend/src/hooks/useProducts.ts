import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { Product } from '../types';
import { posApi } from '../services/api';
import { logger } from '../utils/logger';

export function useProducts(isOnline: boolean) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await posApi.getProducts();
      setProducts(Array.isArray(data) ? data : []);
      logger.info('從 API 載入商品成功', { count: data.length });
    } catch (err) {
      logger.warn('從 API 載入商品失敗', { error: String(err) });
      toast.error('載入商品失敗，請檢查網路連線');
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

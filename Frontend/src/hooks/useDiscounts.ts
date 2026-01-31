import { useState, useEffect } from 'react';
import type { PosDiscount } from '../types';
import { posApi } from '../services/api';
import { logger } from '../utils/logger';

export function useDiscounts() {
  const [discounts, setDiscounts] = useState<PosDiscount[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    posApi
      .getActiveDiscounts()
      .then((data) => {
        setDiscounts(data);
        logger.systemEvent('從 API 載入折扣', { count: data.length, discounts: data });
        console.log('[useDiscounts] API 回傳折扣資料:', JSON.stringify(data, null, 2));
      })
      .catch((err) => {
        logger.warn('載入折扣失敗，使用空陣列（仍可自訂輸入）', { error: String(err) });
      })
      .finally(() => setLoading(false));
  }, []);

  return { discounts, loading };
}

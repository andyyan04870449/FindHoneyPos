import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { PosDiscount } from '../types';
import { posApi } from '../services/api';
import { logger } from '../utils/logger';

export function useDiscounts(isAuthenticated: boolean = true) {
  const [discounts, setDiscounts] = useState<PosDiscount[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    posApi
      .getActiveDiscounts()
      .then((data) => {
        setDiscounts(data);
        logger.systemEvent('從 API 載入折扣', { count: data.length, discounts: data });
      })
      .catch((err) => {
        logger.warn('載入折扣失敗，使用空陣列（仍可自訂輸入）', { error: String(err) });
        toast.error('載入折扣失敗，請檢查網路連線');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  return { discounts, loading };
}

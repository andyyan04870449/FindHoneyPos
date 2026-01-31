import { useState, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';
import type { Addon } from '../types';
import { posApi } from '../services/api';
import { logger } from '../utils/logger';

export function useAddons() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    posApi
      .getAddons()
      .then((data) => {
        setAddons(data);
        logger.systemEvent('從 API 載入加料', { count: data.length });
      })
      .catch((err) => {
        logger.warn('載入加料失敗', { error: String(err) });
        toast.error('載入加料失敗，請檢查網路連線');
      })
      .finally(() => setLoading(false));
  }, []);

  return { addons, loading };
}

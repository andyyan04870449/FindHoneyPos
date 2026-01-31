import { useState, useEffect } from 'react';
import type { Addon } from '../types';
import { DEFAULT_ADDONS } from '../constants';
import { posApi } from '../services/api';
import { logger } from '../utils/logger';

export function useAddons() {
  const [addons, setAddons] = useState<Addon[]>([...DEFAULT_ADDONS]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    posApi
      .getAddons()
      .then((data) => {
        if (data.length > 0) {
          setAddons(data);
          logger.systemEvent('從 API 載入加料', { count: data.length });
        }
      })
      .catch((err) => {
        logger.warn('載入加料失敗，使用本地預設', { error: String(err) });
      })
      .finally(() => setLoading(false));
  }, []);

  return { addons, loading };
}

import { useState, useEffect } from 'react';
import { posApi } from '../services/api';

export function useIncentive() {
  const [incentiveEnabled, setIncentiveEnabled] = useState(false);
  const [incentiveTarget, setIncentiveTarget] = useState(0);

  useEffect(() => {
    posApi.getIncentiveSettings()
      .then((settings) => {
        setIncentiveEnabled(settings.isEnabled);
        setIncentiveTarget(settings.dailyTarget);
      })
      .catch(() => {
        // API 失敗時保持關閉狀態
        setIncentiveEnabled(false);
        setIncentiveTarget(0);
      });
  }, []);

  return {
    incentiveEnabled,
    setIncentiveEnabled,
    incentiveTarget,
    setIncentiveTarget,
  };
}

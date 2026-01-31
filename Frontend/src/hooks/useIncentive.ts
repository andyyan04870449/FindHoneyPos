import { useState, useEffect } from 'react';
import { STORAGE_KEYS, DEFAULT_INCENTIVE_TARGET } from '../constants';

export function useIncentive() {
  const [incentiveEnabled, setIncentiveEnabled] = useState(true);
  const [incentiveTarget, setIncentiveTarget] = useState(DEFAULT_INCENTIVE_TARGET);

  // 首次載入時設置 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INCENTIVE_ENABLED, 'true');
    localStorage.setItem(STORAGE_KEYS.INCENTIVE_TARGET, String(DEFAULT_INCENTIVE_TARGET));
  }, []);

  return {
    incentiveEnabled,
    setIncentiveEnabled,
    incentiveTarget,
    setIncentiveTarget,
  };
}

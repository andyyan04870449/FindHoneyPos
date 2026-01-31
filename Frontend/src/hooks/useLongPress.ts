import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onShortPress?: () => void;
  delay?: number;
}

export function useLongPress({ 
  onLongPress, 
  onShortPress, 
  delay = 800 
}: UseLongPressOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback(() => {
    isLongPressRef.current = false;
    timeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const end = useCallback(() => {
    clear();
    if (!isLongPressRef.current && onShortPress) {
      onShortPress();
    }
  }, [clear, onShortPress]);

  return {
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: end,
    onTouchCancel: clear,
  };
}
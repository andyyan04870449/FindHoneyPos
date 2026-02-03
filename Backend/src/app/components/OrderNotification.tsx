import { useEffect, useState, useRef } from 'react';
import { X, ShoppingBag, Clock, CreditCard, Tag } from 'lucide-react';
import { Badge } from './ui/badge';
import type { Order } from '@/types';

// 音效檔案路徑
const KACHING_SOUND = '/sounds/kaching.mp3';

interface OrderNotificationProps {
  order: Order;
  index: number;
  onClose: () => void;
}

export function OrderNotification({ order, index, onClose }: OrderNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  const initialIndexRef = useRef(index); // 記錄初始 index，不隨後續變化

  // 保持 onClose 最新
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // 播放音效
    try {
      audioRef.current = new Audio(KACHING_SOUND);
      audioRef.current.volume = 0.7;
      audioRef.current.play().catch(() => {
        // 瀏覽器可能阻止自動播放，靜默處理
      });
    } catch {
      // 音效載入失敗，靜默處理
    }

    // 進入動畫
    requestAnimationFrame(() => setIsVisible(true));

    // 5秒後自動消失（只執行一次，不依賴任何外部變數）
    const timer = setTimeout(() => {
      triggerCloseInternal();
    }, 5000);

    return () => {
      clearTimeout(timer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []); // 空依賴，只在 mount 時執行一次

  const triggerCloseInternal = () => {
    // 第一階段：滑出
    setIsLeaving(true);
    // 第二階段：收縮高度（讓下面的往上移動）
    setTimeout(() => {
      setIsCollapsing(true);
      // 第三階段：移除 DOM
      setTimeout(() => onCloseRef.current(), 200);
    }, 250);
  };

  const handleClose = () => {
    triggerCloseInternal();
  };

  const time = new Date(order.timestamp).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      ref={containerRef}
      className={`
        transition-all duration-200 ease-out overflow-hidden
        ${isCollapsing ? 'max-h-0 opacity-0 mb-0' : 'max-h-[600px]'}
      `}
    >
      <div
        className={`
          w-[380px] max-w-[calc(100vw-2rem)]
          bg-white rounded-2xl shadow-2xl border border-gray-100
          transform transition-all duration-300 ease-out
          ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        `}
      >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-orange-500 to-orange-400 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white/80 text-xs font-medium">新訂單</p>
            <p className="text-white font-bold text-lg">#{order.orderNumber}</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* 時間 & 付款方式 */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" />
            <span>{order.paymentMethod}</span>
          </div>
          {order.customerTag && (
            <div className="flex items-center gap-1.5">
              <Tag className="h-4 w-4" />
              <span>{order.customerTag}</span>
            </div>
          )}
        </div>

        {/* 訂單品項 */}
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate">{item.name}</span>
                  {item.isGift && (
                    <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">招待</Badge>
                  )}
                  {item.itemDiscountLabel && !item.isGift && (
                    <Badge className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0">{item.itemDiscountLabel}</Badge>
                  )}
                </div>
                {item.addons && item.addons.length > 0 && (
                  <p className="text-xs text-orange-500 mt-0.5">
                    {item.addons.map(a => `+${a.name}`).join(' ')}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0 ml-3">
                <span className="text-sm text-gray-500">x{item.quantity}</span>
                <p className="font-semibold text-gray-900">NT$ {item.subtotal}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 金額摘要 */}
        <div className="pt-3 border-t border-gray-200 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>小計</span>
            <span>NT$ {order.subtotal}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-red-500">
              <span>
                折扣
                {order.discountType === 'percentage' && order.discountValue && (
                  <span className="text-gray-400 ml-1">({order.discountValue / 10}折)</span>
                )}
                {order.discountType === 'gift' && (
                  <span className="text-gray-400 ml-1">(招待)</span>
                )}
              </span>
              <span>- NT$ {order.discountAmount}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2">
            <span className="font-semibold text-gray-700">實收</span>
            <span className="text-2xl font-bold text-orange-500">NT$ {order.total}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 rounded-b-2xl overflow-hidden">
        <div
          className="h-full bg-orange-400 animate-shrink-width"
          style={{ animationDuration: '5s' }}
        />
      </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { X, Percent, DollarSign, Gift, Users } from "lucide-react";
import type { OrderItem, DiscountInfo, DiscountType, PosDiscount } from '../types';

const GENDER_TAGS = ['男', '女'] as const;
const AGE_TAGS = ['成人', '學生'] as const;

interface CheckoutPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: OrderItem[];
  discounts: PosDiscount[];
  onConfirmCheckout: (discountInfo: DiscountInfo) => void;
}

export function CheckoutPanel({
  open,
  onOpenChange,
  items,
  discounts,
  onConfirmCheckout
}: CheckoutPanelProps) {
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [customPercentage, setCustomPercentage] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [genderTag, setGenderTag] = useState('');
  const [ageTag, setAgeTag] = useState('');

  // 計算原始總金額
  const originalTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // 計算折扣後金額
  const calculateDiscount = (): DiscountInfo => {
    let discountAmount = 0;
    let label = '無折扣';

    if (discountType === 'percentage') {
      if (customPercentage) {
        const percentage = parseFloat(customPercentage);
        if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
          discountAmount = Math.round(originalTotal * (percentage / 100));
          label = `${percentage}折`;
        }
      }
    } else if (discountType === 'amount') {
      if (customAmount) {
        const amount = parseFloat(customAmount);
        if (!isNaN(amount) && amount >= 0) {
          discountAmount = Math.min(amount, originalTotal);
          label = `折扣 NT$ ${discountAmount}`;
        }
      }
    } else if (discountType === 'gift') {
      discountAmount = originalTotal;
      label = '整單贈送';
    }

    return {
      type: discountType,
      value: discountType === 'percentage'
        ? parseFloat(customPercentage) || 0
        : parseFloat(customAmount) || 0,
      label,
      originalTotal,
      discountAmount,
      finalTotal: Math.max(0, originalTotal - discountAmount),
      customerTag: [genderTag, ageTag].filter(Boolean).join(',') || undefined,
    };
  };

  const discount = calculateDiscount();

  const quickDiscountButtons = discounts.filter(d => d.type === 'percentage');
  const quickAmountButtons = discounts.filter(d => d.type === 'amount');

  const handleQuickPercentage = (percentage: number) => {
    setCustomPercentage(percentage.toString());
  };

  const handleQuickAmount = (amount: number) => {
    setCustomAmount(amount.toString());
  };

  const handleConfirm = () => {
    onConfirmCheckout(discount);
    onOpenChange(false);
    // 重置狀態
    setCustomPercentage('');
    setCustomAmount('');
    setDiscountType('percentage');
    setGenderTag('');
    setAgeTag('');
  };

  const handleCancel = () => {
    onOpenChange(false);
    // 重置狀態
    setCustomPercentage('');
    setCustomAmount('');
    setDiscountType('percentage');
    setGenderTag('');
    setAgeTag('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[98vw] w-[98vw] h-[96vh] !max-h-[96vh] overflow-hidden p-8">
        <DialogHeader>
          <DialogTitle className="text-4xl font-bold">結帳</DialogTitle>
        </DialogHeader>

        <div className="flex gap-8 h-[calc(96vh-140px)] overflow-hidden pb-4">
          {/* 左側：訂單明細 */}
          <div className="flex-1 flex flex-col min-w-0">
            <h3 className="text-2xl font-semibold mb-4">訂單明細</h3>
            <div className="bg-gray-50 rounded-xl p-6 flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.cartItemId} className="flex items-center justify-between py-4 px-4 bg-white rounded-lg">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900 truncate block text-xl">{item.name}</span>
                      {item.addons && item.addons.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.addons.map(addon => (
                            <Badge key={addon.id} variant="secondary" className="text-xs">
                              {addon.name} +{addon.price}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-8 text-lg shrink-0">
                      <span className="text-gray-600 w-28 text-right">NT$ {item.price}</span>
                      <span className="text-gray-600 w-16 text-center">x {item.quantity}</span>
                      <span className="font-semibold text-gray-900 w-32 text-right">
                        NT$ {item.price * item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-gray-700">小計</span>
                  <span className="text-3xl font-bold text-gray-900">
                    NT$ {originalTotal}
                  </span>
                </div>
                <div className="text-lg text-gray-500">
                  共 {items.reduce((sum, item) => sum + item.quantity, 0)} 項商品
                </div>
              </div>
            </div>
          </div>

          {/* 右側：折扣設定與結算 */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {/* 折扣類型選擇 */}
            <div className="mb-5">
              <h3 className="text-2xl font-semibold mb-4">折扣類型</h3>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setDiscountType('percentage')}
                  className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all active:scale-95 ${
                    discountType === 'percentage'
                      ? 'border-brand-orange bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Percent className={`h-8 w-8 ${
                    discountType === 'percentage' ? 'text-brand-orange' : 'text-gray-600'
                  }`} />
                  <span className={`text-lg font-medium ${
                    discountType === 'percentage' ? 'text-brand-orange' : 'text-gray-700'
                  }`}>
                    打折
                  </span>
                </button>

                <button
                  onClick={() => setDiscountType('amount')}
                  className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all active:scale-95 ${
                    discountType === 'amount'
                      ? 'border-brand-orange bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <DollarSign className={`h-8 w-8 ${
                    discountType === 'amount' ? 'text-brand-orange' : 'text-gray-600'
                  }`} />
                  <span className={`text-lg font-medium ${
                    discountType === 'amount' ? 'text-brand-orange' : 'text-gray-700'
                  }`}>
                    折扣金額
                  </span>
                </button>

                <button
                  onClick={() => setDiscountType('gift')}
                  className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all active:scale-95 ${
                    discountType === 'gift'
                      ? 'border-brand-orange bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Gift className={`h-8 w-8 ${
                    discountType === 'gift' ? 'text-brand-orange' : 'text-gray-600'
                  }`} />
                  <span className={`text-lg font-medium ${
                    discountType === 'gift' ? 'text-brand-orange' : 'text-gray-700'
                  }`}>
                    整單贈送
                  </span>
                </button>
              </div>
            </div>

            {/* 折扣設定區 */}
            <div className="mb-5">
              {/* 打折選項 */}
              {discountType === 'percentage' && (
                <div>
                  <h4 className="text-xl font-medium mb-3">選擇折扣</h4>
                  {quickDiscountButtons.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {quickDiscountButtons.map((btn) => (
                      <Button
                        key={btn.id}
                        variant="outline"
                        onClick={() => handleQuickPercentage(btn.value)}
                        className={`h-14 text-lg ${
                          customPercentage === btn.value.toString()
                            ? 'border-brand-orange bg-orange-50 text-brand-orange'
                            : ''
                        }`}
                      >
                        {btn.name}
                      </Button>
                    ))}
                  </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-base text-gray-600">自訂折扣（%）</label>
                    <Input
                      type="number"
                      placeholder="例如：10 代表打9折"
                      value={customPercentage}
                      onChange={(e) => setCustomPercentage(e.target.value)}
                      className="h-14 text-lg"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              )}

              {/* 折扣金額選項 */}
              {discountType === 'amount' && (
                <div>
                  <h4 className="text-xl font-medium mb-3">選擇折扣金額</h4>
                  {quickAmountButtons.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {quickAmountButtons.map((btn) => (
                      <Button
                        key={btn.id}
                        variant="outline"
                        onClick={() => handleQuickAmount(btn.value)}
                        className={`h-14 text-lg ${
                          customAmount === btn.value.toString()
                            ? 'border-brand-orange bg-orange-50 text-brand-orange'
                            : ''
                        }`}
                      >
                        {btn.name}
                      </Button>
                    ))}
                  </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-base text-gray-600">自訂折扣金額（NT$）</label>
                    <Input
                      type="number"
                      placeholder="輸入折扣金額"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="h-14 text-lg"
                      min="0"
                    />
                  </div>
                </div>
              )}

              {/* 整單贈送說明 */}
              {discountType === 'gift' && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Gift className="h-6 w-6 text-green-600" />
                    <span className="font-semibold text-green-900 text-xl">整單贈送</span>
                  </div>
                  <p className="text-lg text-green-700">
                    此訂單將免費提供給客戶，不收取任何費用。
                  </p>
                </div>
              )}
            </div>

            {/* 結算顯示 */}
            <div className="bg-gray-900 text-white rounded-xl p-6 space-y-4 mb-5">
              <div className="flex justify-between items-center text-xl">
                <span className="text-gray-300">原價</span>
                <span>NT$ {originalTotal}</span>
              </div>
              
              {discount.discountAmount > 0 && (
                <>
                  <div className="flex justify-between items-center text-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-300">折扣</span>
                      <Badge className="bg-brand-orange text-white text-base px-3 py-1">
                        {discount.label}
                      </Badge>
                    </div>
                    <span className="text-red-400">- NT$ {discount.discountAmount}</span>
                  </div>
                  <Separator className="bg-gray-700" />
                </>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-2xl font-medium">實付金額</span>
                <span className="text-5xl font-bold text-brand-orange">
                  NT$ {discount.finalTotal}
                </span>
              </div>
            </div>

            {/* 客群分析 */}
            <div className="mb-5">
              <h4 className="text-xl font-medium mb-3">客群分析</h4>
              <div className="space-y-3">
                <div className="flex gap-3">
                  {GENDER_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setGenderTag(prev => prev === tag ? '' : tag)}
                      className={`flex-1 h-16 rounded-xl border-2 text-xl font-medium transition-all active:scale-95 ${
                        genderTag === tag
                          ? 'border-brand-orange bg-orange-50 text-brand-orange'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  {AGE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setAgeTag(prev => prev === tag ? '' : tag)}
                      className={`flex-1 h-16 rounded-xl border-2 text-xl font-medium transition-all active:scale-95 ${
                        ageTag === tag
                          ? 'border-brand-orange bg-orange-50 text-brand-orange'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="flex gap-5 mt-auto">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1 h-16 text-xl border-2"
              >
                取消
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-[2] h-16 text-xl bg-brand-orange hover:bg-brand-orange-dark text-white"
                disabled={items.length === 0}
              >
                確認結帳
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export const APP_VERSION = __APP_VERSION__;
export const GIT_COMMIT = __GIT_COMMIT__;
export const BUILD_INFO = `${APP_VERSION}+${GIT_COMMIT}`;

export const PAYMENT_METHODS = ['現金', '信用卡', 'LINE Pay'] as const;

export const ORDER_STATUSES = ['completed', 'cancelled'] as const;

export const DISCOUNT_TYPES = ['percentage', 'amount', 'gift'] as const;

export const BUSINESS_HOURS = {
  start: 9,
  end: 18,
} as const;

export const CATEGORY_MAP = {
  蛋糕類: '蛋糕',
  泡芙類: '泡芙',
  餅乾類: '餅乾',
  布丁類: '布丁',
  其他: '其他',
} as const;

export const PIE_CHART_COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'] as const;

export const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  percentage: '百分比折扣',
  amount: '金額折扣',
  gift: '整單贈送',
};

export const DISCOUNT_TYPE_COLORS: Record<string, string> = {
  percentage: 'bg-orange-100 text-orange-700',
  amount: 'bg-blue-100 text-blue-700',
  gift: 'bg-purple-100 text-purple-700',
};

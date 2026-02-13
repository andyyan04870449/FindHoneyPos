import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailySettlementDialog } from '../DailySettlementDialog';
import type { ShiftResponse } from '../../types';

// Mock lucide-react icons - use factory function with importOriginal
vi.mock('lucide-react', async (importOriginal) => {
  const mod = await importOriginal<typeof import('lucide-react')>();
  return {
    ...mod,
  };
});

describe('DailySettlementDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    orders: [],
  };

  describe('金額計算邏輯', () => {
    it('折扣前金額 = netRevenue + totalDiscount（使用後端 currentShift 資料）', () => {
      // 單品免單情境：原價 300，折扣 60，實收 240
      const mockShift: ShiftResponse = {
        id: 1,
        storeId: 1,
        operatorId: 1,
        operatorName: 'Test',
        shiftNumber: 1,
        startTime: new Date().toISOString(),
        totalOrders: 1,
        totalRevenue: 300, // 後端計算的折扣前金額
        totalDiscount: 60,
        netRevenue: 240, // 實收金額
        cashAmount: 0,
        settledBy: null,
        status: 'active',
      };

      render(
        <DailySettlementDialog
          {...defaultProps}
          currentShift={mockShift}
        />
      );

      // 折扣前金額應為 300（netRevenue 240 + totalDiscount 60）
      // 不是 360（錯誤的 totalRevenue + totalDiscount）
      expect(screen.getByText('NT$ 300')).toBeInTheDocument();
    });

    it('優惠折扣顯示正確', () => {
      const mockShift: ShiftResponse = {
        id: 1,
        storeId: 1,
        operatorId: 1,
        operatorName: 'Test',
        shiftNumber: 1,
        startTime: new Date().toISOString(),
        totalOrders: 1,
        totalRevenue: 300,
        totalDiscount: 60,
        netRevenue: 240,
        cashAmount: 0,
        settledBy: null,
        status: 'active',
      };

      render(
        <DailySettlementDialog
          {...defaultProps}
          currentShift={mockShift}
        />
      );

      // 優惠折扣顯示 - NT$ 60
      expect(screen.getByText('- NT$ 60')).toBeInTheDocument();
    });

    it('應收現金 = netRevenue（實收金額）', () => {
      const mockShift: ShiftResponse = {
        id: 1,
        storeId: 1,
        operatorId: 1,
        operatorName: 'Test',
        shiftNumber: 1,
        startTime: new Date().toISOString(),
        totalOrders: 1,
        totalRevenue: 300,
        totalDiscount: 60,
        netRevenue: 240,
        cashAmount: 0,
        settledBy: null,
        status: 'active',
      };

      render(
        <DailySettlementDialog
          {...defaultProps}
          currentShift={mockShift}
        />
      );

      // 應收現金顯示 NT$ 240
      expect(screen.getByText('NT$ 240')).toBeInTheDocument();
    });

    it('無折扣情況：折扣前金額 = netRevenue', () => {
      const mockShift: ShiftResponse = {
        id: 1,
        storeId: 1,
        operatorId: 1,
        operatorName: 'Test',
        shiftNumber: 1,
        startTime: new Date().toISOString(),
        totalOrders: 2,
        totalRevenue: 500,
        totalDiscount: 0,
        netRevenue: 500,
        cashAmount: 0,
        settledBy: null,
        status: 'active',
      };

      render(
        <DailySettlementDialog
          {...defaultProps}
          currentShift={mockShift}
        />
      );

      // 折扣前金額和應收現金都是 500
      const amountElements = screen.getAllByText('NT$ 500');
      expect(amountElements.length).toBeGreaterThanOrEqual(2);
    });

    it('訂單總數顯示正確', () => {
      const mockShift: ShiftResponse = {
        id: 1,
        storeId: 1,
        operatorId: 1,
        operatorName: 'Test',
        shiftNumber: 1,
        startTime: new Date().toISOString(),
        totalOrders: 5,
        totalRevenue: 1000,
        totalDiscount: 100,
        netRevenue: 900,
        cashAmount: 0,
        settledBy: null,
        status: 'active',
      };

      render(
        <DailySettlementDialog
          {...defaultProps}
          currentShift={mockShift}
        />
      );

      expect(screen.getByText('5 筆')).toBeInTheDocument();
    });
  });
});

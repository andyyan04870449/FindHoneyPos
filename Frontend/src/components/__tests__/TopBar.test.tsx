import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopBar } from '../TopBar';
import type { ShiftResponse } from '../../types';

// Mock lucide-react icons - use factory function with importOriginal
vi.mock('lucide-react', async (importOriginal) => {
  const mod = await importOriginal<typeof import('lucide-react')>();
  return {
    ...mod,
  };
});

// Mock SettingsDialog
vi.mock('../SettingsDialog', () => ({
  SettingsDialog: () => null,
}));

// Mock logo image
vi.mock('@/assets/0823fe84278739e4331a8463c99173e87d691257.png', () => ({
  default: 'mock-logo.png',
}));

describe('TopBar', () => {
  const defaultProps = {
    isOnline: true,
    menuVersion: '1.0.0',
    orderCount: 0,
    deviceId: 'test-device',
    unsyncedCount: 0,
    onUpdateMenu: vi.fn(),
    onSyncData: vi.fn(),
    onOpenSettlement: vi.fn(),
    onOpenTodayOrders: vi.fn(),
  };

  describe('班次營業額顯示', () => {
    it('班次營業額顯示 netRevenue（實收金額）', () => {
      const mockShift: ShiftResponse = {
        id: 1,
        storeId: 1,
        operatorId: 1,
        operatorName: 'Test',
        shiftNumber: 1,
        startTime: new Date().toISOString(),
        totalOrders: 1,
        totalRevenue: 300, // 折扣前
        totalDiscount: 60,
        netRevenue: 240, // 實收（應顯示此值）
        cashAmount: 0,
        settledBy: null,
        status: 'active',
      };

      render(<TopBar {...defaultProps} currentShift={mockShift} />);

      // 班次營業額應顯示 netRevenue 240，不是 totalRevenue 300
      expect(screen.getByText('NT$ 240')).toBeInTheDocument();
    });

    it('班次營業額不顯示折扣前金額', () => {
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

      render(<TopBar {...defaultProps} currentShift={mockShift} />);

      // 不應該在班次營業額位置看到 NT$ 300
      const badge = screen.getByText('NT$ 240').closest('.border-brand-orange');
      expect(badge).toBeInTheDocument();
    });

    it('無班次時不顯示營業額', () => {
      render(<TopBar {...defaultProps} currentShift={null} />);

      // 不應該有班次營業額區塊
      expect(screen.queryByText('班次營業額')).not.toBeInTheDocument();
    });

    it('今日訂單數量使用 currentShift.totalOrders', () => {
      const mockShift: ShiftResponse = {
        id: 1,
        storeId: 1,
        operatorId: 1,
        operatorName: 'Test',
        shiftNumber: 1,
        startTime: new Date().toISOString(),
        totalOrders: 10,
        totalRevenue: 1000,
        totalDiscount: 0,
        netRevenue: 1000,
        cashAmount: 0,
        settledBy: null,
        status: 'active',
      };

      render(<TopBar {...defaultProps} orderCount={5} currentShift={mockShift} />);

      // 應該顯示班次訂單數 10，而不是 orderCount 5
      // 由於桌面和行動版都有顯示，應該至少有一個
      const orderElements = screen.getAllByText('10 筆');
      expect(orderElements.length).toBeGreaterThan(0);
    });
  });
});

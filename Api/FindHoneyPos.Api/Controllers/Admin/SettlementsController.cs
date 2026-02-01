namespace FindHoneyPos.Api.Controllers.Admin;

using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using FindHoneyPos.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/settlements")]
public class SettlementsController : ControllerBase
{
    private readonly IDailySettlementService _settlementService;
    private readonly AppDbContext _context;
    private readonly ILogger<SettlementsController> _logger;

    public SettlementsController(IDailySettlementService settlementService, AppDbContext context, ILogger<SettlementsController> logger)
    {
        _settlementService = settlementService;
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var (items, total) = await _settlementService.GetAllAsync(page, pageSize);
        var response = items.Select(s => new SettlementResponse(
            s.Id,
            s.Date.ToString("yyyy-MM-dd"),
            s.TotalOrders,
            s.TotalRevenue,
            s.TotalDiscount,
            s.NetRevenue,
            s.DeviceId,
            s.SubmittedAt,
            s.IncentiveTarget,
            s.IncentiveItemsSold,
            s.IncentiveAchieved
        ));
        return Ok(new PagedResponse<SettlementResponse>
        {
            Data = response,
            Total = total,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var settlement = await _settlementService.GetByIdAsync(id);
        if (settlement is null)
            return NotFound(ApiResponse<object>.Fail("日結紀錄不存在"));

        // 計算該結算對應時間區間的售出數量
        var soldByProduct = new Dictionary<int, int>();

        // 優先透過 Shift 取得訂單範圍
        var shift = await _context.Shifts.FirstOrDefaultAsync(s => s.SettlementId == settlement.Id);
        if (shift != null)
        {
            var shiftEnd = shift.ClosedAt ?? DateTime.UtcNow;
            soldByProduct = await _context.OrderItems
                .Include(oi => oi.Order)
                .Where(oi => oi.Order.ShiftId == shift.Id && oi.Order.Status == OrderStatus.Completed && oi.ProductId != null)
                .GroupBy(oi => oi.ProductId!.Value)
                .ToDictionaryAsync(g => g.Key, g => g.Sum(oi => oi.Quantity));
        }
        else
        {
            // 無班次：用日期區間
            var start = settlement.Date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            var end = start.AddDays(1);
            soldByProduct = await _context.OrderItems
                .Include(oi => oi.Order)
                .Where(oi => oi.Order.Timestamp >= start && oi.Order.Timestamp < end && oi.Order.Status == OrderStatus.Completed && oi.ProductId != null)
                .GroupBy(oi => oi.ProductId!.Value)
                .ToDictionaryAsync(g => g.Key, g => g.Sum(oi => oi.Quantity));
        }

        _logger.LogInformation("Settlement {Id}: shift={ShiftFound}, soldByProduct count={Count}, keys=[{Keys}]",
            id, shift != null, soldByProduct.Count, string.Join(",", soldByProduct.Select(kv => $"{kv.Key}:{kv.Value}")));

        var detail = new SettlementDetailResponse(
            settlement.Id,
            settlement.Date.ToString("yyyy-MM-dd"),
            settlement.TotalOrders,
            settlement.TotalRevenue,
            settlement.TotalDiscount,
            settlement.NetRevenue,
            settlement.DeviceId,
            settlement.SubmittedAt,
            settlement.IncentiveTarget,
            settlement.IncentiveItemsSold,
            settlement.IncentiveAchieved,
            settlement.InventoryCounts.Select(ic => new InventoryCountItem(
                ic.ProductId,
                ic.Product?.Name ?? $"商品#{ic.ProductId}",
                ic.Quantity,
                soldByProduct.GetValueOrDefault(ic.ProductId, 0)
            )).ToList()
        );
        return Ok(ApiResponse<SettlementDetailResponse>.Ok(detail));
    }
}

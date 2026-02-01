namespace FindHoneyPos.Api.Controllers.Pos;

using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize]
[Route("api/pos/inventory")]
public class InventoryController : ControllerBase
{
    private readonly IDailySettlementService _settlementService;
    private readonly IShiftService _shiftService;

    public InventoryController(IDailySettlementService settlementService, IShiftService shiftService)
    {
        _settlementService = settlementService;
        _shiftService = shiftService;
    }

    [HttpPost("settlement")]
    public async Task<IActionResult> Submit([FromBody] SubmitSettlementRequest request)
    {
        // 若有 open shift，委派給 ShiftService.CloseAsync
        var shift = await _shiftService.GetCurrentOpenAsync(request.DeviceId);
        if (shift != null)
        {
            var settlementData = new DailySettlement
            {
                InventoryCounts = request.InventoryCounts.Select(kv => new InventoryCount
                {
                    ProductId = kv.Key,
                    Quantity = kv.Value
                }).ToList(),
                IncentiveTarget = request.IncentiveTarget ?? 0,
                IncentiveItemsSold = request.IncentiveItemsSold ?? 0,
                IncentiveAchieved = request.IncentiveAchieved ?? false
            };

            var (_, result) = await _shiftService.CloseAsync(shift.Id, settlementData);
            return Ok(ApiResponse<SettlementResponse>.Ok(new SettlementResponse(
                result.Id, result.Date.ToString("yyyy-MM-dd"), result.TotalOrders,
                result.TotalRevenue, result.TotalDiscount, result.NetRevenue,
                result.DeviceId, result.SubmittedAt,
                result.IncentiveTarget, result.IncentiveItemsSold, result.IncentiveAchieved)));
        }

        // 舊邏輯（無班次時）
        var settlement = new DailySettlement
        {
            DeviceId = request.DeviceId,
            InventoryCounts = request.InventoryCounts.Select(kv => new InventoryCount
            {
                ProductId = kv.Key,
                Quantity = kv.Value
            }).ToList(),
            IncentiveTarget = request.IncentiveTarget ?? 0,
            IncentiveItemsSold = request.IncentiveItemsSold ?? 0,
            IncentiveAchieved = request.IncentiveAchieved ?? false
        };

        var legacyResult = await _settlementService.SubmitAsync(settlement);
        return Ok(ApiResponse<SettlementResponse>.Ok(new SettlementResponse(
            legacyResult.Id, legacyResult.Date.ToString("yyyy-MM-dd"), legacyResult.TotalOrders,
            legacyResult.TotalRevenue, legacyResult.TotalDiscount, legacyResult.NetRevenue,
            legacyResult.DeviceId, legacyResult.SubmittedAt,
            legacyResult.IncentiveTarget, legacyResult.IncentiveItemsSold, legacyResult.IncentiveAchieved)));
    }

    [HttpGet("today")]
    public async Task<IActionResult> GetToday()
    {
        var settlement = await _settlementService.GetTodayAsync();
        if (settlement is null)
            return Ok(ApiResponse<object>.Ok(new { settled = false }));

        return Ok(ApiResponse<object>.Ok(new
        {
            settled = true,
            data = new SettlementResponse(
                settlement.Id, settlement.Date.ToString("yyyy-MM-dd"), settlement.TotalOrders,
                settlement.TotalRevenue, settlement.TotalDiscount, settlement.NetRevenue,
                settlement.DeviceId, settlement.SubmittedAt,
                settlement.IncentiveTarget, settlement.IncentiveItemsSold, settlement.IncentiveAchieved)
        }));
    }
}

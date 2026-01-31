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

    public InventoryController(IDailySettlementService settlementService)
    {
        _settlementService = settlementService;
    }

    [HttpPost("settlement")]
    public async Task<IActionResult> Submit([FromBody] SubmitSettlementRequest request)
    {
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

        var result = await _settlementService.SubmitAsync(settlement);
        return Ok(ApiResponse<SettlementResponse>.Ok(new SettlementResponse(
            result.Id, result.Date.ToString("yyyy-MM-dd"), result.TotalOrders,
            result.TotalRevenue, result.TotalDiscount, result.NetRevenue,
            result.DeviceId, result.SubmittedAt,
            result.IncentiveTarget, result.IncentiveItemsSold, result.IncentiveAchieved)));
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

namespace FindHoneyPos.Api.Controllers.Pos;

using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize]
[Route("api/pos/shift")]
public class PosShiftController : ControllerBase
{
    private readonly IShiftService _shiftService;

    public PosShiftController(IShiftService shiftService)
    {
        _shiftService = shiftService;
    }

    [HttpPost("open")]
    public async Task<IActionResult> Open([FromBody] OpenShiftRequest request)
    {
        try
        {
            var shift = await _shiftService.OpenAsync(request.DeviceId);
            return Ok(ApiResponse<ShiftResponse>.Ok(MapToResponse(shift)));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("current")]
    public async Task<IActionResult> GetCurrent([FromQuery] string? deviceId)
    {
        var shift = await _shiftService.GetCurrentOpenAsync(deviceId);
        if (shift == null)
            return Ok(ApiResponse<ShiftStatusResponse>.Ok(new ShiftStatusResponse(false, null)));

        return Ok(ApiResponse<ShiftStatusResponse>.Ok(
            new ShiftStatusResponse(true, MapToResponse(shift))));
    }

    [HttpPost("{id}/close")]
    public async Task<IActionResult> Close(int id, [FromBody] CloseShiftRequest request)
    {
        try
        {
            var settlement = new DailySettlement
            {
                InventoryCounts = request.InventoryCounts.Select(kv => new InventoryCount
                {
                    ProductId = kv.Key,
                    Quantity = kv.Value
                }).ToList(),
                IncentiveTarget = request.IncentiveTarget ?? 0,
                IncentiveItemsSold = request.IncentiveItemsSold ?? 0,
                IncentiveAchieved = request.IncentiveAchieved ?? false,
            };

            var (shift, result) = await _shiftService.CloseAsync(id, settlement);

            return Ok(ApiResponse<object>.Ok(new
            {
                shift = MapToResponse(shift),
                settlement = new SettlementResponse(
                    result.Id, result.Date.ToString("yyyy-MM-dd"), result.TotalOrders,
                    result.TotalRevenue, result.TotalDiscount, result.NetRevenue,
                    result.DeviceId, result.SubmittedAt,
                    result.IncentiveTarget, result.IncentiveItemsSold, result.IncentiveAchieved)
            }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    private static ShiftResponse MapToResponse(Shift shift) => new(
        shift.Id,
        shift.DeviceId,
        shift.Status.ToString(),
        shift.OpenedAt,
        shift.ClosedAt,
        shift.TotalOrders,
        shift.TotalRevenue,
        shift.TotalDiscount,
        shift.NetRevenue,
        shift.SettlementId
    );
}

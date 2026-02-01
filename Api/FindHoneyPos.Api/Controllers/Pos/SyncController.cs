namespace FindHoneyPos.Api.Controllers.Pos;

using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize]
[Route("api/pos/sync")]
public class SyncController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly IShiftService _shiftService;

    public SyncController(IOrderService orderService, IShiftService shiftService)
    {
        _orderService = orderService;
        _shiftService = shiftService;
    }

    [HttpPost("orders")]
    public async Task<IActionResult> SyncOrders([FromBody] BatchSyncRequest request)
    {
        // 取第一筆的 DeviceId 查班次
        var deviceId = request.Orders.FirstOrDefault()?.Request.DeviceId;
        var shift = await _shiftService.GetCurrentOpenAsync(deviceId);

        var orderRequests = request.Orders.Select(o => o.Request);
        var orders = orderRequests.Select(r =>
        {
            var order = PosOrdersController.MapFromRequest(r);
            if (shift != null) order.ShiftId = shift.Id;
            return order;
        });
        var created = await _orderService.BatchCreateAsync(orders);

        if (shift != null)
        {
            foreach (var order in created)
                await _shiftService.UpdateStatsAsync(shift.Id, order);
        }

        return Ok(ApiResponse<object>.Ok(new { syncedCount = created.Count() }));
    }

    [HttpGet("status")]
    public IActionResult GetStatus([FromQuery] string? deviceId = null)
    {
        return Ok(ApiResponse<object>.Ok(new
        {
            connected = true,
            lastSync = DateTime.UtcNow,
            deviceId
        }));
    }
}

namespace FindHoneyPos.Api.Controllers.Pos;

using System.Security.Claims;
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
        var userId = GetCurrentUserId();
        Shift? shift = null;
        if (userId != null)
        {
            shift = await _shiftService.GetCurrentOpenAsync(userId.Value);
        }

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
    public IActionResult GetStatus()
    {
        return Ok(ApiResponse<object>.Ok(new
        {
            connected = true,
            lastSync = DateTime.UtcNow
        }));
    }

    private int? GetCurrentUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value;
        return int.TryParse(sub, out var id) ? id : null;
    }
}

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

    public SyncController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpPost("orders")]
    public async Task<IActionResult> SyncOrders([FromBody] BatchSyncRequest request)
    {
        var orderRequests = request.Orders.Select(o => o.Request);
        var orders = orderRequests.Select(PosOrdersController.MapFromRequest);
        var created = await _orderService.BatchCreateAsync(orders);
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

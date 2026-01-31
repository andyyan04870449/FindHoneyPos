namespace FindHoneyPos.Api.Controllers.Admin;

using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Constants;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize]
[Route("api/admin/orders")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        OrderStatus? statusEnum = null;
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, true, out var s))
            statusEnum = s;

        var (orders, total) = await _orderService.GetAllAsync(statusEnum, startDate, endDate, page, pageSize);
        var response = orders.Select(o => MapOrder(o));
        return Ok(new PagedResponse<OrderResponse> { Data = response, Total = total, Page = page, PageSize = pageSize });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await _orderService.GetByIdAsync(id);
        if (order is null) return NotFound(ApiResponse<object>.Fail("訂單不存在"));
        return Ok(ApiResponse<OrderResponse>.Ok(MapOrder(order)));
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
        => Ok(ApiResponse<object>.Ok(await _orderService.GetStatsAsync()));

    private static OrderResponse MapOrder(Core.Entities.Order o) => new(
        o.Id,
        o.OrderNumber,
        o.Timestamp,
        o.Items.Select(i => new OrderItemResponse(
            i.ProductName,
            i.Price,
            i.Quantity,
            i.Subtotal,
            i.Addons.Select(a => new OrderItemAddonResponse(a.ProductName, a.Price)).ToList()
        )).ToList(),
        o.Subtotal,
        o.DiscountAmount,
        o.DiscountType?.ToString()?.ToLower(),
        o.DiscountValue,
        o.Total,
        o.Status.ToString().ToLower(),
        PaymentMethodMapping.ToDisplay(o.PaymentMethod),
        o.CustomerTag
    );
}

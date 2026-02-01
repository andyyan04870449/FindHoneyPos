namespace FindHoneyPos.Api.Controllers.Pos;

using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Constants;
using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize]
[Route("api/pos/orders")]
public class PosOrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly IShiftService _shiftService;

    public PosOrdersController(IOrderService orderService, IShiftService shiftService)
    {
        _orderService = orderService;
        _shiftService = shiftService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest request)
    {
        var shift = await _shiftService.GetCurrentOpenAsync(request.DeviceId);
        if (shift == null)
            return BadRequest(ApiResponse<object>.Fail("尚未開班，請先開班再建立訂單"));

        var order = MapFromRequest(request);
        order.ShiftId = shift.Id;
        var created = await _orderService.CreateAsync(order);
        await _shiftService.UpdateStatsAsync(shift.Id, created);

        return CreatedAtAction(nameof(Create), ApiResponse<object>.Ok(new
        {
            orderId = created.Id.ToString(),
            orderNumber = created.DailySequence,
            total = created.Total
        }));
    }

    [HttpPost("batch")]
    public async Task<IActionResult> BatchCreate([FromBody] BatchOrdersRequest request)
    {
        // 取第一筆的 DeviceId 查班次
        var deviceId = request.Orders.FirstOrDefault()?.DeviceId;
        var shift = await _shiftService.GetCurrentOpenAsync(deviceId);
        if (shift == null)
            return BadRequest(ApiResponse<object>.Fail("尚未開班，請先開班再建立訂單"));

        var orders = request.Orders.Select(r =>
        {
            var order = MapFromRequest(r);
            order.ShiftId = shift.Id;
            return order;
        });
        var created = await _orderService.BatchCreateAsync(orders);

        foreach (var order in created)
            await _shiftService.UpdateStatsAsync(shift.Id, order);

        return Ok(ApiResponse<object>.Ok(new { synced = created.Count() }));
    }

    internal static Order MapFromRequest(CreateOrderRequest request)
    {
        var items = request.Items.Select(i =>
        {
            var addons = i.Addons?.Select(a => new OrderItemAddon
            {
                ProductId = a.ProductId,
                ProductName = a.ProductName,
                Price = a.Price,
            }).ToList() ?? new List<OrderItemAddon>();

            var addonTotal = addons.Sum(a => a.Price);

            return new OrderItem
            {
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                Price = i.Price,
                Quantity = i.Quantity,
                Subtotal = (i.Price + addonTotal) * i.Quantity,
                Addons = addons,
            };
        }).ToList();

        var subtotal = items.Sum(i => i.Subtotal);
        DiscountType? discountType = null;
        if (!string.IsNullOrEmpty(request.DiscountType))
        {
            discountType = request.DiscountType.ToLower() switch
            {
                "percentage" => Core.Enums.DiscountType.Percentage,
                "amount" or "fixed" => Core.Enums.DiscountType.Amount,
                "gift" or "free" => Core.Enums.DiscountType.Gift,
                _ => null
            };
        }

        var total = subtotal - request.DiscountAmount;
        if (discountType == Core.Enums.DiscountType.Gift) total = 0;

        return new Order
        {
            DeviceId = request.DeviceId,
            Subtotal = subtotal,
            DiscountAmount = request.DiscountAmount,
            DiscountType = discountType,
            DiscountValue = request.DiscountValue,
            Total = Math.Max(0, total),
            PaymentMethod = PaymentMethodMapping.FromDisplay(request.PaymentMethod),
            Timestamp = request.Timestamp ?? DateTime.UtcNow,
            CustomerTag = request.CustomerTag,
            Items = items,
        };
    }
}

namespace FindHoneyPos.Api.Controllers.Admin;

using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize]
[Route("api/admin/discounts")]
public class DiscountsController : ControllerBase
{
    private readonly IDiscountService _discountService;

    public DiscountsController(IDiscountService discountService)
    {
        _discountService = discountService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var discounts = await _discountService.GetAllAsync();
        return Ok(ApiResponse<IEnumerable<DiscountResponse>>.Ok(discounts.Select(MapDiscount)));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDiscountRequest request)
    {
        var discount = new Discount
        {
            Name = request.Name,
            Type = Enum.Parse<DiscountType>(request.Type, true),
            Value = request.Value,
            MinPurchase = request.MinPurchase,
            IsActive = request.IsActive,
            Description = request.Description,
        };
        var created = await _discountService.CreateAsync(discount);
        return CreatedAtAction(nameof(GetAll), ApiResponse<DiscountResponse>.Ok(MapDiscount(created)));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDiscountRequest request)
    {
        var discount = new Discount
        {
            Name = request.Name,
            Type = Enum.Parse<DiscountType>(request.Type, true),
            Value = request.Value,
            MinPurchase = request.MinPurchase,
            IsActive = request.IsActive,
            Description = request.Description,
        };
        var updated = await _discountService.UpdateAsync(id, discount);
        if (updated is null) return NotFound(ApiResponse<object>.Fail("折扣不存在"));
        return Ok(ApiResponse<DiscountResponse>.Ok(MapDiscount(updated)));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _discountService.DeleteAsync(id);
        if (!result) return NotFound(ApiResponse<object>.Fail("折扣不存在"));
        return Ok(ApiResponse<object>.Ok(new { deleted = true }));
    }

    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> Toggle(int id)
    {
        var d = await _discountService.ToggleAsync(id);
        if (d is null) return NotFound(ApiResponse<object>.Fail("折扣不存在"));
        return Ok(ApiResponse<DiscountResponse>.Ok(MapDiscount(d)));
    }

    private static DiscountResponse MapDiscount(Discount d) => new(
        d.Id, d.Name, d.Type.ToString().ToLower(), d.Value, d.MinPurchase, d.IsActive, d.Description, d.CreatedAt
    );
}

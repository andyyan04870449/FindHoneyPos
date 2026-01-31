namespace FindHoneyPos.Api.Controllers.Pos;

using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize]
[Route("api/pos/discounts")]
public class PosDiscountsController : ControllerBase
{
    private readonly IDiscountService _discountService;

    public PosDiscountsController(IDiscountService discountService)
    {
        _discountService = discountService;
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActive()
    {
        var discounts = await _discountService.GetActiveAsync();
        var response = discounts.Select(d => new
        {
            id = d.Id.ToString(),
            name = d.Name,
            type = d.Type.ToString().ToLower(),
            value = d.Value,
            minPurchase = d.MinPurchase,
            description = d.Description
        });
        return Ok(ApiResponse<object>.Ok(response));
    }
}

namespace FindHoneyPos.Api.Controllers.Pos;

using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize]
[Route("api/pos/products")]
public class PosProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public PosProductsController(IProductService productService)
    {
        _productService = productService;
    }

    private const string AddonCategory = "加料";

    [HttpGet]
    public async Task<IActionResult> GetActive()
    {
        var all = await _productService.GetActiveAsync();

        var products = all
            .Where(p => p.Category != AddonCategory)
            .Select(p => new { id = p.Id.ToString(), name = p.Name, price = p.Price, isOnPromotion = p.IsOnPromotion, promotionPrice = p.PromotionPrice, category = p.Category, cardColor = p.CardColor });

        return Ok(ApiResponse<IEnumerable<object>>.Ok(products));
    }

    [HttpGet("/api/pos/addons")]
    public async Task<IActionResult> GetActiveAddons()
    {
        var all = await _productService.GetActiveAsync();

        var addons = all
            .Where(p => p.Category == AddonCategory)
            .Select(p => new { id = p.Id.ToString(), name = p.Name, price = p.Price });

        return Ok(ApiResponse<IEnumerable<object>>.Ok(addons));
    }
}

namespace FindHoneyPos.Api.Controllers.Admin;

using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/recipes")]
public class RecipesController : ControllerBase
{
    private readonly IRecipeService _recipeService;

    public RecipesController(IRecipeService recipeService)
    {
        _recipeService = recipeService;
    }

    [HttpGet("products/{productId}")]
    public async Task<IActionResult> GetByProductId(int productId)
    {
        var recipes = await _recipeService.GetByProductIdAsync(productId);
        var response = recipes.Select(r => new RecipeResponse(
            r.Id,
            r.ProductId,
            r.MaterialId,
            r.Material.Name,
            r.Material.Unit,
            r.Quantity
        ));
        return Ok(ApiResponse<IEnumerable<RecipeResponse>>.Ok(response));
    }

    [HttpPut("products/{productId}")]
    public async Task<IActionResult> UpdateRecipes(int productId, [FromBody] UpdateRecipesRequest request)
    {
        try
        {
            var recipeItems = request.Recipes.Select(r => (r.MaterialId, r.Quantity));
            var recipes = await _recipeService.UpdateRecipesAsync(productId, recipeItems);
            var response = recipes.Select(r => new RecipeResponse(
                r.Id,
                r.ProductId,
                r.MaterialId,
                r.Material.Name,
                r.Material.Unit,
                r.Quantity
            ));
            return Ok(ApiResponse<IEnumerable<RecipeResponse>>.Ok(response));
        }
        catch (ArgumentException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("products-with-recipes")]
    public async Task<IActionResult> GetProductsWithRecipes()
    {
        var products = await _recipeService.GetProductsWithRecipesAsync();
        var response = products.Select(p => new ProductWithRecipesResponse(
            p.Id,
            p.Name,
            p.Category,
            p.Recipes.Select(r => new RecipeResponse(
                r.Id,
                r.ProductId,
                r.MaterialId,
                r.Material.Name,
                r.Material.Unit,
                r.Quantity
            )).ToList()
        ));
        return Ok(ApiResponse<IEnumerable<ProductWithRecipesResponse>>.Ok(response));
    }
}

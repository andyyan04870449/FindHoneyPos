namespace FindHoneyPos.Api.Controllers.Admin;

using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/products")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search = null, [FromQuery] string? category = null)
    {
        var products = await _productService.GetAllAsync(search, category);
        var response = products.Select(p => new ProductResponse(p.Id, p.Name, p.Price, p.Status.ToString(), p.IsPopular, p.Category, p.SortOrder, p.CreatedAt, p.UpdatedAt));
        return Ok(ApiResponse<IEnumerable<ProductResponse>>.Ok(response));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _productService.GetByIdAsync(id);
        if (p is null) return NotFound(ApiResponse<object>.Fail("商品不存在"));
        return Ok(ApiResponse<ProductResponse>.Ok(new ProductResponse(p.Id, p.Name, p.Price, p.Status.ToString(), p.IsPopular, p.Category, p.SortOrder, p.CreatedAt, p.UpdatedAt)));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest request)
    {
        var product = new Product
        {
            Name = request.Name,
            Price = request.Price,
            Status = Enum.Parse<ProductStatus>(request.Status, true),
            IsPopular = request.IsPopular,
            Category = request.Category,
            SortOrder = request.SortOrder,
        };
        var created = await _productService.CreateAsync(product);
        return CreatedAtAction(nameof(GetById), new { id = created.Id },
            ApiResponse<ProductResponse>.Ok(new ProductResponse(created.Id, created.Name, created.Price, created.Status.ToString(), created.IsPopular, created.Category, created.SortOrder, created.CreatedAt, created.UpdatedAt)));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductRequest request)
    {
        var product = new Product
        {
            Name = request.Name,
            Price = request.Price,
            Status = Enum.Parse<ProductStatus>(request.Status, true),
            IsPopular = request.IsPopular,
            Category = request.Category,
            SortOrder = request.SortOrder,
        };
        var updated = await _productService.UpdateAsync(id, product);
        if (updated is null) return NotFound(ApiResponse<object>.Fail("商品不存在"));
        return Ok(ApiResponse<ProductResponse>.Ok(new ProductResponse(updated.Id, updated.Name, updated.Price, updated.Status.ToString(), updated.IsPopular, updated.Category, updated.SortOrder, updated.CreatedAt, updated.UpdatedAt)));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _productService.DeleteAsync(id);
        if (!result) return NotFound(ApiResponse<object>.Fail("商品不存在"));
        return Ok(ApiResponse<object>.Ok(new { deleted = true }));
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var p = await _productService.ToggleStatusAsync(id);
        if (p is null) return NotFound(ApiResponse<object>.Fail("商品不存在"));
        return Ok(ApiResponse<ProductResponse>.Ok(new ProductResponse(p.Id, p.Name, p.Price, p.Status.ToString(), p.IsPopular, p.Category, p.SortOrder, p.CreatedAt, p.UpdatedAt)));
    }
}

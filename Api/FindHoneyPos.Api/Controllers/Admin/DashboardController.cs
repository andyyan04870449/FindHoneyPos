namespace FindHoneyPos.Api.Controllers.Admin;

using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly IMaterialService _materialService;

    public DashboardController(IDashboardService dashboardService, IMaterialService materialService)
    {
        _dashboardService = dashboardService;
        _materialService = materialService;
    }

    [HttpGet("kpi")]
    public async Task<IActionResult> GetKpi()
        => Ok(ApiResponse<object>.Ok(await _dashboardService.GetKpiAsync()));

    [HttpGet("sales-trend")]
    public async Task<IActionResult> GetSalesTrend([FromQuery] int days = 7)
        => Ok(ApiResponse<object>.Ok(await _dashboardService.GetSalesTrendAsync(days)));

    [HttpGet("top-products")]
    public async Task<IActionResult> GetTopProducts([FromQuery] int limit = 5)
        => Ok(ApiResponse<object>.Ok(await _dashboardService.GetTopProductsAsync(limit)));

    [HttpGet("addon-kpi")]
    public async Task<IActionResult> GetAddonKpi()
        => Ok(ApiResponse<object>.Ok(await _dashboardService.GetAddonKpiAsync()));

    [HttpGet("customer-tag-kpi")]
    public async Task<IActionResult> GetCustomerTagKpi()
        => Ok(ApiResponse<object>.Ok(await _dashboardService.GetCustomerTagKpiAsync()));

    [HttpGet("material-status")]
    public async Task<IActionResult> GetMaterialStatus()
        => Ok(ApiResponse<object>.Ok(await _materialService.GetMaterialStatusAsync()));

    [HttpGet("low-stock-alerts")]
    public async Task<IActionResult> GetLowStockAlerts()
    {
        var alerts = await _materialService.GetActiveAlertsAsync();
        var response = alerts.Select(a => new
        {
            a.Id,
            a.MaterialId,
            MaterialName = a.Material.Name,
            Unit = a.Material.Unit,
            a.StockLevel,
            a.AlertThreshold,
            a.CreatedAt
        });
        return Ok(ApiResponse<object>.Ok(response));
    }
}

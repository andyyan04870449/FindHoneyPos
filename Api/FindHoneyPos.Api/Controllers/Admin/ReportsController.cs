namespace FindHoneyPos.Api.Controllers.Admin;

using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize]
[Route("api/admin/reports")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    private static DateOnly ParseDate(string? date)
    {
        if (string.IsNullOrEmpty(date))
            return DateOnly.FromDateTime(DateTime.UtcNow);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return date.ToLowerInvariant() switch
        {
            "today" => today,
            "yesterday" => today.AddDays(-1),
            "week" => today.AddDays(-(int)today.DayOfWeek),
            "month" => new DateOnly(today.Year, today.Month, 1),
            _ => DateOnly.Parse(date)
        };
    }

    [HttpGet("daily")]
    public async Task<IActionResult> GetDailyReport([FromQuery] string? date = null)
    {
        var d = ParseDate(date);
        return Ok(ApiResponse<object>.Ok(await _reportService.GetDailyReportAsync(d)));
    }

    [HttpGet("hourly-sales")]
    public async Task<IActionResult> GetHourlySales([FromQuery] string? date = null)
    {
        var d = ParseDate(date);
        return Ok(ApiResponse<object>.Ok(await _reportService.GetHourlySalesAsync(d)));
    }

    [HttpGet("category-sales")]
    public async Task<IActionResult> GetCategorySales([FromQuery] string? date = null)
    {
        var d = ParseDate(date);
        return Ok(ApiResponse<object>.Ok(await _reportService.GetCategorySalesAsync(d)));
    }

    [HttpGet("payment-methods")]
    public async Task<IActionResult> GetPaymentMethods([FromQuery] string? date = null)
    {
        var d = ParseDate(date);
        return Ok(ApiResponse<object>.Ok(await _reportService.GetPaymentMethodsAsync(d)));
    }

    [HttpGet("top-products")]
    public async Task<IActionResult> GetTopProducts([FromQuery] string? date = null)
    {
        var d = ParseDate(date);
        return Ok(ApiResponse<object>.Ok(await _reportService.GetTopProductsAsync(d)));
    }

    [HttpGet("top-addons")]
    public async Task<IActionResult> GetTopAddons([FromQuery] string? date = null)
    {
        var d = ParseDate(date);
        return Ok(ApiResponse<object>.Ok(await _reportService.GetTopAddonsAsync(d)));
    }

    [HttpGet("addon-combinations")]
    public async Task<IActionResult> GetAddonCombinations([FromQuery] string? date = null)
    {
        var d = ParseDate(date);
        return Ok(ApiResponse<object>.Ok(await _reportService.GetAddonProductCombinationsAsync(d)));
    }

    [HttpGet("addon-trend")]
    public async Task<IActionResult> GetAddonTrend([FromQuery] int days = 7)
        => Ok(ApiResponse<object>.Ok(await _reportService.GetAddonRevenueTrendAsync(days)));

    [HttpGet("customer-tag-distribution")]
    public async Task<IActionResult> GetCustomerTagDistribution([FromQuery] string? date = null)
    {
        var d = ParseDate(date);
        return Ok(ApiResponse<object>.Ok(await _reportService.GetCustomerTagDistributionAsync(d)));
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export([FromQuery] string? date = null, [FromQuery] string format = "csv")
    {
        var d = ParseDate(date);
        var csv = await _reportService.ExportCsvAsync(d);
        return File(csv, "text/csv", $"report-{d:yyyy-MM-dd}.csv");
    }
}

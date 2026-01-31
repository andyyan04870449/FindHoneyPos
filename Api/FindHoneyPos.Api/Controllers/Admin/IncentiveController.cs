namespace FindHoneyPos.Api.Controllers.Admin;

using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Interfaces;
using FindHoneyPos.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/incentive")]
public class IncentiveController : ControllerBase
{
    private readonly IIncentiveService _incentiveService;
    private readonly AppDbContext _context;

    public IncentiveController(IIncentiveService incentiveService, AppDbContext context)
    {
        _incentiveService = incentiveService;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetSettings()
    {
        var settings = await _incentiveService.GetSettingsAsync();
        return Ok(ApiResponse<IncentiveSettingsResponse>.Ok(
            new IncentiveSettingsResponse(settings.IsEnabled, settings.DailyTarget, settings.UpdatedAt)));
    }

    [HttpPut]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateIncentiveSettingsRequest request)
    {
        var settings = await _incentiveService.UpdateSettingsAsync(request.IsEnabled, request.DailyTarget);
        return Ok(ApiResponse<IncentiveSettingsResponse>.Ok(
            new IncentiveSettingsResponse(settings.IsEnabled, settings.DailyTarget, settings.UpdatedAt)));
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        var history = await _context.DailySettlements
            .OrderByDescending(ds => ds.Date)
            .Take(30)
            .Select(ds => new IncentiveHistoryItem(
                ds.Id,
                ds.Date.ToString("yyyy-MM-dd"),
                ds.IncentiveTarget,
                ds.IncentiveItemsSold,
                ds.IncentiveAchieved,
                ds.SubmittedAt))
            .ToListAsync();

        return Ok(ApiResponse<List<IncentiveHistoryItem>>.Ok(history));
    }
}

namespace FindHoneyPos.Api.Controllers.Pos;

using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize]
[Route("api/pos/incentive")]
public class IncentiveController : ControllerBase
{
    private readonly IIncentiveService _incentiveService;

    public IncentiveController(IIncentiveService incentiveService)
    {
        _incentiveService = incentiveService;
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        var settings = await _incentiveService.GetSettingsAsync();
        return Ok(ApiResponse<IncentiveSettingsResponse>.Ok(
            new IncentiveSettingsResponse(settings.IsEnabled, settings.DailyTarget, settings.UpdatedAt)));
    }
}

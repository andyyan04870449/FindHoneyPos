namespace FindHoneyPos.Api.Controllers.Admin;

using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/audit-logs")]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;

    public AuditLogsController(IAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<IActionResult> GetLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? action = null)
    {
        var logs = await _auditLogService.GetLogsAsync(page, pageSize, action);
        var total = await _auditLogService.GetTotalCountAsync(action);

        var result = logs.Select(l => new AuditLogResponse(
            l.Id, l.UserId, l.Username, l.Action, l.Detail, l.IpAddress, l.CreatedAt
        ));

        return Ok(new PagedResponse<AuditLogResponse>
        {
            Data = result,
            Total = total,
            Page = page,
            PageSize = pageSize,
        });
    }
}

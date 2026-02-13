namespace FindHoneyPos.Api.Controllers.Admin;

using System.Security.Claims;
using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/admin/line-admins")]
[Authorize(Roles = "Admin")]
public class LineAdminsController : ControllerBase
{
    private readonly ILineWebhookService _lineWebhookService;

    public LineAdminsController(ILineWebhookService lineWebhookService)
    {
        _lineWebhookService = lineWebhookService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<LineAdminResponse>>>> GetAll()
    {
        var admins = await _lineWebhookService.GetAllLineAdminsAsync();
        var response = admins.Select(la => new LineAdminResponse(
            la.Id,
            la.LineUserId,
            la.DisplayName,
            la.PictureUrl,
            la.Status,
            la.ApprovedBy?.Username,
            la.ApprovedAt,
            la.CreatedAt,
            la.IsActive
        ));
        return Ok(ApiResponse<IEnumerable<LineAdminResponse>>.Ok(response));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<LineAdminResponse>>> GetById(int id)
    {
        var admin = await _lineWebhookService.GetLineAdminByIdAsync(id);
        if (admin == null)
            return NotFound(ApiResponse<LineAdminResponse>.Fail("找不到該 LINE 管理員"));

        var response = new LineAdminResponse(
            admin.Id,
            admin.LineUserId,
            admin.DisplayName,
            admin.PictureUrl,
            admin.Status,
            admin.ApprovedBy?.Username,
            admin.ApprovedAt,
            admin.CreatedAt,
            admin.IsActive
        );
        return Ok(ApiResponse<LineAdminResponse>.Ok(response));
    }

    [HttpPost("{id}/approve")]
    public async Task<ActionResult<ApiResponse<LineAdminResponse>>> Approve(int id, [FromBody] ApproveRejectRequest? request = null)
    {
        var userId = int.Parse(User.FindFirstValue("sub") ?? "0");
        var admin = await _lineWebhookService.ApproveLineAdminAsync(id, userId);

        if (admin == null)
            return NotFound(ApiResponse<LineAdminResponse>.Fail("找不到該 LINE 管理員或已處理"));

        var response = new LineAdminResponse(
            admin.Id,
            admin.LineUserId,
            admin.DisplayName,
            admin.PictureUrl,
            admin.Status,
            admin.ApprovedBy?.Username,
            admin.ApprovedAt,
            admin.CreatedAt,
            admin.IsActive
        );
        return Ok(ApiResponse<LineAdminResponse>.Ok(response));
    }

    [HttpPost("{id}/reject")]
    public async Task<ActionResult<ApiResponse<LineAdminResponse>>> Reject(int id, [FromBody] ApproveRejectRequest? request = null)
    {
        var userId = int.Parse(User.FindFirstValue("sub") ?? "0");
        var admin = await _lineWebhookService.RejectLineAdminAsync(id, userId);

        if (admin == null)
            return NotFound(ApiResponse<LineAdminResponse>.Fail("找不到該 LINE 管理員或已處理"));

        var response = new LineAdminResponse(
            admin.Id,
            admin.LineUserId,
            admin.DisplayName,
            admin.PictureUrl,
            admin.Status,
            admin.ApprovedBy?.Username,
            admin.ApprovedAt,
            admin.CreatedAt,
            admin.IsActive
        );
        return Ok(ApiResponse<LineAdminResponse>.Ok(response));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Remove(int id)
    {
        var result = await _lineWebhookService.RemoveLineAdminAsync(id);
        if (!result)
            return NotFound(ApiResponse<bool>.Fail("找不到該 LINE 管理員"));

        return Ok(ApiResponse<bool>.Ok(true, "已移除 LINE 管理員"));
    }
}

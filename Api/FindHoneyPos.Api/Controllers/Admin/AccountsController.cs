namespace FindHoneyPos.Api.Controllers.Admin;

using System.Security.Claims;
using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize]
[Route("api/admin/accounts")]
public class AccountsController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IAuditLogService _auditLogService;

    public AccountsController(IAuthService authService, IAuditLogService auditLogService)
    {
        _authService = authService;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _authService.GetAllUsersAsync();
        var result = users.Select(MapUserInfo);
        return Ok(ApiResponse<IEnumerable<UserInfo>>.Ok(result));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || request.Username.Length < 3)
            return BadRequest(ApiResponse<object>.Fail("帳號至少需要 3 個字元"));

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            return BadRequest(ApiResponse<object>.Fail("密碼至少需要 6 個字元"));

        try
        {
            var user = await _authService.CreateUserAsync(request.Username, request.Password, request.DisplayName);
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(GetCurrentUserId(), GetCurrentUsername(), AuditAction.CreateUser.ToString(),
                $"建立帳號: {user.Username}", ip);
            return Ok(ApiResponse<UserInfo>.Ok(MapUserInfo(user)));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        var user = await _authService.GetUserByIdAsync(userId.Value);
        if (user is null) return NotFound(ApiResponse<object>.Fail("使用者不存在"));
        return Ok(ApiResponse<UserInfo>.Ok(MapUserInfo(user)));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request)
    {
        var user = await _authService.UpdateUserAsync(id, request.DisplayName);
        if (user is null) return NotFound(ApiResponse<object>.Fail("使用者不存在"));

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        await _auditLogService.LogAsync(GetCurrentUserId(), GetCurrentUsername(), AuditAction.UpdateUser.ToString(),
            $"更新帳號: {user.Username}", ip);
        return Ok(ApiResponse<UserInfo>.Ok(MapUserInfo(user)));
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == id)
            return BadRequest(ApiResponse<object>.Fail("無法停用自己的帳號"));

        var user = await _authService.ToggleUserStatusAsync(id);
        if (user is null) return NotFound(ApiResponse<object>.Fail("使用者不存在"));

        var action = user.IsActive ? AuditAction.EnableUser : AuditAction.DisableUser;
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        await _auditLogService.LogAsync(GetCurrentUserId(), GetCurrentUsername(), action.ToString(),
            $"{(user.IsActive ? "啟用" : "停用")}帳號: {user.Username}", ip);
        return Ok(ApiResponse<UserInfo>.Ok(MapUserInfo(user)));
    }

    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            return BadRequest(ApiResponse<object>.Fail("密碼至少需要 6 個字元"));

        var username = await _authService.ResetPasswordAsync(id, request.NewPassword);
        if (username is null) return NotFound(ApiResponse<object>.Fail("使用者不存在"));

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        await _auditLogService.LogAsync(GetCurrentUserId(), GetCurrentUsername(), AuditAction.ResetPassword.ToString(),
            $"重設密碼: {username}", ip);
        return Ok(ApiResponse<object>.Ok(new { success = true }));
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            return BadRequest(ApiResponse<object>.Fail("新密碼至少需要 6 個字元"));

        var result = await _authService.ChangePasswordAsync(userId.Value, request.CurrentPassword, request.NewPassword);
        if (!result)
            return BadRequest(ApiResponse<object>.Fail("目前密碼錯誤"));

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        await _auditLogService.LogAsync(userId, GetCurrentUsername(), AuditAction.ChangePassword.ToString(), null, ip);
        return Ok(ApiResponse<object>.Ok(new { success = true }));
    }

    private int? GetCurrentUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value;
        return int.TryParse(sub, out var id) ? id : null;
    }

    private string GetCurrentUsername()
    {
        return User.FindFirst("username")?.Value ?? "unknown";
    }

    private static UserInfo MapUserInfo(Core.Entities.AdminUser user) => new(
        user.Id, user.Username, user.DisplayName, user.IsActive, user.CreatedAt, user.LastLoginAt
    );
}

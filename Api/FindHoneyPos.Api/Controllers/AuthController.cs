namespace FindHoneyPos.Api.Controllers;

using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IAuditLogService _auditLogService;

    public AuthController(IAuthService authService, IAuditLogService auditLogService)
    {
        _authService = authService;
        _auditLogService = auditLogService;
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var hasUser = await _authService.HasAnyUserAsync();
        return Ok(ApiResponse<SystemStatusResponse>.Ok(new SystemStatusResponse(hasUser)));
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (await _authService.HasAnyUserAsync())
            return BadRequest(ApiResponse<object>.Fail("系統已初始化，無法註冊"));

        if (request.Password != request.ConfirmPassword)
            return BadRequest(ApiResponse<object>.Fail("密碼不一致"));

        if (string.IsNullOrWhiteSpace(request.Username) || request.Username.Length < 3)
            return BadRequest(ApiResponse<object>.Fail("帳號至少需要 3 個字元"));

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            return BadRequest(ApiResponse<object>.Fail("密碼至少需要 6 個字元"));

        var (user, token) = await _authService.RegisterFirstUserAsync(
            request.Username, request.Password, request.DisplayName);

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        await _auditLogService.LogAsync(user.Id, user.Username, AuditAction.Register.ToString(), "首位管理員註冊", ip);

        var userInfo = MapUserInfo(user);
        return Ok(ApiResponse<AuthResponse>.Ok(new AuthResponse(token, userInfo)));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request.Username, request.Password);
        if (result is null)
            return Unauthorized(ApiResponse<object>.Fail("帳號或密碼錯誤，或帳號已停用"));

        var (user, token) = result.Value;
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        await _auditLogService.LogAsync(user.Id, user.Username, AuditAction.Login.ToString(), null, ip);

        var userInfo = MapUserInfo(user);
        return Ok(ApiResponse<AuthResponse>.Ok(new AuthResponse(token, userInfo)));
    }

    private static UserInfo MapUserInfo(Core.Entities.AdminUser user) => new(
        user.Id, user.Username, user.DisplayName, user.IsActive, user.CreatedAt, user.LastLoginAt
    );
}

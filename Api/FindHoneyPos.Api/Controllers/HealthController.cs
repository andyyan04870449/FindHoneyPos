namespace FindHoneyPos.Api.Controllers;

using Microsoft.AspNetCore.Mvc;

[ApiController]
public class HealthController : ControllerBase
{
    [HttpHead("/ping")]
    public IActionResult Ping() => Ok();

    [HttpGet("/api/health")]
    public IActionResult Health() => Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
}

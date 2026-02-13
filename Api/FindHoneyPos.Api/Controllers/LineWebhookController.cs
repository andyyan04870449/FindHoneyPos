namespace FindHoneyPos.Api.Controllers;

using FindHoneyPos.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/line")]
public class LineWebhookController : ControllerBase
{
    private readonly ILineWebhookService _lineWebhookService;
    private readonly ILogger<LineWebhookController> _logger;

    public LineWebhookController(
        ILineWebhookService lineWebhookService,
        ILogger<LineWebhookController> logger)
    {
        _lineWebhookService = lineWebhookService;
        _logger = logger;
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync();

        var signature = Request.Headers["X-Line-Signature"].FirstOrDefault() ?? string.Empty;

        try
        {
            await _lineWebhookService.HandleWebhookAsync(body, signature);
            return Ok();
        }
        catch (UnauthorizedAccessException)
        {
            _logger.LogWarning("LINE Webhook 簽名驗證失敗");
            return Unauthorized();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "處理 LINE Webhook 時發生錯誤");
            return Ok(); // LINE 期望收到 200，否則會重試
        }
    }
}

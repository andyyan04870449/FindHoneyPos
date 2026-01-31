namespace FindHoneyPos.Api.Controllers.Admin;

using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/line-settings")]
public class LineSettingsController : ControllerBase
{
    private readonly ILineOaService _lineOaService;

    public LineSettingsController(ILineOaService lineOaService)
    {
        _lineOaService = lineOaService;
    }

    [HttpGet]
    public async Task<IActionResult> GetSettings()
    {
        var s = await _lineOaService.GetSettingsAsync();
        return Ok(ApiResponse<LineSettingsResponse>.Ok(new LineSettingsResponse(s.ChannelId, s.ChannelSecret, s.AccessToken, s.IsConnected, s.AutoReply, s.OrderNotification, s.PromotionNotification)));
    }

    [HttpPut]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateLineSettingsRequest request)
    {
        var settings = new LineOaSetting
        {
            ChannelId = request.ChannelId,
            ChannelSecret = request.ChannelSecret,
            AccessToken = request.AccessToken,
            AutoReply = request.AutoReply,
            OrderNotification = request.OrderNotification,
            PromotionNotification = request.PromotionNotification,
        };
        var updated = await _lineOaService.UpdateSettingsAsync(settings);
        return Ok(ApiResponse<LineSettingsResponse>.Ok(new LineSettingsResponse(updated.ChannelId, updated.ChannelSecret, updated.AccessToken, updated.IsConnected, updated.AutoReply, updated.OrderNotification, updated.PromotionNotification)));
    }

    [HttpPost("test-connection")]
    public async Task<IActionResult> TestConnection()
    {
        var result = await _lineOaService.TestConnectionAsync();
        return Ok(ApiResponse<object>.Ok(new { connected = result }));
    }

    [HttpGet("templates")]
    public async Task<IActionResult> GetTemplates()
    {
        var templates = await _lineOaService.GetTemplatesAsync();
        return Ok(ApiResponse<IEnumerable<TemplateResponse>>.Ok(templates.Select(t => new TemplateResponse(t.Id, t.Name, t.Type, t.Content, t.IsActive))));
    }

    [HttpPut("templates/{id}")]
    public async Task<IActionResult> UpdateTemplate(int id, [FromBody] UpdateTemplateRequest request)
    {
        var template = new MessageTemplate { Name = request.Name, Type = request.Type, Content = request.Content, IsActive = request.IsActive };
        var updated = await _lineOaService.UpdateTemplateAsync(id, template);
        if (updated is null) return NotFound(ApiResponse<object>.Fail("模板不存在"));
        return Ok(ApiResponse<TemplateResponse>.Ok(new TemplateResponse(updated.Id, updated.Name, updated.Type, updated.Content, updated.IsActive)));
    }

    [HttpPatch("templates/{id}/toggle")]
    public async Task<IActionResult> ToggleTemplate(int id)
    {
        var t = await _lineOaService.ToggleTemplateAsync(id);
        if (t is null) return NotFound(ApiResponse<object>.Fail("模板不存在"));
        return Ok(ApiResponse<TemplateResponse>.Ok(new TemplateResponse(t.Id, t.Name, t.Type, t.Content, t.IsActive)));
    }

    [HttpPost("broadcast")]
    public async Task<IActionResult> Broadcast([FromBody] BroadcastRequest request)
    {
        var history = await _lineOaService.BroadcastAsync(request.Message, request.TemplateId);
        return Ok(ApiResponse<BroadcastHistoryResponse>.Ok(new BroadcastHistoryResponse(history.Id, history.TemplateId, null, history.Message, history.SentAt, history.Status)));
    }

    [HttpGet("broadcast-history")]
    public async Task<IActionResult> GetBroadcastHistory()
    {
        var histories = await _lineOaService.GetBroadcastHistoryAsync();
        return Ok(ApiResponse<IEnumerable<BroadcastHistoryResponse>>.Ok(histories.Select(h => new BroadcastHistoryResponse(h.Id, h.TemplateId, h.Template?.Name, h.Message, h.SentAt, h.Status))));
    }
}

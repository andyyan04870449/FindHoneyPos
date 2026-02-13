namespace FindHoneyPos.Infrastructure.Services;

using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using FindHoneyPos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

public class LineWebhookService : ILineWebhookService
{
    private readonly AppDbContext _context;
    private readonly HttpClient _httpClient;
    private readonly ILogger<LineWebhookService> _logger;
    private const string LinePushApiUrl = "https://api.line.me/v2/bot/message/push";
    private const string LineProfileApiUrl = "https://api.line.me/v2/bot/profile/";

    // 快取 LINE 設定
    private LineOaSetting? _cachedSettings;
    private DateTime _cacheExpiry = DateTime.MinValue;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    public LineWebhookService(
        AppDbContext context,
        HttpClient httpClient,
        ILogger<LineWebhookService> logger)
    {
        _context = context;
        _httpClient = httpClient;
        _logger = logger;
    }

    private async Task<LineOaSetting?> GetLineOaSettingsAsync()
    {
        // 使用快取避免每次都查詢資料庫
        if (_cachedSettings != null && DateTime.UtcNow < _cacheExpiry)
        {
            return _cachedSettings;
        }

        _cachedSettings = await _context.LineOaSettings.FirstOrDefaultAsync();
        _cacheExpiry = DateTime.UtcNow.Add(CacheDuration);

        if (_cachedSettings == null)
        {
            _logger.LogWarning("未找到 LINE OA 設定");
        }

        return _cachedSettings;
    }

    public async Task HandleWebhookAsync(string body, string signature)
    {
        // 驗證簽名
        if (!await ValidateSignatureAsync(body, signature))
        {
            _logger.LogWarning("LINE Webhook 簽名驗證失敗");
            throw new UnauthorizedAccessException("Invalid signature");
        }

        var events = ParseEvents(body);
        foreach (var evt in events)
        {
            await ProcessEventAsync(evt);
        }
    }

    private async Task<bool> ValidateSignatureAsync(string body, string signature)
    {
        var settings = await GetLineOaSettingsAsync();
        var channelSecret = settings?.ChannelSecret;

        if (string.IsNullOrEmpty(channelSecret))
        {
            _logger.LogWarning("未設定 LINE Channel Secret，跳過簽名驗證（開發模式）");
            return true; // 開發模式
        }

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(channelSecret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(body));
        var expected = Convert.ToBase64String(hash);
        return expected == signature;
    }

    private List<LineEvent> ParseEvents(string body)
    {
        var result = new List<LineEvent>();
        try
        {
            using var doc = JsonDocument.Parse(body);
            var events = doc.RootElement.GetProperty("events");
            foreach (var evt in events.EnumerateArray())
            {
                var type = evt.GetProperty("type").GetString();
                if (type != "message") continue;

                var messageType = evt.GetProperty("message").GetProperty("type").GetString();
                if (messageType != "text") continue;

                result.Add(new LineEvent
                {
                    UserId = evt.GetProperty("source").GetProperty("userId").GetString() ?? string.Empty,
                    ReplyToken = evt.GetProperty("replyToken").GetString() ?? string.Empty,
                    Text = evt.GetProperty("message").GetProperty("text").GetString() ?? string.Empty
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "解析 LINE Webhook 事件失敗");
        }
        return result;
    }

    private async Task ProcessEventAsync(LineEvent evt)
    {
        var text = evt.Text.Trim().ToLower();

        if (text == "/auth")
        {
            await HandleAuthCommandAsync(evt);
        }
    }

    private async Task HandleAuthCommandAsync(LineEvent evt)
    {
        // 檢查是否已是管理員
        var existing = await _context.LineAdmins
            .FirstOrDefaultAsync(la => la.LineUserId == evt.UserId);

        if (existing != null)
        {
            var statusMsg = existing.Status switch
            {
                LineAdminStatus.Approved => "您已是 LINE 管理員",
                LineAdminStatus.Pending => "您的申請正在審核中，請等待管理員核可",
                LineAdminStatus.Rejected => "您的申請已被拒絕",
                _ => "狀態未知"
            };
            await SendPushMessageAsync(evt.UserId, statusMsg);
            return;
        }

        // 取得 LINE 用戶資料
        var profile = await GetLineProfileAsync(evt.UserId);

        // 建立新申請
        var lineAdmin = new LineAdmin
        {
            LineUserId = evt.UserId,
            DisplayName = profile?.DisplayName,
            PictureUrl = profile?.PictureUrl,
            Status = LineAdminStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.LineAdmins.Add(lineAdmin);
        await _context.SaveChangesAsync();

        _logger.LogInformation("新的 LINE 管理員申請: {UserId} ({DisplayName})", evt.UserId, profile?.DisplayName ?? "未知");
        await SendPushMessageAsync(evt.UserId, "您的管理員申請已送出，請等待管理員核可");
    }

    private async Task<LineProfile?> GetLineProfileAsync(string userId)
    {
        var settings = await GetLineOaSettingsAsync();
        var accessToken = settings?.AccessToken;

        if (string.IsNullOrEmpty(accessToken))
        {
            _logger.LogWarning("未設定 LINE Channel Access Token，無法取得用戶資料");
            return null;
        }

        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, $"{LineProfileApiUrl}{userId}");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var profile = JsonSerializer.Deserialize<LineProfile>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                _logger.LogInformation("取得 LINE 用戶資料: {DisplayName}", profile?.DisplayName);
                return profile;
            }
            else
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("取得 LINE 用戶資料失敗: {StatusCode} {Error}", response.StatusCode, error);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "取得 LINE 用戶資料時發生錯誤");
        }

        return null;
    }

    private class LineProfile
    {
        public string? DisplayName { get; set; }
        public string? UserId { get; set; }
        public string? PictureUrl { get; set; }
        public string? StatusMessage { get; set; }
    }

    public async Task SendPushMessageAsync(string userId, string message)
    {
        var settings = await GetLineOaSettingsAsync();
        var accessToken = settings?.AccessToken;

        if (string.IsNullOrEmpty(accessToken))
        {
            _logger.LogWarning("未設定 LINE Channel Access Token，無法發送訊息");
            return;
        }

        var payload = new
        {
            to = userId,
            messages = new[]
            {
                new { type = "text", text = message }
            }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, LinePushApiUrl)
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        try
        {
            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogError("發送 LINE 訊息失敗: {StatusCode} {Content}", response.StatusCode, content);
            }
            else
            {
                _logger.LogInformation("成功發送 LINE 訊息給 {UserId}", userId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "發送 LINE 訊息時發生錯誤");
        }
    }

    public async Task SendAdminNotificationAsync(string message)
    {
        var admins = await _context.LineAdmins
            .Where(la => la.Status == LineAdminStatus.Approved && la.IsActive)
            .ToListAsync();

        foreach (var admin in admins)
        {
            await SendPushMessageAsync(admin.LineUserId, message);
        }

        _logger.LogInformation("已發送通知給 {Count} 位 LINE 管理員", admins.Count);
    }

    public async Task<IEnumerable<LineAdmin>> GetAllLineAdminsAsync()
    {
        return await _context.LineAdmins
            .Include(la => la.ApprovedBy)
            .OrderByDescending(la => la.CreatedAt)
            .ToListAsync();
    }

    public async Task<LineAdmin?> GetLineAdminByIdAsync(int id)
    {
        return await _context.LineAdmins
            .Include(la => la.ApprovedBy)
            .FirstOrDefaultAsync(la => la.Id == id);
    }

    public async Task<LineAdmin?> ApproveLineAdminAsync(int id, int approvedById)
    {
        var lineAdmin = await _context.LineAdmins.FindAsync(id);
        if (lineAdmin == null || lineAdmin.Status != LineAdminStatus.Pending)
            return null;

        lineAdmin.Status = LineAdminStatus.Approved;
        lineAdmin.ApprovedById = approvedById;
        lineAdmin.ApprovedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // 通知用戶
        await SendPushMessageAsync(lineAdmin.LineUserId, "恭喜！您已成為 LINE 管理員，將會收到重要營運通知");

        return lineAdmin;
    }

    public async Task<LineAdmin?> RejectLineAdminAsync(int id, int rejectedById)
    {
        var lineAdmin = await _context.LineAdmins.FindAsync(id);
        if (lineAdmin == null || lineAdmin.Status != LineAdminStatus.Pending)
            return null;

        lineAdmin.Status = LineAdminStatus.Rejected;
        lineAdmin.ApprovedById = rejectedById;
        lineAdmin.ApprovedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // 通知用戶
        await SendPushMessageAsync(lineAdmin.LineUserId, "您的管理員申請已被拒絕");

        return lineAdmin;
    }

    public async Task<bool> RemoveLineAdminAsync(int id)
    {
        var lineAdmin = await _context.LineAdmins.FindAsync(id);
        if (lineAdmin == null) return false;

        lineAdmin.IsActive = false;
        await _context.SaveChangesAsync();

        return true;
    }

    private class LineEvent
    {
        public string UserId { get; set; } = string.Empty;
        public string ReplyToken { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
    }
}

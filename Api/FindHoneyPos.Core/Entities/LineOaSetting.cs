namespace FindHoneyPos.Core.Entities;

public class LineOaSetting
{
    public int Id { get; set; }
    public string? ChannelId { get; set; }
    public string? ChannelSecret { get; set; }
    public string? AccessToken { get; set; }
    public bool IsConnected { get; set; }
    public bool AutoReply { get; set; }
    public bool OrderNotification { get; set; }
    public bool PromotionNotification { get; set; }
}

namespace FindHoneyPos.Core.Interfaces;

using FindHoneyPos.Core.Entities;

public interface ILineWebhookService
{
    Task HandleWebhookAsync(string body, string signature);
    Task SendPushMessageAsync(string userId, string message);
    Task SendAdminNotificationAsync(string message);
    Task<IEnumerable<LineAdmin>> GetAllLineAdminsAsync();
    Task<LineAdmin?> GetLineAdminByIdAsync(int id);
    Task<LineAdmin?> ApproveLineAdminAsync(int id, int approvedById);
    Task<LineAdmin?> RejectLineAdminAsync(int id, int rejectedById);
    Task<bool> RemoveLineAdminAsync(int id);
}

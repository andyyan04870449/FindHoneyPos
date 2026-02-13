namespace FindHoneyPos.Infrastructure.Data;

using FindHoneyPos.Core.Entities;
using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderItemAddon> OrderItemAddons => Set<OrderItemAddon>();
    public DbSet<Discount> Discounts => Set<Discount>();
    public DbSet<DailySettlement> DailySettlements => Set<DailySettlement>();
    public DbSet<InventoryCount> InventoryCounts => Set<InventoryCount>();
    public DbSet<LineOaSetting> LineOaSettings => Set<LineOaSetting>();
    public DbSet<MessageTemplate> MessageTemplates => Set<MessageTemplate>();
    public DbSet<BroadcastHistory> BroadcastHistories => Set<BroadcastHistory>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<IncentiveSetting> IncentiveSettings => Set<IncentiveSetting>();
    public DbSet<Shift> Shifts => Set<Shift>();
    public DbSet<Material> Materials => Set<Material>();
    public DbSet<ProductRecipe> ProductRecipes => Set<ProductRecipe>();
    public DbSet<MaterialStockRecord> MaterialStockRecords => Set<MaterialStockRecord>();
    public DbSet<MaterialAlert> MaterialAlerts => Set<MaterialAlert>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}

namespace FindHoneyPos.Infrastructure.Data.Configurations;

using FindHoneyPos.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class InventoryCountConfiguration : IEntityTypeConfiguration<InventoryCount>
{
    public void Configure(EntityTypeBuilder<InventoryCount> builder)
    {
        builder.ToTable("InventoryCounts");
        builder.HasKey(ic => ic.Id);
        builder.HasOne(ic => ic.Settlement).WithMany(ds => ds.InventoryCounts).HasForeignKey(ic => ic.SettlementId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(ic => ic.Product).WithMany(p => p.InventoryCounts).HasForeignKey(ic => ic.ProductId).OnDelete(DeleteBehavior.Restrict);
    }
}

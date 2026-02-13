namespace FindHoneyPos.Infrastructure.Data.Configurations;

using FindHoneyPos.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class MaterialAlertConfiguration : IEntityTypeConfiguration<MaterialAlert>
{
    public void Configure(EntityTypeBuilder<MaterialAlert> builder)
    {
        builder.ToTable("MaterialAlerts");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.StockLevel).HasPrecision(18, 4);
        builder.Property(a => a.AlertThreshold).HasPrecision(18, 4);

        builder.HasOne(a => a.Material)
            .WithMany(m => m.Alerts)
            .HasForeignKey(a => a.MaterialId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(a => a.MaterialId);
        builder.HasIndex(a => a.IsResolved);
        builder.HasIndex(a => a.CreatedAt);
    }
}

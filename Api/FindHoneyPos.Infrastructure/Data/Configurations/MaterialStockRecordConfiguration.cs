namespace FindHoneyPos.Infrastructure.Data.Configurations;

using FindHoneyPos.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class MaterialStockRecordConfiguration : IEntityTypeConfiguration<MaterialStockRecord>
{
    public void Configure(EntityTypeBuilder<MaterialStockRecord> builder)
    {
        builder.ToTable("MaterialStockRecords");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.ChangeType).HasConversion<string>().HasMaxLength(20);
        builder.Property(r => r.Quantity).HasPrecision(18, 4);
        builder.Property(r => r.StockBefore).HasPrecision(18, 4);
        builder.Property(r => r.StockAfter).HasPrecision(18, 4);
        builder.Property(r => r.Note).HasMaxLength(500);

        builder.HasOne(r => r.Material)
            .WithMany(m => m.StockRecords)
            .HasForeignKey(r => r.MaterialId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Order)
            .WithMany()
            .HasForeignKey(r => r.OrderId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(r => r.MaterialId);
        builder.HasIndex(r => r.CreatedAt);
        builder.HasIndex(r => r.ChangeType);
    }
}

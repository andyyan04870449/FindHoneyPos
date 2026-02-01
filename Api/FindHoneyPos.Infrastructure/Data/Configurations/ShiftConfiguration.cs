namespace FindHoneyPos.Infrastructure.Data.Configurations;

using FindHoneyPos.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class ShiftConfiguration : IEntityTypeConfiguration<Shift>
{
    public void Configure(EntityTypeBuilder<Shift> builder)
    {
        builder.ToTable("Shifts");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.DeviceId).HasMaxLength(50);
        builder.Property(s => s.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(s => s.TotalRevenue).HasPrecision(12, 2);
        builder.Property(s => s.TotalDiscount).HasPrecision(12, 2);
        builder.Property(s => s.NetRevenue).HasPrecision(12, 2);

        builder.HasIndex(s => s.Status);
        builder.HasIndex(s => s.OpenedAt);
        builder.HasIndex(s => new { s.DeviceId, s.Status });

        // 1:1 FK → DailySettlement
        builder.HasOne(s => s.Settlement)
            .WithOne(ds => ds.Shift)
            .HasForeignKey<Shift>(s => s.SettlementId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

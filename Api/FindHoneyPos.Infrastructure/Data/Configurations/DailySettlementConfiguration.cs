namespace FindHoneyPos.Infrastructure.Data.Configurations;

using FindHoneyPos.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class DailySettlementConfiguration : IEntityTypeConfiguration<DailySettlement>
{
    public void Configure(EntityTypeBuilder<DailySettlement> builder)
    {
        builder.ToTable("DailySettlements");
        builder.HasKey(ds => ds.Id);
        builder.Property(ds => ds.TotalRevenue).HasPrecision(12, 2);
        builder.Property(ds => ds.TotalDiscount).HasPrecision(12, 2);
        builder.Property(ds => ds.NetRevenue).HasPrecision(12, 2);
        builder.Property(ds => ds.DeviceId).HasMaxLength(50);
        builder.HasIndex(ds => ds.Date).IsUnique();
    }
}

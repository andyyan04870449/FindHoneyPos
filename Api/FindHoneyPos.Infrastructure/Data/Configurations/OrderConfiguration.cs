namespace FindHoneyPos.Infrastructure.Data.Configurations;

using FindHoneyPos.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");
        builder.HasKey(o => o.Id);
        builder.Property(o => o.OrderNumber).IsRequired().HasMaxLength(20);
        builder.Property(o => o.DeviceId).HasMaxLength(50);
        builder.Property(o => o.Subtotal).HasPrecision(10, 2);
        builder.Property(o => o.DiscountAmount).HasPrecision(10, 2);
        builder.Property(o => o.DiscountType).HasConversion<string?>().HasMaxLength(20);
        builder.Property(o => o.DiscountValue).HasPrecision(10, 2);
        builder.Property(o => o.Total).HasPrecision(10, 2);
        builder.Property(o => o.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(o => o.PaymentMethod).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(o => o.OrderNumber);
        builder.HasIndex(o => o.Timestamp);
        builder.HasIndex(o => new { o.DeviceId, o.Timestamp });

        // Shift FK
        builder.HasOne(o => o.Shift)
            .WithMany(s => s.Orders)
            .HasForeignKey(o => o.ShiftId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(o => o.ShiftId);
    }
}

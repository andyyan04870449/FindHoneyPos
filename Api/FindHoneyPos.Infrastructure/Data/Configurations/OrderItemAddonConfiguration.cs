namespace FindHoneyPos.Infrastructure.Data.Configurations;

using FindHoneyPos.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class OrderItemAddonConfiguration : IEntityTypeConfiguration<OrderItemAddon>
{
    public void Configure(EntityTypeBuilder<OrderItemAddon> builder)
    {
        builder.ToTable("OrderItemAddons");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.ProductName).IsRequired().HasMaxLength(100);
        builder.Property(a => a.Price).HasPrecision(10, 2);
        builder.HasOne(a => a.OrderItem).WithMany(oi => oi.Addons).HasForeignKey(a => a.OrderItemId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(a => a.Product).WithMany().HasForeignKey(a => a.ProductId).OnDelete(DeleteBehavior.SetNull);
    }
}

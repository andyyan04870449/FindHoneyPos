namespace FindHoneyPos.Infrastructure.Data.Configurations;

using FindHoneyPos.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Name).IsRequired().HasMaxLength(100);
        builder.Property(p => p.Price).HasPrecision(10, 2);
        builder.Property(p => p.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(p => p.Category).HasMaxLength(50);
        builder.Property(p => p.IsOnPromotion).HasColumnName("IsOnPromotion");
        builder.Property(p => p.PromotionPrice).HasColumnName("PromotionPrice").HasPrecision(10, 2);
        builder.HasIndex(p => p.Status);
        builder.HasIndex(p => p.SortOrder);
    }
}

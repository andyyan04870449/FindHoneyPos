namespace FindHoneyPos.Infrastructure.Data.Configurations;

using FindHoneyPos.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class MaterialConfiguration : IEntityTypeConfiguration<Material>
{
    public void Configure(EntityTypeBuilder<Material> builder)
    {
        builder.ToTable("Materials");
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Name).IsRequired().HasMaxLength(100);
        builder.Property(m => m.Unit).IsRequired().HasMaxLength(20);
        builder.Property(m => m.CurrentStock).HasPrecision(18, 4);
        builder.Property(m => m.AlertThreshold).HasPrecision(18, 4);
        builder.Property(m => m.Status).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(m => m.Status);
        builder.HasIndex(m => m.Name);
    }
}

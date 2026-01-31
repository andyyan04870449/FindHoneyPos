namespace FindHoneyPos.Infrastructure.Data.Configurations;

using FindHoneyPos.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class AdminUserConfiguration : IEntityTypeConfiguration<AdminUser>
{
    public void Configure(EntityTypeBuilder<AdminUser> builder)
    {
        builder.ToTable("AdminUsers");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Username).IsRequired().HasMaxLength(50);
        builder.HasIndex(u => u.Username).IsUnique();
        builder.Property(u => u.PasswordHash).IsRequired().HasMaxLength(200);
        builder.Property(u => u.DisplayName).IsRequired().HasMaxLength(100);
        builder.Property(u => u.Role)
            .HasConversion<string>()
            .IsRequired()
            .HasMaxLength(20);
    }
}

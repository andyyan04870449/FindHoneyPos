namespace FindHoneyPos.Infrastructure.Data.Configurations;

using FindHoneyPos.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class LineAdminConfiguration : IEntityTypeConfiguration<LineAdmin>
{
    public void Configure(EntityTypeBuilder<LineAdmin> builder)
    {
        builder.HasKey(la => la.Id);

        builder.Property(la => la.LineUserId)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(la => la.LineUserId)
            .IsUnique();

        builder.Property(la => la.DisplayName)
            .HasMaxLength(100);

        builder.Property(la => la.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasOne(la => la.ApprovedBy)
            .WithMany()
            .HasForeignKey(la => la.ApprovedById)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

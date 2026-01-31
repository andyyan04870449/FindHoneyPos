namespace FindHoneyPos.Infrastructure.Data.Configurations;

using FindHoneyPos.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class BroadcastHistoryConfiguration : IEntityTypeConfiguration<BroadcastHistory>
{
    public void Configure(EntityTypeBuilder<BroadcastHistory> builder)
    {
        builder.ToTable("BroadcastHistories");
        builder.HasKey(bh => bh.Id);
        builder.Property(bh => bh.Message).IsRequired().HasMaxLength(2000);
        builder.Property(bh => bh.Status).IsRequired().HasMaxLength(20);
        builder.HasOne(bh => bh.Template).WithMany(mt => mt.BroadcastHistories).HasForeignKey(bh => bh.TemplateId).OnDelete(DeleteBehavior.SetNull);
    }
}

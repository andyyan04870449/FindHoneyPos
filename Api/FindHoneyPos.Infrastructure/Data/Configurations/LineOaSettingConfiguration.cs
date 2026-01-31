namespace FindHoneyPos.Infrastructure.Data.Configurations;

using FindHoneyPos.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class LineOaSettingConfiguration : IEntityTypeConfiguration<LineOaSetting>
{
    public void Configure(EntityTypeBuilder<LineOaSetting> builder)
    {
        builder.ToTable("LineOaSettings");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.ChannelId).HasMaxLength(100);
        builder.Property(s => s.ChannelSecret).HasMaxLength(200);
        builder.Property(s => s.AccessToken).HasMaxLength(500);
    }
}

namespace FindHoneyPos.Infrastructure.Data.Configurations;

using FindHoneyPos.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class IncentiveSettingConfiguration : IEntityTypeConfiguration<IncentiveSetting>
{
    public void Configure(EntityTypeBuilder<IncentiveSetting> builder)
    {
        builder.ToTable("IncentiveSettings");
        builder.HasKey(s => s.Id);
    }
}

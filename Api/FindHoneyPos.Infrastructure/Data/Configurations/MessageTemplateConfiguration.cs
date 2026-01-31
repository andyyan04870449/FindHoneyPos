namespace FindHoneyPos.Infrastructure.Data.Configurations;

using FindHoneyPos.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class MessageTemplateConfiguration : IEntityTypeConfiguration<MessageTemplate>
{
    public void Configure(EntityTypeBuilder<MessageTemplate> builder)
    {
        builder.ToTable("MessageTemplates");
        builder.HasKey(mt => mt.Id);
        builder.Property(mt => mt.Name).IsRequired().HasMaxLength(100);
        builder.Property(mt => mt.Type).IsRequired().HasMaxLength(50);
        builder.Property(mt => mt.Content).IsRequired().HasMaxLength(2000);
    }
}

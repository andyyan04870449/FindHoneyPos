namespace FindHoneyPos.Infrastructure.Data.Configurations;

using FindHoneyPos.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class ProductRecipeConfiguration : IEntityTypeConfiguration<ProductRecipe>
{
    public void Configure(EntityTypeBuilder<ProductRecipe> builder)
    {
        builder.ToTable("ProductRecipes");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Quantity).HasPrecision(18, 4);

        builder.HasOne(r => r.Product)
            .WithMany(p => p.Recipes)
            .HasForeignKey(r => r.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Material)
            .WithMany(m => m.Recipes)
            .HasForeignKey(r => r.MaterialId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => new { r.ProductId, r.MaterialId }).IsUnique();
    }
}

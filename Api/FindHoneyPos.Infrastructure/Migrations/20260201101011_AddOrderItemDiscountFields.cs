using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FindHoneyPos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderItemDiscountFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "PromotionPrice",
                table: "Products",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsGift",
                table: "OrderItems",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ItemDiscountLabel",
                table: "OrderItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "OriginalPrice",
                table: "OrderItems",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsGift",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "ItemDiscountLabel",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "OriginalPrice",
                table: "OrderItems");

            migrationBuilder.AlterColumn<decimal>(
                name: "PromotionPrice",
                table: "Products",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,2)",
                oldPrecision: 10,
                oldScale: 2,
                oldNullable: true);
        }
    }
}

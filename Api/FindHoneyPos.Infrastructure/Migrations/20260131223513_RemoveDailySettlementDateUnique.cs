using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FindHoneyPos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveDailySettlementDateUnique : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DailySettlements_Date",
                table: "DailySettlements");

            migrationBuilder.CreateIndex(
                name: "IX_DailySettlements_Date",
                table: "DailySettlements",
                column: "Date");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DailySettlements_Date",
                table: "DailySettlements");

            migrationBuilder.CreateIndex(
                name: "IX_DailySettlements_Date",
                table: "DailySettlements",
                column: "Date",
                unique: true);
        }
    }
}

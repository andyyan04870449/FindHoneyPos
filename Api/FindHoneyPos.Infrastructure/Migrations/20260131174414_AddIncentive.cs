using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FindHoneyPos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIncentive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IncentiveAchieved",
                table: "DailySettlements",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "IncentiveItemsSold",
                table: "DailySettlements",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "IncentiveTarget",
                table: "DailySettlements",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "IncentiveSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    DailyTarget = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IncentiveSettings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IncentiveSettings");

            migrationBuilder.DropColumn(
                name: "IncentiveAchieved",
                table: "DailySettlements");

            migrationBuilder.DropColumn(
                name: "IncentiveItemsSold",
                table: "DailySettlements");

            migrationBuilder.DropColumn(
                name: "IncentiveTarget",
                table: "DailySettlements");
        }
    }
}

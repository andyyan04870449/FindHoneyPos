using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FindHoneyPos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddShiftEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ShiftId",
                table: "Orders",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Shifts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DeviceId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    OpenedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ClosedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TotalOrders = table.Column<int>(type: "integer", nullable: false),
                    TotalRevenue = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    TotalDiscount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    NetRevenue = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    SettlementId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shifts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Shifts_DailySettlements_SettlementId",
                        column: x => x.SettlementId,
                        principalTable: "DailySettlements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_ShiftId",
                table: "Orders",
                column: "ShiftId");

            migrationBuilder.CreateIndex(
                name: "IX_Shifts_DeviceId_Status",
                table: "Shifts",
                columns: new[] { "DeviceId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Shifts_OpenedAt",
                table: "Shifts",
                column: "OpenedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Shifts_SettlementId",
                table: "Shifts",
                column: "SettlementId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Shifts_Status",
                table: "Shifts",
                column: "Status");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Shifts_ShiftId",
                table: "Orders",
                column: "ShiftId",
                principalTable: "Shifts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Shifts_ShiftId",
                table: "Orders");

            migrationBuilder.DropTable(
                name: "Shifts");

            migrationBuilder.DropIndex(
                name: "IX_Orders_ShiftId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ShiftId",
                table: "Orders");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FindHoneyPos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddShiftAdminUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AdminUserId",
                table: "Shifts",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Shifts_AdminUserId",
                table: "Shifts",
                column: "AdminUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Shifts_AdminUsers_AdminUserId",
                table: "Shifts",
                column: "AdminUserId",
                principalTable: "AdminUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Shifts_AdminUsers_AdminUserId",
                table: "Shifts");

            migrationBuilder.DropIndex(
                name: "IX_Shifts_AdminUserId",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "AdminUserId",
                table: "Shifts");
        }
    }
}

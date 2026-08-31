using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudTrack.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserNavigationRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_WorkItems_AssigneeId",
                schema: "tra",
                table: "WorkItems",
                column: "AssigneeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Projects_Users_OwnerId",
                schema: "tra",
                table: "Projects",
                column: "OwnerId",
                principalSchema: "mas",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkItems_Users_AssigneeId",
                schema: "tra",
                table: "WorkItems",
                column: "AssigneeId",
                principalSchema: "mas",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Projects_Users_OwnerId",
                schema: "tra",
                table: "Projects");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkItems_Users_AssigneeId",
                schema: "tra",
                table: "WorkItems");

            migrationBuilder.DropIndex(
                name: "IX_WorkItems_AssigneeId",
                schema: "tra",
                table: "WorkItems");
        }
    }
}

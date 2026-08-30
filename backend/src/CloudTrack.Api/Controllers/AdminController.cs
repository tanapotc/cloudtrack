using CloudTrack.Application.Common;
using CloudTrack.Application.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudTrack.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin")]
public sealed class AdminController(IUserManagementService userManagementService) : AuthenticatedControllerBase
{
    [HttpGet("users")]
    public async Task<ActionResult<PagedResult<ManagedUserSummary>>> Users([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
        => Ok(await userManagementService.ListUsersAsync(search, page, pageSize, cancellationToken));

    [HttpGet("roles")]
    public async Task<ActionResult<IReadOnlyCollection<RoleSummary>>> Roles(CancellationToken cancellationToken)
        => Ok(await userManagementService.ListRolesAsync(cancellationToken));

    [HttpPut("users/{userId:guid}/roles")]
    public async Task<ActionResult<ManagedUserSummary>> UpdateRoles(Guid userId, UpdateUserRolesRequest request, CancellationToken cancellationToken)
        => Ok(await userManagementService.UpdateRolesAsync(CurrentUserId, userId, request, cancellationToken));

    [HttpPut("users/{userId:guid}/status")]
    public async Task<ActionResult<ManagedUserSummary>> UpdateStatus(Guid userId, UpdateUserStatusRequest request, CancellationToken cancellationToken)
        => Ok(await userManagementService.UpdateStatusAsync(CurrentUserId, userId, request, cancellationToken));
}


using CloudTrack.Application.Common;
using CloudTrack.Application.Users;
using CloudTrack.Application.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudTrack.Api.Controllers;

[ApiController]
[Route("api/admin")]
public sealed class AdminController(IUserManagementService userManagementService) : AuthenticatedControllerBase
{
    [HttpGet("users")]
    [Authorize(Policy = PermissionNames.ReadUsers)]
    public async Task<ActionResult<PagedResult<ManagedUserSummary>>> Users([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
        => Ok(await userManagementService.ListUsersAsync(search, page, pageSize, cancellationToken));

    [HttpGet("roles")]
    [Authorize(Policy = PermissionNames.ReadUsers)]
    public async Task<ActionResult<IReadOnlyCollection<RoleSummary>>> Roles(CancellationToken cancellationToken)
        => Ok(await userManagementService.ListRolesAsync(cancellationToken));

    [HttpGet("permissions")]
    [Authorize(Policy = PermissionNames.ReadUsers)]
    public async Task<ActionResult<IReadOnlyCollection<PermissionSummary>>> Permissions(CancellationToken cancellationToken)
        => Ok(await userManagementService.ListPermissionsAsync(cancellationToken));

    [HttpPut("users/{userId:guid}/roles")]
    [Authorize(Policy = PermissionNames.ManageUsers)]
    public async Task<ActionResult<ManagedUserSummary>> UpdateRoles(Guid userId, UpdateUserRolesRequest request, CancellationToken cancellationToken)
        => Ok(await userManagementService.UpdateRolesAsync(CurrentUserId, userId, request, cancellationToken));

    [HttpPut("users/{userId:guid}/status")]
    [Authorize(Policy = PermissionNames.ManageUsers)]
    public async Task<ActionResult<ManagedUserSummary>> UpdateStatus(Guid userId, UpdateUserStatusRequest request, CancellationToken cancellationToken)
        => Ok(await userManagementService.UpdateStatusAsync(CurrentUserId, userId, request, cancellationToken));

    [HttpPut("roles/{roleId:guid}/permissions")]
    [Authorize(Policy = PermissionNames.ManageRoles)]
    public async Task<ActionResult<RoleSummary>> UpdateRolePermissions(Guid roleId, UpdateRolePermissionsRequest request, CancellationToken cancellationToken)
        => Ok(await userManagementService.UpdateRolePermissionsAsync(CurrentUserId, roleId, request, cancellationToken));
}

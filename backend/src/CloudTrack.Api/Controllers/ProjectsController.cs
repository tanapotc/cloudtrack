using CloudTrack.Application.Common;
using CloudTrack.Application.Projects;
using CloudTrack.Domain.Projects;
using CloudTrack.Application.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudTrack.Api.Controllers;

[ApiController]
[Route("api/projects")]
public sealed class ProjectsController(IProjectService projectService) : AuthenticatedControllerBase
{
    [HttpGet]
    [Authorize(Policy = PermissionNames.ReadProjects)]
    public async Task<ActionResult<PagedResult<ProjectSummary>>> List(
        [FromQuery] string? search,
        [FromQuery] ProjectStatus? status,
        [FromQuery] string sort = "updatedAt",
        [FromQuery] bool descending = true,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
        => Ok(await projectService.ListAsync(CurrentUserId, new ProjectQuery(search, status, sort, descending, page, pageSize), cancellationToken));

    [HttpGet("{projectId:guid}")]
    [Authorize(Policy = PermissionNames.ReadProjects)]
    public async Task<ActionResult<ProjectDetails>> Get(Guid projectId, CancellationToken cancellationToken)
        => Ok(await projectService.GetAsync(CurrentUserId, projectId, cancellationToken));

    [HttpPost]
    [Authorize(Policy = PermissionNames.ManageProjects)]
    public async Task<ActionResult<ProjectDetails>> Create(CreateProjectRequest request, CancellationToken cancellationToken)
    {
        var project = await projectService.CreateAsync(CurrentUserId, request, cancellationToken);
        return CreatedAtAction(nameof(Get), new { projectId = project.Id }, project);
    }

    [HttpPut("{projectId:guid}")]
    [Authorize(Policy = PermissionNames.ManageProjects)]
    public async Task<ActionResult<ProjectDetails>> Update(Guid projectId, UpdateProjectRequest request, CancellationToken cancellationToken)
        => Ok(await projectService.UpdateAsync(CurrentUserId, projectId, request, cancellationToken));

    [HttpDelete("{projectId:guid}")]
    [Authorize(Policy = PermissionNames.ManageProjects)]
    public async Task<IActionResult> Delete(Guid projectId, CancellationToken cancellationToken)
    {
        await projectService.DeleteAsync(CurrentUserId, projectId, cancellationToken);
        return NoContent();
    }

    [HttpPost("{projectId:guid}/tasks")]
    [Authorize(Policy = PermissionNames.ManageTasks)]
    public async Task<ActionResult<WorkItemSummary>> CreateTask(Guid projectId, CreateWorkItemRequest request, CancellationToken cancellationToken)
    {
        var task = await projectService.CreateWorkItemAsync(CurrentUserId, projectId, request, cancellationToken);
        return Created($"/api/projects/{projectId}/tasks/{task.Id}", task);
    }

    [HttpPut("{projectId:guid}/tasks/{taskId:guid}")]
    [Authorize(Policy = PermissionNames.ManageTasks)]
    public async Task<ActionResult<WorkItemSummary>> UpdateTask(Guid projectId, Guid taskId, UpdateWorkItemRequest request, CancellationToken cancellationToken)
        => Ok(await projectService.UpdateWorkItemAsync(CurrentUserId, projectId, taskId, request, cancellationToken));

    [HttpDelete("{projectId:guid}/tasks/{taskId:guid}")]
    [Authorize(Policy = PermissionNames.ManageTasks)]
    public async Task<IActionResult> DeleteTask(Guid projectId, Guid taskId, CancellationToken cancellationToken)
    {
        await projectService.DeleteWorkItemAsync(CurrentUserId, projectId, taskId, cancellationToken);
        return NoContent();
    }

    [HttpGet("{projectId:guid}/members")]
    [Authorize(Policy = PermissionNames.ReadProjects)]
    public async Task<ActionResult<IReadOnlyCollection<ProjectMemberSummary>>> Members(Guid projectId, CancellationToken cancellationToken)
        => Ok(await projectService.ListMembersAsync(CurrentUserId, projectId, cancellationToken));

    [HttpPost("{projectId:guid}/members")]
    [Authorize(Policy = PermissionNames.ManageProjects)]
    public async Task<ActionResult<ProjectMemberSummary>> AddMember(Guid projectId, AddProjectMemberRequest request, CancellationToken cancellationToken)
    {
        var member = await projectService.AddMemberAsync(CurrentUserId, projectId, request, cancellationToken);
        return Created($"/api/projects/{projectId}/members/{member.UserId}", member);
    }

    [HttpDelete("{projectId:guid}/members/{memberUserId:guid}")]
    [Authorize(Policy = PermissionNames.ManageProjects)]
    public async Task<IActionResult> RemoveMember(Guid projectId, Guid memberUserId, CancellationToken cancellationToken)
    {
        await projectService.RemoveMemberAsync(CurrentUserId, projectId, memberUserId, cancellationToken);
        return NoContent();
    }

    [HttpGet("{projectId:guid}/tasks/{taskId:guid}/comments")]
    [Authorize(Policy = PermissionNames.ReadProjects)]
    public async Task<ActionResult<IReadOnlyCollection<WorkItemCommentSummary>>> Comments(Guid projectId, Guid taskId, CancellationToken cancellationToken)
        => Ok(await projectService.ListCommentsAsync(CurrentUserId, projectId, taskId, cancellationToken));

    [HttpPost("{projectId:guid}/tasks/{taskId:guid}/comments")]
    [Authorize(Policy = PermissionNames.ManageComments)]
    public async Task<ActionResult<WorkItemCommentSummary>> AddComment(Guid projectId, Guid taskId, CreateWorkItemCommentRequest request, CancellationToken cancellationToken)
    {
        var comment = await projectService.CreateCommentAsync(CurrentUserId, projectId, taskId, request, cancellationToken);
        return Created($"/api/projects/{projectId}/tasks/{taskId}/comments/{comment.Id}", comment);
    }

    [HttpDelete("{projectId:guid}/tasks/{taskId:guid}/comments/{commentId:guid}")]
    [Authorize(Policy = PermissionNames.ManageComments)]
    public async Task<IActionResult> DeleteComment(Guid projectId, Guid taskId, Guid commentId, CancellationToken cancellationToken)
    {
        await projectService.DeleteCommentAsync(CurrentUserId, projectId, taskId, commentId, cancellationToken);
        return NoContent();
    }
}

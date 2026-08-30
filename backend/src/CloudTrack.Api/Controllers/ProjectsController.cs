using CloudTrack.Application.Common;
using CloudTrack.Application.Projects;
using CloudTrack.Domain.Projects;
using Microsoft.AspNetCore.Mvc;

namespace CloudTrack.Api.Controllers;

[ApiController]
[Route("api/projects")]
public sealed class ProjectsController(IProjectService projectService) : AuthenticatedControllerBase
{
    [HttpGet]
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
    public async Task<ActionResult<ProjectDetails>> Get(Guid projectId, CancellationToken cancellationToken)
        => Ok(await projectService.GetAsync(CurrentUserId, projectId, cancellationToken));

    [HttpPost]
    public async Task<ActionResult<ProjectDetails>> Create(CreateProjectRequest request, CancellationToken cancellationToken)
    {
        var project = await projectService.CreateAsync(CurrentUserId, request, cancellationToken);
        return CreatedAtAction(nameof(Get), new { projectId = project.Id }, project);
    }

    [HttpPut("{projectId:guid}")]
    public async Task<ActionResult<ProjectDetails>> Update(Guid projectId, UpdateProjectRequest request, CancellationToken cancellationToken)
        => Ok(await projectService.UpdateAsync(CurrentUserId, projectId, request, cancellationToken));

    [HttpDelete("{projectId:guid}")]
    public async Task<IActionResult> Delete(Guid projectId, CancellationToken cancellationToken)
    {
        await projectService.DeleteAsync(CurrentUserId, projectId, cancellationToken);
        return NoContent();
    }

    [HttpPost("{projectId:guid}/tasks")]
    public async Task<ActionResult<WorkItemSummary>> CreateTask(Guid projectId, CreateWorkItemRequest request, CancellationToken cancellationToken)
    {
        var task = await projectService.CreateWorkItemAsync(CurrentUserId, projectId, request, cancellationToken);
        return Created($"/api/projects/{projectId}/tasks/{task.Id}", task);
    }

    [HttpPut("{projectId:guid}/tasks/{taskId:guid}")]
    public async Task<ActionResult<WorkItemSummary>> UpdateTask(Guid projectId, Guid taskId, UpdateWorkItemRequest request, CancellationToken cancellationToken)
        => Ok(await projectService.UpdateWorkItemAsync(CurrentUserId, projectId, taskId, request, cancellationToken));

    [HttpDelete("{projectId:guid}/tasks/{taskId:guid}")]
    public async Task<IActionResult> DeleteTask(Guid projectId, Guid taskId, CancellationToken cancellationToken)
    {
        await projectService.DeleteWorkItemAsync(CurrentUserId, projectId, taskId, cancellationToken);
        return NoContent();
    }
}


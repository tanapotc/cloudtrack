using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using CloudTrack.Api.Controllers;
using CloudTrack.Application.Auth;
using CloudTrack.Application.Projects;
using CloudTrack.Domain.Projects;

namespace CloudTrack.IntegrationTests;

public sealed class CollaborationFlowTests(CloudTrackApiFactory factory) : IClassFixture<CloudTrackApiFactory>
{
    private readonly HttpClient _ownerClient = factory.CreateClient();
    private readonly HttpClient _memberClient = factory.CreateClient();

    [Fact]
    public async Task OwnerCanAddMemberAndMemberCanCommentOnTask()
    {
        var ownerEmail = $"owner-{Guid.NewGuid():N}@example.test";
        var memberEmail = $"member-{Guid.NewGuid():N}@example.test";
        await RegisterAndAuthorizeAsync(_ownerClient, ownerEmail, "Project Owner");
        await RegisterAndAuthorizeAsync(_memberClient, memberEmail, "Project Member");

        var projectResponse = await _ownerClient.PostAsJsonAsync("/api/projects", new CreateProjectRequest("Collaborative launch", "Exercise member-level authorization"));
        projectResponse.EnsureSuccessStatusCode();
        var project = await projectResponse.Content.ReadFromJsonAsync<ProjectDetails>();
        Assert.NotNull(project);

        var taskResponse = await _ownerClient.PostAsJsonAsync(
            $"/api/projects/{project.Id}/tasks",
            new CreateWorkItemRequest("Review deployment", "Add a review note", WorkItemPriority.Medium, null));
        taskResponse.EnsureSuccessStatusCode();
        var task = await taskResponse.Content.ReadFromJsonAsync<WorkItemSummary>();
        Assert.NotNull(task);

        var memberResponse = await _ownerClient.PostAsJsonAsync($"/api/projects/{project.Id}/members", new AddProjectMemberRequest(memberEmail));
        memberResponse.EnsureSuccessStatusCode();
        var member = await memberResponse.Content.ReadFromJsonAsync<ProjectMemberSummary>();
        Assert.NotNull(member);

        var visibleProject = await _memberClient.GetFromJsonAsync<ProjectDetails>($"/api/projects/{project.Id}");
        Assert.NotNull(visibleProject);
        Assert.Equal(2, visibleProject.Members.Count);

        var commentResponse = await _memberClient.PostAsJsonAsync(
            $"/api/projects/{project.Id}/tasks/{task.Id}/comments",
            new CreateWorkItemCommentRequest("The readiness probe should run before the demo."));
        commentResponse.EnsureSuccessStatusCode();
        var comment = await commentResponse.Content.ReadFromJsonAsync<WorkItemCommentSummary>();
        Assert.NotNull(comment);
        Assert.Equal("Project Member", comment.AuthorName);

        var comments = await _ownerClient.GetFromJsonAsync<IReadOnlyCollection<WorkItemCommentSummary>>(
            $"/api/projects/{project.Id}/tasks/{task.Id}/comments");
        Assert.NotNull(comments);
        Assert.Equal(comment.Id, Assert.Single(comments).Id);

        var unauthorizedRemoval = await _memberClient.DeleteAsync($"/api/projects/{project.Id}/members/{project.OwnerId}");
        Assert.Equal(HttpStatusCode.NotFound, unauthorizedRemoval.StatusCode);

        var removeResponse = await _ownerClient.DeleteAsync($"/api/projects/{project.Id}/members/{member.UserId}");
        Assert.Equal(HttpStatusCode.NoContent, removeResponse.StatusCode);

        var hiddenProject = await _memberClient.GetAsync($"/api/projects/{project.Id}");
        Assert.Equal(HttpStatusCode.NotFound, hiddenProject.StatusCode);
    }

    private static async Task RegisterAndAuthorizeAsync(HttpClient client, string email, string displayName)
    {
        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(email, "Portfolio!234", displayName));
        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(auth);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);
    }
}

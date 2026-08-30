using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using CloudTrack.Api.Controllers;
using CloudTrack.Application.Auth;
using CloudTrack.Application.Common;
using CloudTrack.Application.Dashboard;
using CloudTrack.Application.Projects;
using CloudTrack.Domain.Projects;

namespace CloudTrack.IntegrationTests;

public sealed class ProjectFlowTests(CloudTrackApiFactory factory) : IClassFixture<CloudTrackApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task ProjectLifecycleSupportsPagingTasksAndConcurrency()
    {
        await AuthenticateAsync();
        var createResponse = await _client.PostAsJsonAsync("/api/projects", new CreateProjectRequest("Azure portfolio lab", "Build and deploy CloudTrack"));
        createResponse.EnsureSuccessStatusCode();
        var project = await createResponse.Content.ReadFromJsonAsync<ProjectDetails>();
        Assert.NotNull(project);

        var taskResponse = await _client.PostAsJsonAsync($"/api/projects/{project.Id}/tasks", new CreateWorkItemRequest("Deploy dev API", "Use the lowest-cost plan", WorkItemPriority.High, DateTimeOffset.UtcNow.AddDays(5)));
        taskResponse.EnsureSuccessStatusCode();

        var page = await _client.GetFromJsonAsync<PagedResult<ProjectSummary>>("/api/projects?search=Azure&page=1&pageSize=5");
        Assert.NotNull(page);
        Assert.Equal(1, page.TotalCount);
        Assert.Equal(1, Assert.Single(page.Items).TaskCount);

        var update = new UpdateProjectRequest(project.Name, project.Description, ProjectStatus.Active, project.Version);
        var updatedResponse = await _client.PutAsJsonAsync($"/api/projects/{project.Id}", update);
        updatedResponse.EnsureSuccessStatusCode();

        var staleResponse = await _client.PutAsJsonAsync($"/api/projects/{project.Id}", update);
        Assert.Equal(HttpStatusCode.Conflict, staleResponse.StatusCode);

        var dashboard = await _client.GetFromJsonAsync<DashboardSummary>("/api/dashboard");
        Assert.NotNull(dashboard);
        Assert.Equal(1, dashboard.ProjectCount);
        Assert.Equal(1, dashboard.ActiveProjectCount);
        Assert.Equal(1, dashboard.OpenTaskCount);
        Assert.True(dashboard.TotalUserCount >= 1);
        Assert.True(dashboard.LoginCountToday >= 1);
        Assert.Equal("Connected", dashboard.DatabaseStatus);
    }

    private async Task AuthenticateAsync()
    {
        var email = $"projects-{Guid.NewGuid():N}@example.test";
        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(email, "Portfolio!234", "Project Owner"));
        response.EnsureSuccessStatusCode();
        var login = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, "Portfolio!234"));
        login.EnsureSuccessStatusCode();
        var auth = await login.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(auth);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);
    }
}

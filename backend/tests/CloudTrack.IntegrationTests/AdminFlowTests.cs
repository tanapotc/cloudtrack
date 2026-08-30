using System.Net.Http.Headers;
using System.Net.Http.Json;
using CloudTrack.Api.Controllers;
using CloudTrack.Application.Auth;
using CloudTrack.Application.Common;
using CloudTrack.Application.Users;

namespace CloudTrack.IntegrationTests;

public sealed class AdminFlowTests(CloudTrackApiFactory factory) : IClassFixture<CloudTrackApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task SeededAdminCanListUsersAndRoles()
    {
        var login = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest("admin@example.test", "IntegrationAdmin!234"));
        login.EnsureSuccessStatusCode();
        var auth = await login.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(auth);
        Assert.Contains("Admin", auth.User.Roles);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);

        var users = await _client.GetFromJsonAsync<PagedResult<ManagedUserSummary>>("/api/admin/users");
        var roles = await _client.GetFromJsonAsync<IReadOnlyCollection<RoleSummary>>("/api/admin/roles");

        Assert.NotNull(users);
        Assert.Contains(users.Items, user => user.Email == "admin@example.test");
        Assert.NotNull(roles);
        Assert.Equal(3, roles.Count);
    }
}


using CloudTrack.Domain.Identity;
using CloudTrack.Domain.Projects;

namespace CloudTrack.UnitTests;

public sealed class DomainDefaultsTests
{
    [Fact]
    public void NewProjectStartsInPlanningWithVersionOne()
    {
        var project = new Project { Name = "Interview portfolio", OwnerId = Guid.NewGuid() };

        Assert.Equal(ProjectStatus.Planning, project.Status);
        Assert.Equal(1, project.Version);
        Assert.NotEqual(Guid.Empty, project.Id);
    }

    [Fact]
    public void ExpiredRefreshTokenIsNotActive()
    {
        var token = new RefreshToken
        {
            UserId = Guid.NewGuid(),
            TokenHash = "hash",
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(-1),
        };

        Assert.False(token.IsUsable);
    }
}

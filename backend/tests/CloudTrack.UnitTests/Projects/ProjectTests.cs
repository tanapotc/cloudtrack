using CloudTrack.Domain.Projects;

namespace CloudTrack.UnitTests.Projects;

public sealed class ProjectTests
{
    [Fact]
    public void ConstructorWhenCreatedInitializesPlanningStateAndAuditDefaults()
    {
        // Arrange & act
        var project = new Project { Name = "Interview portfolio", OwnerId = Guid.NewGuid() };

        // Assert
        Assert.NotEqual(Guid.Empty, project.Id);
        Assert.Equal(ProjectStatus.Planning, project.Status);
        Assert.Equal(1, project.Version);
        Assert.True(project.IsActive);
        Assert.Empty(project.Members);
        Assert.Empty(project.WorkItems);
    }
}

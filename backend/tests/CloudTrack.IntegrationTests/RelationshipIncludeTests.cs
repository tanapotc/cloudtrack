using CloudTrack.Domain.Identity;
using CloudTrack.Domain.Projects;
using CloudTrack.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CloudTrack.IntegrationTests;

public sealed class RelationshipIncludeTests(CloudTrackApiFactory factory) : IClassFixture<CloudTrackApiFactory>
{
    [Fact]
    public async Task UserProjectGraphCanBeLoadedWithIncludes()
    {
        var email = $"relationships-{Guid.NewGuid():N}@example.test";
        var owner = new AppUser
        {
            Email = email,
            NormalizedEmail = email.ToUpperInvariant(),
            PasswordHash = "not-used-by-this-test",
            DisplayName = "Relationship owner",
        };
        var project = new Project
        {
            Owner = owner,
            Name = "Relationship test project",
            Description = "Verifies EF Core Include paths.",
        };
        var membership = new ProjectMember { Project = project, User = owner };
        var workItem = new WorkItem
        {
            Project = project,
            Assignee = owner,
            Title = "Verify include paths",
        };
        var comment = new WorkItemComment
        {
            WorkItem = workItem,
            Author = owner,
            Body = "Navigation properties should load correctly.",
        };
        var resetToken = new PasswordResetToken
        {
            User = owner,
            TokenHash = Guid.NewGuid().ToString("N"),
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(30),
        };

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            dbContext.AddRange(project, membership, workItem, comment, resetToken);
            await dbContext.SaveChangesAsync();
        }

        await using var queryScope = factory.Services.CreateAsyncScope();
        var queryContext = queryScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hydratedUser = await queryContext.Users
            .AsNoTracking()
            .AsSplitQuery()
            .Include(x => x.OwnedProjects)
                .ThenInclude(x => x.WorkItems)
                    .ThenInclude(x => x.Assignee)
            .Include(x => x.ProjectMemberships)
                .ThenInclude(x => x.Project)
            .Include(x => x.WrittenComments)
                .ThenInclude(x => x.WorkItem)
            .Include(x => x.PasswordResetTokens)
            .SingleAsync(x => x.Id == owner.Id);

        var loadedProject = Assert.Single(hydratedUser.OwnedProjects);
        Assert.Equal(project.Id, loadedProject.Id);
        Assert.Equal(project.Id, Assert.Single(hydratedUser.ProjectMemberships).ProjectId);
        Assert.Equal(workItem.Id, Assert.Single(loadedProject.WorkItems).Id);
        Assert.Equal(owner.Id, loadedProject.WorkItems.Single().AssigneeId);
        Assert.Equal(owner.Id, loadedProject.WorkItems.Single().Assignee!.Id);
        Assert.Equal(workItem.Id, Assert.Single(hydratedUser.WrittenComments).WorkItemId);
        Assert.Equal(resetToken.Id, Assert.Single(hydratedUser.PasswordResetTokens).Id);
    }
}

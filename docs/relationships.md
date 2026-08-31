# Entity Relationships and Includes

CloudTrack models the relationships that the API needs explicitly, so services can load a focused graph with EF Core `Include` / `ThenInclude` instead of manually matching IDs.

## Main graph

- `AppUser` owns `OwnedProjects`, has `ProjectMemberships`, `AssignedWorkItems`, `WrittenComments`, `RefreshTokens`, and `PasswordResetTokens`.
- `Project` has an `Owner`, `Members`, and `WorkItems`.
- `WorkItem` belongs to a `Project`, can have an `Assignee`, and has `Comments`.
- `WorkItemComment` belongs to a `WorkItem` and has an `Author`.
- `ProjectMember` is the explicit many-to-many join between `Project` and `AppUser`.

For example, a read-only project screen can load its required graph in one query shape:

```csharp
var project = await dbContext.Projects
    .AsNoTracking()
    .AsSplitQuery()
    .Include(project => project.Owner)
    .Include(project => project.Members)
        .ThenInclude(member => member.User)
    .Include(project => project.WorkItems)
        .ThenInclude(workItem => workItem.Assignee)
    .Include(project => project.WorkItems)
        .ThenInclude(workItem => workItem.Comments)
            .ThenInclude(comment => comment.Author)
    .SingleAsync(project => project.Id == projectId, cancellationToken);
```

`AsSplitQuery()` is intentional when loading multiple collections: it avoids a large cartesian result set. Use `AsNoTracking()` for read-only queries and project to a response DTO when the UI does not need the full entity graph.

## Referential behavior

- A project owner cannot be deleted while their projects remain (`Restrict`).
- Deleting an assignee clears `WorkItem.AssigneeId` (`SetNull`) without removing the work item.
- Project memberships and comment authors use `Restrict`, preserving the relationship rather than silently deleting related records.
- `AuditLog.ActorId` remains a plain ID with no database foreign key so audit history can remain immutable even if an account is removed.

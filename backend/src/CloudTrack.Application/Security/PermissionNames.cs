namespace CloudTrack.Application.Security;

public static class PermissionNames
{
    public const string ClaimType = "permission";
    public const string ReadUsers = "users.read";
    public const string ManageUsers = "users.manage";
    public const string ManageRoles = "roles.manage";
    public const string ReadProjects = "projects.read";
    public const string ManageProjects = "projects.manage";
    public const string ManageTasks = "tasks.manage";
    public const string ManageComments = "comments.manage";

    public static readonly IReadOnlyCollection<string> All =
    [
        ReadUsers,
        ManageUsers,
        ManageRoles,
        ReadProjects,
        ManageProjects,
        ManageTasks,
        ManageComments,
    ];
}

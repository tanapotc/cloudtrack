using CloudTrack.Application.Common;
using CloudTrack.Domain.Auditing;
using CloudTrack.Domain.Common;
using CloudTrack.Domain.Identity;
using CloudTrack.Domain.Projects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace CloudTrack.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options, ICurrentUser currentUser) : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<PermissionDefinition> Permissions => Set<PermissionDefinition>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermissionGrant> RolePermissions => Set<RolePermissionGrant>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<WorkItem> WorkItems => Set<WorkItem>();
    public DbSet<WorkItemComment> WorkItemComments => Set<WorkItemComment>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Schemas group tables by role instead of leaving everything in the default "dbo":
        //   mas = master / reference data   tra = transactional data
        //   sec = security artifacts        aud = audit trail
        modelBuilder.Entity<AppUser>().ToTable("Users", "mas");
        modelBuilder.Entity<Role>().ToTable("Roles", "mas");
        modelBuilder.Entity<PermissionDefinition>().ToTable("Permissions", "mas");
        modelBuilder.Entity<UserRole>().ToTable("UserRoles", "mas");
        modelBuilder.Entity<RolePermissionGrant>().ToTable("RolePermissions", "mas");
        modelBuilder.Entity<Project>().ToTable("Projects", "tra");
        modelBuilder.Entity<ProjectMember>().ToTable("ProjectMembers", "tra");
        modelBuilder.Entity<WorkItem>().ToTable("WorkItems", "tra");
        modelBuilder.Entity<WorkItemComment>().ToTable("WorkItemComments", "tra");
        modelBuilder.Entity<RefreshToken>().ToTable("RefreshTokens", "sec");
        modelBuilder.Entity<PasswordResetToken>().ToTable("PasswordResetTokens", "sec");
        modelBuilder.Entity<AuditLog>().ToTable("AuditLogs", "aud");

        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasIndex(x => x.NormalizedEmail).IsUnique();
            entity.Property(x => x.Email).HasMaxLength(254);
            entity.Property(x => x.NormalizedEmail).HasMaxLength(254);
            entity.Property(x => x.DisplayName).HasMaxLength(80);
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasIndex(x => x.Name).IsUnique();
            entity.Property(x => x.Name).HasMaxLength(40);
        });

        modelBuilder.Entity<PermissionDefinition>(entity =>
        {
            entity.HasIndex(x => x.Name).IsUnique();
            entity.Property(x => x.Name).HasMaxLength(80);
            entity.Property(x => x.Description).HasMaxLength(240);
        });

        modelBuilder.Entity<UserRole>().HasKey(x => new { x.UserId, x.RoleId });
        modelBuilder.Entity<UserRole>().HasOne(x => x.User).WithMany(x => x.UserRoles).HasForeignKey(x => x.UserId);
        modelBuilder.Entity<UserRole>().HasOne(x => x.Role).WithMany(x => x.UserRoles).HasForeignKey(x => x.RoleId);
        modelBuilder.Entity<RolePermissionGrant>().HasKey(x => new { x.RoleId, x.PermissionId });
        modelBuilder.Entity<RolePermissionGrant>().HasOne(x => x.Role).WithMany(x => x.RolePermissions).HasForeignKey(x => x.RoleId);
        modelBuilder.Entity<RolePermissionGrant>().HasOne(x => x.Permission).WithMany(x => x.RolePermissions).HasForeignKey(x => x.PermissionId);

        modelBuilder.Entity<RefreshToken>().HasOne(x => x.User).WithMany(x => x.RefreshTokens).HasForeignKey(x => x.UserId);
        modelBuilder.Entity<RefreshToken>().HasIndex(x => x.TokenHash).IsUnique();
        modelBuilder.Entity<PasswordResetToken>().HasOne(x => x.User).WithMany(x => x.PasswordResetTokens).HasForeignKey(x => x.UserId);
        modelBuilder.Entity<PasswordResetToken>().HasIndex(x => x.TokenHash).IsUnique();

        modelBuilder.Entity<Project>().HasOne(x => x.Owner).WithMany(x => x.OwnedProjects).HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Project>().Property(x => x.Version).IsConcurrencyToken();
        modelBuilder.Entity<Project>().HasIndex(x => new { x.OwnerId, x.Status });
        modelBuilder.Entity<ProjectMember>().HasKey(x => new { x.ProjectId, x.UserId });
        modelBuilder.Entity<ProjectMember>().HasOne(x => x.User).WithMany(x => x.ProjectMemberships).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<WorkItem>().HasOne(x => x.Project).WithMany(x => x.WorkItems).HasForeignKey(x => x.ProjectId);
        modelBuilder.Entity<WorkItem>().HasOne(x => x.Assignee).WithMany(x => x.AssignedWorkItems).HasForeignKey(x => x.AssigneeId).OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<WorkItem>().Property(x => x.Version).IsConcurrencyToken();
        modelBuilder.Entity<WorkItem>().HasIndex(x => new { x.ProjectId, x.Status, x.Priority });

        modelBuilder.Entity<WorkItemComment>().HasOne(x => x.WorkItem).WithMany(x => x.Comments).HasForeignKey(x => x.WorkItemId);
        modelBuilder.Entity<WorkItemComment>().HasIndex(x => new { x.WorkItemId, x.CreatedAt });
        modelBuilder.Entity<WorkItemComment>().HasOne(x => x.Author).WithMany(x => x.WrittenComments).HasForeignKey(x => x.AuthorId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<AuditLog>().HasIndex(x => new { x.EntityType, x.EntityId, x.CreatedAt });

        var dateTimeOffsetConverter = new ValueConverter<DateTimeOffset, DateTime>(
            value => value.UtcDateTime,
            value => new DateTimeOffset(DateTime.SpecifyKind(value, DateTimeKind.Utc)));
        var nullableDateTimeOffsetConverter = new ValueConverter<DateTimeOffset?, DateTime?>(
            value => value.HasValue ? value.Value.UtcDateTime : null,
            value => value.HasValue ? new DateTimeOffset(DateTime.SpecifyKind(value.Value, DateTimeKind.Utc)) : null);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTimeOffset))
                {
                    property.SetValueConverter(dateTimeOffsetConverter);
                }
                else if (property.ClrType == typeof(DateTimeOffset?))
                {
                    property.SetValueConverter(nullableDateTimeOffsetConverter);
                }
            }
        }
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        StampAudit();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        StampAudit();
        return base.SaveChanges();
    }

    private void StampAudit()
    {
        var now = DateTimeOffset.UtcNow;
        var actor = currentUser.UserId;
        foreach (var entry in ChangeTracker.Entries<IAuditable>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.CreatedBy ??= actor;
            }

            if (entry.State is EntityState.Added or EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
                entry.Entity.UpdatedBy = actor;
            }
        }
    }
}

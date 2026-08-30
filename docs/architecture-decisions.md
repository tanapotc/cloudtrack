# Architecture decisions

## ADR-001: Project management domain

Project management provides realistic one-to-many and many-to-many relationships while keeping the scope suitable for a portfolio. It creates concrete examples for resource authorization, filtering, pagination, auditing, and optimistic concurrency.

## ADR-002: Layered backend

The solution separates Domain, Application, Infrastructure, and API projects. The Domain project contains state without framework dependencies; Application owns contracts; Infrastructure implements persistence and authentication; API owns HTTP and dependency composition. This keeps business concepts testable and prevents controllers from becoming the data-access layer.

## ADR-003: Database strategy

CloudTrack runs on SQL Server in every environment: LocalDB for development, an ephemeral SQL Server 2022 container for CI, and Azure SQL serverless in production. An earlier iteration used SQLite for local and test runs, but keeping two providers meant integration tests never exercised the engine that production uses, hiding provider-specific behavior around transactions, retries, and concurrency. Integration and E2E suites now create a disposable database per run and drop it on teardown.

Schema changes are versioned with EF Core migrations (`backend/src/CloudTrack.Infrastructure/Persistence/Migrations`). `DatabaseInitializer` calls `Database.Migrate()` on startup, so a deploy applies any pending migration before serving traffic and a failed migration stops the rollout. On Free F1 there is a single instance, so start-up migration is safe; a multi-instance production tier would move migration into a dedicated release step. `dotnet ef` is pinned as a local tool (`dotnet tool restore`), and CI fails if the model has drifted from the latest migration.

## ADR-004: Authentication model

Access tokens are short lived. Refresh tokens are high-entropy values delivered in an HttpOnly cookie, stored only as SHA-256 hashes, rotated after use, and revoked after password changes. Reset tokens follow the same hash-at-rest rule. This limits damage from database disclosure and makes token replay detectable.

The SPA keeps its access token in memory. A page refresh uses the refresh cookie to recover a session. No long-lived credential is stored in browser local storage.

## ADR-005: One App Service origin

The delivery workflow builds Angular and copies its browser bundle into ASP.NET Core `wwwroot`. Linux Azure App Service exposes one HTTPS origin for both UI and `/api`. This reduces CORS complexity, avoids a second service, and deploys as a ZIP without requiring Docker or a registry.

## ADR-006: Azure target and naming

The approved target is the existing learning resource group `learning_stack`. No resource is created until a cost and SKU review is confirmed.

| Resource | Generated name | Initial SKU/design |
| --- | --- | --- |
| App Service plan | `asp-cloudtrack-dev` | Linux Free F1, shared compute, no SLA |
| App Service | `app-cloudtrack-dev-<suffix>` | .NET 8, HTTPS-only, ZIP run-from-package |
| Azure SQL | `sql-cloudtrack-dev-<suffix>/cloudtrack` | Free offer, General Purpose serverless, 32 GB, auto-pause on free-limit exhaustion |

The names identify the resource type, system, and environment. Globally unique resources receive a deterministic suffix during deployment.

## ADR-007: Gated cloud delivery

CI always verifies code. The Azure job runs only when `AZURE_DEPLOY_ENABLED` is explicitly set to `true`, and it uses GitHub OIDC instead of storing a long-lived client secret. Infrastructure is previewed with `what-if` before the first deployment, and the production environment can require approval.

## ADR-008: Schema separation and audit columns

Tables are grouped into purpose-named schemas instead of the SQL Server default `dbo`:

| Schema | Contents |
| --- | --- |
| `mas` | Master / reference data: users, roles, permissions, and their join tables |
| `tra` | Transactional data: projects, project members, work items, comments |
| `sec` | Security artifacts: refresh tokens, password-reset tokens |
| `aud` | Audit trail: audit log |

`dbo` is the schema every SQL Server database ships with, and it is where EF Core places tables when no schema is configured. Named schemas cost nothing at runtime but make ownership obvious and allow schema-level `GRANT`s later (for example, a read-only reporting login scoped to `tra`).

Every table also carries five audit columns through the `IAuditable` contract: `CreatedBy`, `CreatedAt`, `UpdatedBy`, `UpdatedAt`, and `IsActive`. `Entity` supplies them for keyed tables and `AuditableLink` supplies them for composite-key join tables. `AppDbContext.SaveChanges` stamps the timestamps and, using an `ICurrentUser` resolved from the request JWT, the actor ids. `CreatedBy` / `UpdatedBy` are plain nullable `Guid`s with no foreign key, so retiring a user never cascades into historical rows. `IsActive` is a soft-state flag only; there is no global query filter, so existing queries are unchanged until a caller opts in.

This model shipped together with the switch to EF Core migrations (ADR-003), so a fresh database is built with the schemas and audit columns in place. The one database that predates migrations is the deployed Azure SQL database, which was created by the old `EnsureCreated` path with everything in `dbo`; it is dropped once so the `InitialCreate` migration can rebuild and reseed it. Every later change ships as its own migration.

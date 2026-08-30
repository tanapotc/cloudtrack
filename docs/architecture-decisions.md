# Architecture decisions

## ADR-001: Project management domain

Project management provides realistic one-to-many and many-to-many relationships while keeping the scope suitable for a portfolio. It creates concrete examples for resource authorization, filtering, pagination, auditing, and optimistic concurrency.

## ADR-002: Layered backend

The solution separates Domain, Application, Infrastructure, and API projects. The Domain project contains state without framework dependencies; Application owns contracts; Infrastructure implements persistence and authentication; API owns HTTP and dependency composition. This keeps business concepts testable and prevents controllers from becoming the data-access layer.

## ADR-003: Database strategy

SQLite keeps local tests fast where Docker is unavailable. EF Core selects SQL Server through configuration in Azure. This preserves a low-friction development path while the deployed environment uses the same engine family as a normal enterprise SQL Server workload.

The first learning release initializes the schema automatically. A mature production release should replace this with reviewed EF migrations executed by a controlled deployment step.

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

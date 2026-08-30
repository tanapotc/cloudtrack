# Architecture decisions

## ADR-001: Project management domain

Project management provides realistic one-to-many and many-to-many relationships while keeping the scope small enough for a portfolio. It also creates useful examples for authorization, filtering, pagination, auditing, and optimistic concurrency.

## ADR-002: Database strategy

SQLite keeps local onboarding fast where Docker is unavailable. The application uses EF Core behind the infrastructure boundary and selects PostgreSQL through configuration for Azure. This makes local tests inexpensive while preserving a production-grade relational database target.

## ADR-003: Azure naming

- Resource group: `rg-cloudtrack-portfolio-lab-dev`
- Static web app: `swa-cloudtrack-web-dev`
- API: `ca-cloudtrack-api-dev`
- PostgreSQL: `psql-cloudtrack-dev-<unique>`
- Application Insights: `appi-cloudtrack-dev`

Names identify the system, resource type, environment, and learning purpose. Globally unique resources receive a generated suffix only at deployment time.


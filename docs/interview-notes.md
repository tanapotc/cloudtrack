# Interview notes

## Two-minute project story

CloudTrack is a project-management workspace I built to demonstrate an end-to-end delivery path rather than only a login screen. Angular handles a responsive, lazy-loaded UI; ASP.NET Core exposes a layered API; EF Core runs on SQL Server in every environment, from LocalDB to Azure SQL. Authentication uses short-lived JWTs and rotated refresh tokens, and administration uses role and resource boundaries. The pipeline tests the API, browser, and secrets before a gated ZIP deployment to Azure App Service using OIDC.

## Decisions worth explaining

### Why standardize on SQL Server everywhere?

An earlier version used SQLite for local and test runs to avoid a database prerequisite. The problem: integration tests passed against an engine production never uses, so provider-specific behavior around execution strategies, retries, and transactions went untested. Now every environment uses SQL Server — LocalDB for development, an ephemeral SQL Server 2022 container in CI, and Azure SQL serverless in production. Tests create and drop a database per run, so they stay isolated without a second provider.

### Why split schemas and add audit columns?

`dbo` is just SQL Server's default schema; EF Core uses it when none is set. Grouping tables into `mas` (reference data), `tra` (transactions), `sec` (tokens), and `aud` (audit) documents ownership and leaves room for schema-scoped grants such as a read-only reporting login on `tra`. Every table carries `CreatedBy`, `CreatedAt`, `UpdatedBy`, `UpdatedAt`, and `IsActive`; `AppDbContext.SaveChanges` stamps them from an `ICurrentUser` bound to the request JWT. The actor columns are unconstrained `Guid`s so deleting a user never touches history, and `IsActive` is a bare flag with no global query filter so nothing changes behaviour until a query opts in.

### Why not store JWTs in local storage?

The access token is held in memory and kept short lived. The refresh token is an HttpOnly cookie and only its hash is persisted. This reduces exposure to browser script access while preserving silent session recovery. Rotation and revocation provide controls that a single long-lived bearer token would not.

### Why is password recovery a demo link instead of email?

The deployed portfolio does not store a personal mailbox credential or third-party API key. Forgot Password therefore creates the same 30-minute, single-use, hashed-at-rest token that an email provider would deliver, but presents a clearly labelled continue link in the browser. A missing account receives an unpersisted decoy token, preserving an indistinguishable response shape. This is convenient for an interviewer to test end to end, but it is deliberately not presented as production delivery: the next step is a free transactional provider such as Resend and disabling `Auth__ExposeDevelopmentResetToken`.

### Why one App Service?

Serving Angular and the API from one App Service origin reduces CORS and deployment complexity. Free F1 avoids a container registry and is appropriate for an interview demo, but has no SLA, daily quotas, and possible cold starts. UI and API still scale together; separate services would be appropriate when their release cadence or traffic profiles diverge.

### What did E2E testing find?

The desktop flow passed while the Pixel 7 flow could not reach Projects because the navigation link was off-canvas. The fix added an accessible label and made the test open the hamburger navigation as a real mobile user would. This is a useful example of tests detecting a product-level interaction problem rather than only checking rendered markup.

### How are secrets protected?

Tracked appsettings contain only safe defaults. Local secrets live in .NET user-secrets or ignored `.env` files. Azure values are protected App Service settings, GitHub uses OIDC without a client secret, and CI runs Gitleaks. Angular receives only public configuration because every browser bundle can be inspected.

## Trade-offs and next steps

- Schema changes ship as EF Core migrations applied on start-up; a multi-instance tier would move that into a dedicated release step.
- Azure-service SQL access reduces lab complexity; private networking is the production hardening path.
- The portfolio demo exposes a one-time reset link; real-user production must use transactional email and disable token exposure.
- The initial audit log supports investigation but should gain structured correlation IDs and retention policy.
- The next performance step is a repeatable baseline covering API latency, database query count, bundle budgets, and cold-start behavior.

## Demo path

1. Register a member and explain the refresh cookie.
2. Create a project and task, then change task status.
3. Show the dashboard metrics and audit activity.
4. Sign in as an administrator and demonstrate role protection.
5. Open the CI workflow and Bicep template, then explain the Azure cost gate.
6. Finish with the responsive Playwright test and the mobile bug it caught.

## Honest production-readiness statement

This is a production-minded portfolio project, not a claim that a learning deployment is already enterprise production. The architecture includes security and operational boundaries, and the documentation explicitly identifies remaining work such as private networking, controlled migrations, email delivery, restore drills, and SLOs.

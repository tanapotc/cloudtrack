# Interview notes

## Two-minute project story

CloudTrack is a project-management workspace I built to demonstrate an end-to-end delivery path rather than only a login screen. Angular handles a responsive, lazy-loaded UI; ASP.NET Core exposes a layered API; EF Core supports SQLite for easy onboarding and PostgreSQL for Azure. Authentication uses short-lived JWTs and rotated refresh tokens, and administration uses role and resource boundaries. The same pipeline tests the API, browser, secrets, and container before a gated Azure deployment.

## Decisions worth explaining

### Why SQLite locally and PostgreSQL in Azure?

SQLite removes a local infrastructure prerequisite and makes integration tests fast. PostgreSQL provides a realistic managed relational target. EF Core keeps the switch configuration-driven, although provider-specific behavior still needs integration coverage against PostgreSQL before calling the system production-ready.

### Why not store JWTs in local storage?

The access token is held in memory and kept short lived. The refresh token is an HttpOnly cookie and only its hash is persisted. This reduces exposure to browser script access while preserving silent session recovery. Rotation and revocation provide controls that a single long-lived bearer token would not.

### Why one container?

Serving Angular and the API from one origin reduces CORS and deployment complexity and lets a low-traffic Container App scale to zero. The trade-off is that UI and API scale together; separate services would be appropriate when their release cadence or traffic profiles diverge.

### What did E2E testing find?

The desktop flow passed while the Pixel 7 flow could not reach Projects because the navigation link was off-canvas. The fix added an accessible label and made the test open the hamburger navigation as a real mobile user would. This is a useful example of tests detecting a product-level interaction problem rather than only checking rendered markup.

### How are secrets protected?

Tracked appsettings contain only safe defaults. Local secrets live in .NET user-secrets or ignored `.env` files. Azure values are Container App secret references, GitHub uses protected Environment secrets and OIDC, and CI runs Gitleaks. Angular receives only public configuration because every browser bundle can be inspected.

## Trade-offs and next steps

- Automatic schema initialization is convenient for a lab; reviewed EF migrations should own production changes.
- Public PostgreSQL access reduces lab complexity; private networking is the production hardening path.
- Reset tokens are exposed only in Development; production needs a transactional email provider.
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

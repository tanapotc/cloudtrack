# API surface

All business routes are under `/api`. Interactive Swagger UI is available at
`/api-docs` in every environment because this is a portfolio project; its OpenAPI
document remains available at `/swagger/v1/swagger.json`. Protected operations still
require a valid bearer token through the Swagger **Authorize** control.

## Authentication

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Create a member account and session |
| POST | `/auth/login` | Validate credentials and create a session |
| POST | `/auth/refresh` | Rotate the HttpOnly refresh token |
| POST | `/auth/logout` | Revoke the active refresh token |
| POST | `/auth/forgot-password` | Start recovery without account enumeration |
| POST | `/auth/reset-password` | Consume a one-time reset token |
| POST | `/auth/change-password` | Change password and revoke all sessions |
| GET | `/auth/me` | Return the authenticated profile and roles |

## Projects and work

| Method | Route | Purpose |
| --- | --- | --- |
| GET/POST | `/projects` | Search, page, filter, or create projects |
| GET/PUT/DELETE | `/projects/{id}` | Read, update, or remove an authorized project |
| POST | `/projects/{id}/tasks` | Add a task |
| PUT/DELETE | `/projects/{id}/tasks/{taskId}` | Update status/details or remove a task |
| GET | `/dashboard` | Return workspace metrics and recent activity |

Project access is resource-based. Version values are checked during updates to prevent silent lost writes.

## Administration

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/admin/users` | Search and page users |
| PUT | `/admin/users/{id}/roles` | Change assigned roles |
| PUT | `/admin/users/{id}/status` | Activate or deactivate a user |
| GET | `/admin/roles` | List available roles |

Administration requires the `Admin` role. Safeguards prevent an administrator from disabling themself or removing the last active administrator.

## Operational

- `GET /health` is used by Azure liveness and readiness probes.
- Validation and unexpected failures are returned as `application/problem+json`.
- Authentication endpoints allow 10 requests per IP per one-minute fixed window.

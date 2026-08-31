# Monitoring runbook

CloudTrack always exposes `GET /health`, which includes the SQL Server database check. ASP.NET Core emits structured logs to the App Service log stream, and the codebase is ready to export traces, metrics, requests, dependencies, exceptions, and logs to Azure Monitor through OpenTelemetry.

## Safe default

The `Azure.Monitor.OpenTelemetry.AspNetCore` package is registered only when the `APPLICATIONINSIGHTS_CONNECTION_STRING` environment variable is present. This keeps local development and the public portfolio demo silent by default: there is no telemetry destination and no extra Azure resource until an owner intentionally creates one.

Do not commit the connection string. Set it only as a protected App Service application setting, then restart the app and wait a few minutes before opening the Application Insights resource.

## What to inspect

- **Failures:** unhandled API exceptions and failed dependency calls.
- **Performance:** request duration, slow endpoints, and SQL dependency duration.
- **Availability:** the public `/health` endpoint together with App Service availability.
- **Security signals:** rate-limit rejections, authentication failures, and application audit-log events. Do not record tokens, passwords, or request bodies.

The existing `/health` smoke check remains the release gate. Application Insights complements it with historical trends; it does not replace a health probe.

## Cost guardrail

Application Insights is part of Azure Monitor. Billing is based on log-data ingestion, retention, and export; standard Azure platform metrics and activity logs have no additional charge. Before enabling it, create a small monthly Cost Management budget/alert and review ingestion after the first week. Do not add availability web tests, long retention, export rules, or a commitment tier to this learning environment unless a specific demonstration needs them.

## Owner-controlled Azure steps

1. Create one Application Insights resource in `learning_stack` using the workspace-based default and the same Southeast Asia region where available.
2. Create a monthly Azure Cost Management budget alert for the resource group.
3. Copy the connection string into the App Service setting named `APPLICATIONINSIGHTS_CONNECTION_STRING`.
4. Restart the App Service, open the live site, and confirm requests appear in Application Insights.
5. Remove the setting or the resource when the demo is no longer needed to stop ingestion.

The resource creation and setting change are intentionally left for explicit owner approval because they can incur charges and change production telemetry behavior.

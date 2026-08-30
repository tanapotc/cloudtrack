#!/usr/bin/env bash
set -euo pipefail

sql_password="CloudTrack!$(openssl rand -hex 12)9"
base_connection="Server=localhost,1433;User ID=sa;Password=${sql_password};Encrypt=False;TrustServerCertificate=True"

echo "::add-mask::${sql_password}"
echo "CLOUDTRACK_TEST_SQLSERVER=${base_connection}" >> "${GITHUB_ENV}"
echo "CLOUDTRACK_E2E_SQLSERVER=${base_connection};Initial Catalog=CloudTrackE2E" >> "${GITHUB_ENV}"

docker run --detach --name cloudtrack-sql \
  --env ACCEPT_EULA=Y \
  --env MSSQL_SA_PASSWORD="${sql_password}" \
  --publish 1433:1433 \
  mcr.microsoft.com/mssql/server:2022-latest >/dev/null

for attempt in {1..60}; do
  if docker exec cloudtrack-sql /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "${sql_password}" -C -Q "SELECT 1" >/dev/null 2>&1; then
    echo "SQL Server is ready after ${attempt} checks."
    exit 0
  fi
  sleep 2
done

docker logs cloudtrack-sql
echo "SQL Server did not become ready in time." >&2
exit 1

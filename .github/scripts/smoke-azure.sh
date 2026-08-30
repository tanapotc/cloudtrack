#!/usr/bin/env bash
set -euo pipefail

base_url="${1:?Usage: smoke-azure.sh <base-url>}"
base_url="${base_url%/}"
temporary_directory="$(mktemp -d)"
trap 'rm -rf "${temporary_directory}"' EXIT

curl_retry=(
  --silent
  --show-error
  --retry 12
  --retry-delay 10
  --retry-all-errors
  --connect-timeout 15
  --max-time 30
)

curl "${curl_retry[@]}" --fail "${base_url}/health" \
  --output "${temporary_directory}/health.txt"
grep --quiet --line-regexp 'Healthy' "${temporary_directory}/health.txt"

curl "${curl_retry[@]}" --fail "${base_url}/swagger/v1/swagger.json" \
  --output "${temporary_directory}/openapi.json"
grep --quiet '"openapi"' "${temporary_directory}/openapi.json"

protected_status="$(curl "${curl_retry[@]}" \
  --output "${temporary_directory}/protected.txt" \
  --write-out '%{http_code}' \
  "${base_url}/api/auth/me")"
test "${protected_status}" = '401'

forgot_status="$(curl "${curl_retry[@]}" \
  --header 'Content-Type: application/json' \
  --data "{\"email\":\"deployment-smoke-$(date +%s)@invalid.example\"}" \
  --output "${temporary_directory}/forgot.json" \
  --write-out '%{http_code}' \
  "${base_url}/api/auth/forgot-password")"
test "${forgot_status}" = '200'
grep --quiet 'password reset instructions have been prepared' \
  "${temporary_directory}/forgot.json"

echo "Azure API smoke test passed for ${base_url}."

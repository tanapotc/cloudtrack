<#
.SYNOPSIS
  Build and deploy CloudTrack to the Azure App Service by hand.

.DESCRIPTION
  Mirrors .github/workflows/deploy-azure.yml for when GitHub Actions cannot run.
  Builds the Angular bundle, publishes the API with the frontend embedded, packs a
  ZIP, and pushes it with `az webapp deploy`.

  The ZIP is built with `tar` (bsdtar, shipped with Windows 10 1803+) because
  Windows PowerShell's Compress-Archive writes backslash path separators, which
  Linux App Service unpacks as literal file names - the app then fails to load
  Microsoft.Data.SqlClient and cannot find wwwroot.

.EXAMPLE
  pwsh ./scripts/deploy-local.ps1
#>
[CmdletBinding()]
param(
    [string]$ResourceGroup = 'learning_stack',
    [string]$WebApp = 'app-cloudtrack-dev-xe3xxsh',
    [string]$Configuration = 'Release'
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$publish = Join-Path ([System.IO.Path]::GetTempPath()) 'cloudtrack-publish'
$zip = Join-Path ([System.IO.Path]::GetTempPath()) 'cloudtrack.zip'

if (Test-Path $publish) { Remove-Item $publish -Recurse -Force }
if (Test-Path $zip) { Remove-Item $zip -Force }

Write-Host '==> Building Angular bundle'
npm ci --prefix (Join-Path $repo 'frontend')
npm run build --prefix (Join-Path $repo 'frontend')

Write-Host '==> Publishing API with the frontend embedded'
dotnet publish (Join-Path $repo 'backend/src/CloudTrack.Api/CloudTrack.Api.csproj') `
    --configuration $Configuration --output $publish -p:IncludeFrontendDist=true

Write-Host '==> Packing ZIP with forward-slash paths'
tar -a -c -f $zip -C $publish .
if (-not (Test-Path (Join-Path $publish 'CloudTrack.Api.dll'))) { throw 'CloudTrack.Api.dll missing from publish output' }
if (-not (Test-Path (Join-Path $publish 'wwwroot/index.html'))) { throw 'wwwroot/index.html missing from publish output' }

Write-Host "==> Deploying $zip to $WebApp"
az webapp deploy --resource-group $ResourceGroup --name $WebApp --src-path $zip --type zip

$hostName = az webapp show --resource-group $ResourceGroup --name $WebApp --query defaultHostName -o tsv
Write-Host "==> Verifying https://$hostName"
foreach ($path in 'health', 'auth/login', 'auth/register') {
    $code = (Invoke-WebRequest -Uri "https://$hostName/$path" -Method Head -SkipHttpErrorCheck).StatusCode
    Write-Host ("    /{0,-16} {1}" -f $path, $code)
}

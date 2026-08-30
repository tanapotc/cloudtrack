<#
.SYNOPSIS
  Build and deploy CloudTrack to the Azure App Service by hand.

.DESCRIPTION
  Mirrors .github/workflows/deploy-azure.yml for when GitHub Actions cannot run.
  Builds the Angular bundle, publishes the API with the frontend embedded, packs a
  ZIP, and pushes it with `az webapp deploy`.

  The ZIP is built with .NET's ZipFile API so entries use portable paths and sit
  directly at the archive root. Native command failures stop the deployment before
  Azure can receive a stale or incomplete build.

.EXAMPLE
  pwsh ./scripts/deploy-local.ps1
#>
[CmdletBinding()]
param(
    [string]$ResourceGroup = 'learning_stack',
    [string]$WebApp = 'app-cloudtrack-dev-xe3xxsh',
    [string]$Configuration = 'Release',
    [string]$ArtifactDirectory = $(if (Test-Path 'D:\') { 'D:\CloudTrackBuilds' } else { Join-Path ([System.IO.Path]::GetTempPath()) 'CloudTrackBuilds' })
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true
$repo = Split-Path -Parent $PSScriptRoot
$buildId = Get-Date -Format 'yyyyMMdd-HHmmss'
$buildRoot = Join-Path $ArtifactDirectory "cloudtrack-$buildId"
$publish = Join-Path $buildRoot 'publish'
$zip = Join-Path $ArtifactDirectory "cloudtrack-$buildId.zip"

New-Item -ItemType Directory -Path $publish -Force | Out-Null

Write-Host '==> Building Angular bundle'
npm ci --prefix (Join-Path $repo 'frontend')
npm run build --prefix (Join-Path $repo 'frontend')

Write-Host '==> Publishing API with the frontend embedded'
dotnet publish (Join-Path $repo 'backend/src/CloudTrack.Api/CloudTrack.Api.csproj') `
    --configuration $Configuration --output $publish -p:IncludeFrontendDist=true

if (-not (Test-Path (Join-Path $publish 'CloudTrack.Api.dll'))) { throw 'CloudTrack.Api.dll missing from publish output' }
if (-not (Test-Path (Join-Path $publish 'wwwroot/index.html'))) { throw 'wwwroot/index.html missing from publish output' }

Write-Host '==> Packing a Linux-safe ZIP'
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory(
    $publish,
    $zip,
    [System.IO.Compression.CompressionLevel]::Optimal,
    $false
)

$archive = [System.IO.Compression.ZipFile]::OpenRead($zip)
try {
    $entryNames = @($archive.Entries | ForEach-Object FullName)
    if ($entryNames -notcontains 'CloudTrack.Api.dll') { throw 'CloudTrack.Api.dll is not at the ZIP root' }
    if ($entryNames -notcontains 'wwwroot/index.html') { throw 'wwwroot/index.html is missing from the ZIP' }
    if ($entryNames | Where-Object { $_ -like './*' -or $_ -like '*\*' }) {
        throw 'ZIP contains a non-portable entry path'
    }
}
finally {
    $archive.Dispose()
}

Write-Host "==> Deploying $zip to $WebApp"
az webapp deploy --resource-group $ResourceGroup --name $WebApp --src-path $zip --type zip --clean true --restart true --output none

$hostName = az webapp show --resource-group $ResourceGroup --name $WebApp --query defaultHostName -o tsv
Write-Host "==> Verifying https://$hostName"
$baseUrl = "https://$hostName"

function Invoke-SmokeRequest {
    param([hashtable]$Parameters)

    foreach ($attempt in 1..12) {
        try {
            return Invoke-WebRequest @Parameters
        }
        catch {
            if ($attempt -eq 12) { throw }
            Start-Sleep -Seconds 10
        }
    }
}

$health = Invoke-SmokeRequest @{ Uri = "$baseUrl/health"; Method = 'Get'; TimeoutSec = 30 }
if ($health.StatusCode -ne 200 -or $health.Content.Trim() -ne 'Healthy') { throw 'Health endpoint verification failed' }

$openApi = Invoke-SmokeRequest @{ Uri = "$baseUrl/swagger/v1/swagger.json"; Method = 'Get'; TimeoutSec = 30 }
if ($openApi.StatusCode -ne 200 -or $openApi.Content -notmatch '"openapi"') { throw 'OpenAPI verification failed' }

$protected = Invoke-SmokeRequest @{ Uri = "$baseUrl/api/auth/me"; Method = 'Get'; TimeoutSec = 30; SkipHttpErrorCheck = $true }
if ($protected.StatusCode -ne 401) { throw "Protected endpoint returned $($protected.StatusCode), expected 401" }

$forgotBody = @{ email = "deployment-smoke-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())@invalid.example" } | ConvertTo-Json
$forgot = Invoke-SmokeRequest @{
    Uri = "$baseUrl/api/auth/forgot-password"
    Method = 'Post'
    ContentType = 'application/json'
    Body = $forgotBody
    TimeoutSec = 30
    SkipHttpErrorCheck = $true
}
if ($forgot.StatusCode -ne 200 -or $forgot.Content -notmatch 'password reset instructions have been prepared') {
    throw 'Forgot-password API verification failed'
}

Write-Host "==> Deployment verified: https://$hostName"
Write-Host "==> Package retained at: $zip"

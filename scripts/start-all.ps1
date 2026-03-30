<#
  start-all.ps1

  Starts backend and frontend dev servers as background jobs and streams
  ALL their output into THIS terminal window with [BACKEND] / [FRONTEND] prefixes.

  Usage (from repo root):
    powershell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1

  Press Ctrl+C to stop both servers.
#>

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$root      = Split-Path -Parent $scriptDir
$backendPath  = Join-Path $root 'project-backend'
$frontendPath = Join-Path $root 'project-ui'

function Get-NpmScript($projectPath) {
  $pkgPath = Join-Path $projectPath 'package.json'
  if (-not (Test-Path $pkgPath)) { return 'dev' }
  try {
    $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
    if ($null -ne $pkg.scripts.dev)   { return 'dev' }
    if ($null -ne $pkg.scripts.start) { return 'start' }
    $first = $pkg.scripts | Get-Member -MemberType NoteProperty |
             Select-Object -First 1 -ExpandProperty Name
    if ($first) { return $first }
    return 'start'
  } catch { return 'dev' }
}

function Ensure-NodeModules($projectPath) {
  $nm = Join-Path $projectPath 'node_modules'
  if (-not (Test-Path $nm)) {
    Write-Host "  [SETUP] node_modules missing in $projectPath - running npm install..." -ForegroundColor Yellow
    Push-Location $projectPath
    npm install
    Pop-Location
  }
}

$backendScript  = Get-NpmScript $backendPath
$frontendScript = Get-NpmScript $frontendPath

Ensure-NodeModules $backendPath
Ensure-NodeModules $frontendPath

Write-Host ""
Write-Host "  ================================================================" -ForegroundColor Cyan
Write-Host "           CLANKEYE - starting all services" -ForegroundColor Cyan
Write-Host "  ================================================================" -ForegroundColor Cyan
Write-Host "  Backend  : npm run $backendScript" -ForegroundColor Cyan
Write-Host "  Frontend : npm run $frontendScript" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop both servers" -ForegroundColor Cyan
Write-Host "  ================================================================" -ForegroundColor Cyan
Write-Host ""

# -- Start both as PS background jobs ------------------------------------------
$backendJob = Start-Job -Name "Backend" -ScriptBlock {
  param($p, $s)
  Set-Location -LiteralPath $p
  npm run $s 2>&1
} -ArgumentList $backendPath, $backendScript

$frontendJob = Start-Job -Name "Frontend" -ScriptBlock {
  param($p, $s)
  Set-Location -LiteralPath $p
  npm run $s 2>&1
} -ArgumentList $frontendPath, $frontendScript

# -- Stream output from both jobs into this terminal ---------------------------
try {
  while ($true) {
    $backendLines  = Receive-Job $backendJob  -ErrorAction SilentlyContinue
    $frontendLines = Receive-Job $frontendJob -ErrorAction SilentlyContinue

    foreach ($line in $backendLines) {
      Write-Host "[BACKEND]  $line" -ForegroundColor Green
    }
    foreach ($line in $frontendLines) {
      Write-Host "[FRONTEND] $line" -ForegroundColor Magenta
    }

    # Exit if both jobs have stopped unexpectedly
    if ($backendJob.State  -notin 'Running','NotStarted' -and
        $frontendJob.State -notin 'Running','NotStarted') {
      Write-Host "[start-all] Both processes have exited." -ForegroundColor Yellow
      break
    }

    Start-Sleep -Milliseconds 200
  }
} finally {
  Write-Host ""
  Write-Host "[start-all] Stopping jobs..." -ForegroundColor Yellow
  Stop-Job  $backendJob, $frontendJob  -ErrorAction SilentlyContinue
  Remove-Job $backendJob, $frontendJob -Force -ErrorAction SilentlyContinue
  Write-Host "[start-all] Done." -ForegroundColor Yellow
}

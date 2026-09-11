param([switch]$Dev)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$runtimeDir = Join-Path $projectRoot 'backend/data/runtime'
$pythonPath = Join-Path $projectRoot 'backend/.venv/Scripts/python.exe'
$nodePath = (Get-Command node -ErrorAction Stop).Source
function Get-LocalListener([int]$port) {
    foreach ($line in (& netstat -ano -p tcp)) {
        $parts = $line.Trim() -split '\s+'
        if ($parts.Count -eq 5 -and $parts[1] -match ":$port$" -and $parts[3] -eq 'LISTENING') { return [int]$parts[4] }
    }
    return $null
}
if (!(Test-Path -LiteralPath $pythonPath)) { throw 'Create backend/.venv and install backend/requirements.txt first. See LOCAL_MVP.md.' }
foreach ($port in @(8000, 3003)) {
    if (Get-LocalListener $port) { throw "Port $port is in use. Stop the existing project server before starting another." }
}
if (!$Dev -and !(Test-Path -LiteralPath (Join-Path $projectRoot '.next/BUILD_ID'))) { throw 'Build the frontend first: node node_modules/next/dist/bin/next build --turbopack' }
New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
$backend = Start-Process -FilePath $pythonPath -ArgumentList '-m uvicorn backend.main:app --host 127.0.0.1 --port 8000' -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDir 'backend.log') -RedirectStandardError (Join-Path $runtimeDir 'backend-error.log') -PassThru
$nextScript = Join-Path $projectRoot 'node_modules/next/dist/bin/next'
$nextMode = if ($Dev) { 'dev --turbopack' } else { 'start' }
$frontend = Start-Process -FilePath $nodePath -ArgumentList "`"$nextScript`" $nextMode --hostname 127.0.0.1 --port 3003" -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDir 'frontend.log') -RedirectStandardError (Join-Path $runtimeDir 'frontend-error.log') -PassThru
$records = @()
foreach ($pair in @(@{port=8000; launcher=$backend}, @{port=3003; launcher=$frontend})) {
    $listenerId = $null
    for ($attempt=0; $attempt -lt 30; $attempt++) {
        $listenerId = Get-LocalListener $pair.port
        if ($listenerId) { break }
        Start-Sleep -Milliseconds 250
    }
    if (!$listenerId) { throw "Server on port $($pair.port) failed to start. Check backend/data/runtime logs." }
    $actual = Get-Process -Id $listenerId
    if ($actual.StartTime -lt $pair.launcher.StartTime.AddSeconds(-1)) { throw 'Unexpected pre-existing process; refusing to manage it.' }
    $records += @{pid=$actual.Id; startTicks=$actual.StartTime.ToUniversalTime().Ticks.ToString(); executable=$actual.Path}
}
$records | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runtimeDir 'processes.json')
Write-Output 'Bharat Vault is ready at http://localhost:3003. Logs: backend/data/runtime. Stop with ./stop-local.ps1.'

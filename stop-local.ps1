$ErrorActionPreference = 'Stop'
$manifest = Join-Path $PSScriptRoot 'backend/data/runtime/processes.json'
if (!(Test-Path -LiteralPath $manifest)) { Write-Output 'No managed server processes recorded.'; exit }
foreach ($record in (Get-Content -LiteralPath $manifest -Raw | ConvertFrom-Json)) {
    $process = Get-Process -Id $record.pid -ErrorAction SilentlyContinue
    if ($process -and $process.Path -eq $record.executable -and $process.StartTime.ToUniversalTime().Ticks -eq [long]$record.startTicks) {
        Stop-Process -Id $process.Id
        Write-Output "Stopped project server PID $($process.Id)."
    }
}
Write-Output 'Local documents and database are retained.'

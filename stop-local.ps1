$ErrorActionPreference = 'Stop'
$manifest = Join-Path $PSScriptRoot 'backend/data/runtime/processes.json'
if (!(Test-Path -LiteralPath $manifest)) { Write-Output 'No managed server processes recorded.'; exit }
$records = @(Get-Content -LiteralPath $manifest -Raw | ConvertFrom-Json)
foreach ($record in $records) {
    $process = Get-Process -Id $record.pid -ErrorAction SilentlyContinue
    if ($process -and $process.Path -eq $record.executable -and $process.StartTime.ToUniversalTime().Ticks -eq [long]$record.startTicks) {
        Stop-Process -Id $process.Id -Force
        Write-Output "Stopped project server PID $($process.Id)."
    }
}
# A Windows launcher can hand a listening socket to a child just after startup.
# Catch only a replacement listener using the same verified executable and start window.
$allowedExecutables = @($records | ForEach-Object { $_.executable })
$earliestTicks = ($records | ForEach-Object { [long]$_.startTicks } | Measure-Object -Minimum).Minimum
for ($attempt=0; $attempt -lt 4; $attempt++) {
    Start-Sleep -Milliseconds 250
    $stoppedReplacement = $false
    foreach ($line in (& netstat -ano -p tcp)) {
        $parts = $line.Trim() -split '\s+'
        if ($parts.Count -ne 5 -or $parts[1] -notmatch ':(8000|3003)$' -or $parts[3] -ne 'LISTENING') { continue }
        $candidate = Get-Process -Id ([int]$parts[4]) -ErrorAction SilentlyContinue
        if ($candidate -and $allowedExecutables -contains $candidate.Path -and $candidate.StartTime.ToUniversalTime().Ticks -ge ($earliestTicks - 10000000)) {
            Stop-Process -Id $candidate.Id -Force
            Write-Output "Stopped project server PID $($candidate.Id)."
            $stoppedReplacement = $true
        }
    }
    if (!$stoppedReplacement) { break }
}
Write-Output 'Local documents and database are retained.'

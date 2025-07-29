# Daily Strategic Follow-up Processor
# This script runs the strategic follow-up analysis and sending system

Write-Host "=== Daily Strategic Follow-up Processor ===" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date)" -ForegroundColor White
Write-Host ""

# Load CRON_SECRET from .env.local
$envPath = ".env.local"
$cronSecret = ""

if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match "^CRON_SECRET=(.+)$") {
            $cronSecret = $matches[1]
        }
    }
}

if (-not $cronSecret) {
    Write-Host "ERROR: Could not load CRON_SECRET from .env.local" -ForegroundColor Red
    exit 1
}

$API_URL = "http://localhost:3000"

Write-Host "=== Step 1: Check Server Status ===" -ForegroundColor Yellow
try {
    # Check if server is listening on port 3000
    $portCheck = netstat -ano | Select-String ":3000.*LISTENING"
    if ($portCheck) {
        Write-Host "✅ Next.js server is running on port 3000" -ForegroundColor Green
    } else {
        Write-Host "❌ Next.js server is not running. Please start it with 'npm run dev'" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error checking server status: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Step 2: Run Strategic Follow-up Analysis ===" -ForegroundColor Yellow

try {
    Write-Host "Calling strategic follow-up processor..." -ForegroundColor Cyan
    
    $headers = @{
        "Content-Type" = "application/json"
        "x-cron-secret" = $cronSecret
    }
    
    $response = Invoke-RestMethod -Uri "$API_URL/api/cron/strategic-followup" -Method POST -Headers $headers -TimeoutSec 120
    
    Write-Host "✅ Strategic follow-up processing completed successfully" -ForegroundColor Green
    Write-Host ""
    
    # Display results
    if ($response.results) {
        Write-Host "=== Processing Results ===" -ForegroundColor Cyan
        Write-Host "Leads analyzed: $($response.results.analyzed)" -ForegroundColor White
        Write-Host "Follow-ups scheduled: $($response.results.scheduled)" -ForegroundColor Green
        Write-Host "Leads skipped: $($response.results.skipped)" -ForegroundColor Yellow
        Write-Host "Errors encountered: $($response.results.errors)" -ForegroundColor Red
    }
    
    if ($response.message) {
        Write-Host ""
        Write-Host "Message: $($response.message)" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Strategic follow-up processing failed: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "HTTP Status: $statusCode" -ForegroundColor Red
        
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            $reader.Close()
            Write-Host "Response Body: $responseBody" -ForegroundColor Gray
        } catch {
            Write-Host "Could not read response body" -ForegroundColor Gray
        }
    }
    exit 1
}

Write-Host ""
Write-Host "=== Strategic Follow-up Processing Complete ===" -ForegroundColor Green
Write-Host "Next run should be scheduled for tomorrow at the same time." -ForegroundColor Yellow
Write-Host ""
Write-Host "To set up automatic daily execution:" -ForegroundColor Cyan
Write-Host "1. Open Windows Task Scheduler" -ForegroundColor White
Write-Host "2. Create a new task to run this script daily" -ForegroundColor White
Write-Host "3. Set it to run at a time when your servers are running (e.g., 9 AM)" -ForegroundColor White
Write-Host "4. Make sure both Next.js and Python services are running" -ForegroundColor White

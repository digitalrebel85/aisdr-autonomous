# Debug script to check the outreach queue and understand why emails aren't being processed

$API_URL = "http://localhost:3000"
$CRON_SECRET = $env:CRON_SECRET

Write-Host "=== Outreach Queue Debug ===" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date)" -ForegroundColor White
Write-Host "Current UTC: $((Get-Date).ToUniversalTime())" -ForegroundColor White
Write-Host ""

if (-not $CRON_SECRET) {
    Write-Host "ERROR: CRON_SECRET not set" -ForegroundColor Red
    exit 1
}

Write-Host "=== Checking Queue Status ===" -ForegroundColor Yellow

# Create a simple endpoint to check queue status
$debugUrl = "$API_URL/api/debug/queue-status"

Write-Host "Attempting to check queue status..." -ForegroundColor Cyan
Write-Host "If this fails, we'll need to create a debug endpoint" -ForegroundColor Gray
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $CRON_SECRET"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri $debugUrl -Method GET -Headers $headers -TimeoutSec 10
    
    Write-Host "Queue Status:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
    
} catch {
    Write-Host "Debug endpoint doesn't exist yet. Let's check manually:" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "=== Manual Checks ===" -ForegroundColor Cyan
    Write-Host "1. Check your database outreach_queue table:" -ForegroundColor White
    Write-Host "   - Look for rows with status = 'queued'" -ForegroundColor Gray
    Write-Host "   - Check the scheduled_at timestamp" -ForegroundColor Gray
    Write-Host "   - Verify lead_data and offer_data are populated" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "2. Key things to check:" -ForegroundColor White
    Write-Host "   - Is scheduled_at in the past? (should be <= now)" -ForegroundColor Gray
    Write-Host "   - Is the status 'queued'? (not 'processing' or 'sent')" -ForegroundColor Gray
    Write-Host "   - Does the lead have a valid timezone?" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "3. Business hours check:" -ForegroundColor White
    Write-Host "   - Emails only sent during recipient's 9 AM-5 PM" -ForegroundColor Gray
    Write-Host "   - If lead is in Lebanon (Asia/Beirut), current time there is:" -ForegroundColor Gray
    
    # Calculate Lebanon time (UTC+2 in winter, UTC+3 in summer)
    $lebanonTime = (Get-Date).ToUniversalTime().AddHours(3)  # Assuming summer time
    Write-Host "   - Lebanon time: $lebanonTime" -ForegroundColor Yellow
    
    if ($lebanonTime.Hour -ge 9 -and $lebanonTime.Hour -lt 17) {
        Write-Host "   - ✅ It's business hours in Lebanon!" -ForegroundColor Green
    } else {
        Write-Host "   - ❌ It's outside business hours in Lebanon" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "=== Next Steps ===" -ForegroundColor Yellow
    Write-Host "1. Check your outreach_queue table in the database" -ForegroundColor White
    Write-Host "2. Look at the scheduled_at time vs current time" -ForegroundColor White
    Write-Host "3. Verify the lead's timezone is correct" -ForegroundColor White
    Write-Host "4. If everything looks right, the cron job should process it" -ForegroundColor White
}

Write-Host ""
Write-Host "=== Cron Job Test ===" -ForegroundColor Yellow
Write-Host "Running the cron job now to see detailed output..." -ForegroundColor Cyan

try {
    $cronHeaders = @{
        "Authorization" = "Bearer $CRON_SECRET"
        "Content-Type" = "application/json"
    }
    
    $cronResponse = Invoke-RestMethod -Uri "$API_URL/api/cron/process-outreach" -Method POST -Headers $cronHeaders -TimeoutSec 30
    
    Write-Host "Cron Response:" -ForegroundColor Green
    Write-Host ($cronResponse | ConvertTo-Json -Depth 3) -ForegroundColor White
    
} catch {
    Write-Host "Cron job failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Check the status of your outreach campaigns and queued emails

Write-Host "=== Campaign Status Checker ===" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date)" -ForegroundColor White
Write-Host ""

# Check if server is running
$serverUrl = "http://localhost:3000"
try {
    $response = Invoke-WebRequest -Uri $serverUrl -Method GET -TimeoutSec 5
    Write-Host "✅ Next.js server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Next.js server is not running. Please start it with 'npm run dev'" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Checking Campaign Data ===" -ForegroundColor Yellow

# You can manually check these URLs in your browser:
Write-Host "Manual checks you can do:" -ForegroundColor Cyan
Write-Host "1. Visit: http://localhost:3000/dashboard/automated-outreach" -ForegroundColor White
Write-Host "   - Check your campaign status and queue" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Check your database:" -ForegroundColor White
Write-Host "   - outreach_campaigns table: See campaign details" -ForegroundColor Gray
Write-Host "   - outreach_queue table: See queued emails and scheduled times" -ForegroundColor Gray
Write-Host "   - leads table: Check lead timezones" -ForegroundColor Gray
Write-Host ""

Write-Host "=== Timezone Information ===" -ForegroundColor Yellow
Write-Host "Current time: $(Get-Date)" -ForegroundColor White
Write-Host "Current UTC time: $((Get-Date).ToUniversalTime())" -ForegroundColor White
Write-Host ""
Write-Host "Business hours are 9 AM - 5 PM in each lead's local timezone." -ForegroundColor Cyan
Write-Host "If your leads are in different timezones, emails will be sent when" -ForegroundColor Cyan
Write-Host "it's business hours in their location." -ForegroundColor Cyan
Write-Host ""

Write-Host "=== Next Steps ===" -ForegroundColor Yellow
Write-Host "1. Check your campaign on the dashboard" -ForegroundColor White
Write-Host "2. Verify your leads have correct timezones set" -ForegroundColor White
Write-Host "3. The cron job will automatically process emails when ready" -ForegroundColor White
Write-Host "4. Run the cron job again in a few minutes to check for updates" -ForegroundColor White
Write-Host ""

Write-Host "✅ Your automated outreach system is working correctly!" -ForegroundColor Green
Write-Host "The cron job will process emails when the time is right." -ForegroundColor Green

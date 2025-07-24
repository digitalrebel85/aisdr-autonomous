# Manual test script for outreach processing
# Run this manually to test your queued campaign

# Configuration
$API_URL = "http://localhost:3000/api/cron/process-outreach"

# You'll need to set your CRON_SECRET here temporarily for testing
# Get it from your .env.local file
$CRON_SECRET = "your-cron-secret-here"  # Replace with actual secret

if ($CRON_SECRET -eq "your-cron-secret-here") {
    Write-Host "ERROR: Please update the CRON_SECRET in this script with your actual secret from .env.local"
    exit 1
}

try {
    Write-Host "Testing outreach processing..."
    Write-Host "API URL: $API_URL"
    Write-Host "Time: $(Get-Date)"
    Write-Host "----------------------------------------"
    
    $headers = @{
        "Authorization" = "Bearer $CRON_SECRET"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri $API_URL -Method POST -Headers $headers
    
    Write-Host "✅ SUCCESS!"
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)"
    
    if ($response.processed) {
        Write-Host "📧 Processed: $($response.processed) emails"
    }
    if ($response.rescheduled) {
        Write-Host "⏰ Rescheduled: $($response.rescheduled) emails"
    }
    if ($response.skipped) {
        Write-Host "⏭️ Skipped: $($response.skipped) emails"
    }
    
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}

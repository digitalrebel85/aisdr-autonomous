# PowerShell script to call the outreach processing cron job
# Save this as: scripts/process-outreach-cron.ps1

# Configuration
$API_URL = "http://localhost:3000/api/cron/process-outreach"
$CRON_SECRET = $env:CRON_SECRET

Write-Host "=== AISDR Outreach Cron Job ===" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date)" -ForegroundColor White
Write-Host "API URL: $API_URL" -ForegroundColor White

# Validate CRON_SECRET
if (-not $CRON_SECRET) {
    Write-Host "ERROR: CRON_SECRET environment variable not set" -ForegroundColor Red
    Write-Host "Make sure the batch file properly loaded it from .env.local" -ForegroundColor Yellow
    exit 1
}

if ($CRON_SECRET.Length -lt 10) {
    Write-Host "WARNING: CRON_SECRET seems too short (less than 10 characters)" -ForegroundColor Yellow
}

$secretPreview = $CRON_SECRET.Substring(0, [Math]::Min(8, $CRON_SECRET.Length))
Write-Host "CRON_SECRET loaded: $secretPreview..." -ForegroundColor Green

# Prepare headers
$headers = @{
    "Authorization" = "Bearer $CRON_SECRET"
    "Content-Type" = "application/json"
}

Write-Host "Making API request..." -ForegroundColor Cyan
Write-Host "Headers: Authorization=Bearer $secretPreview..." -ForegroundColor Gray

try {
    # Make the API call
    $response = Invoke-RestMethod -Uri $API_URL -Method POST -Headers $headers -TimeoutSec 30
    
    # Success response
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor White
    
    if ($response.processed) {
        Write-Host "Processed: $($response.processed) emails" -ForegroundColor Green
    }
    if ($response.rescheduled) {
        Write-Host "Rescheduled: $($response.rescheduled) emails" -ForegroundColor Yellow
    }
    if ($response.skipped) {
        Write-Host "Skipped: $($response.skipped) emails" -ForegroundColor Cyan
    }
    
    Write-Host "Cron job completed successfully!" -ForegroundColor Green
    
} catch {
    # Error handling
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "HTTP Status: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 401) {
            Write-Host "Authentication failed - check your CRON_SECRET" -ForegroundColor Yellow
            Write-Host "Expected format: Bearer <your-secret>" -ForegroundColor Gray
        }
        
        # Try to read response body
        $responseBody = ""
        if ($_.Exception.Response.GetResponseStream) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            $reader.Close()
            if ($responseBody) {
                Write-Host "Response Body: $responseBody" -ForegroundColor Gray
            }
        }
    }
    
    Write-Host "Cron job failed!" -ForegroundColor Red
    exit 1
}

Write-Host "=== End of Cron Job ===" -ForegroundColor Cyan

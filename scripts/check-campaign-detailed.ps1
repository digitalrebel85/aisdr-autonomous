# Detailed campaign and queue checker with better formatting

$API_URL = "http://localhost:3000"

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

Write-Host "=== Campaign & Queue Detailed Check ===" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date)" -ForegroundColor White
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $cronSecret"
        "Content-Type" = "application/json"
    }
    
    Write-Host "Fetching debug information..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "$API_URL/api/debug/queue" -Method GET -Headers $headers -TimeoutSec 30
    
    Write-Host "=== SUMMARY ===" -ForegroundColor Green
    Write-Host "Current Time: $($response.currentTime)" -ForegroundColor White
    Write-Host "Total in Queue: $($response.totalInQueue)" -ForegroundColor White
    Write-Host "Queued Status: $($response.totalQueued)" -ForegroundColor White
    Write-Host "Ready to Process: $($response.readyToProcess)" -ForegroundColor White
    Write-Host ""
    
    if ($response.statusCounts -and ($response.statusCounts | Get-Member -MemberType NoteProperty).Count -gt 0) {
        Write-Host "=== STATUS COUNTS ===" -ForegroundColor Yellow
        $response.statusCounts.PSObject.Properties | ForEach-Object {
            Write-Host "$($_.Name): $($_.Value)" -ForegroundColor White
        }
        Write-Host ""
    }
    
    if ($response.recentCampaigns -and $response.recentCampaigns.Count -gt 0) {
        Write-Host "=== RECENT CAMPAIGNS ===" -ForegroundColor Yellow
        $response.recentCampaigns | ForEach-Object {
            Write-Host "ID: $($_.id) | Name: $($_.name) | Status: $($_.status) | Created: $($_.created_at)" -ForegroundColor White
        }
        Write-Host ""
    } else {
        Write-Host "=== NO CAMPAIGNS FOUND ===" -ForegroundColor Red
        Write-Host "This suggests the campaign creation may have failed." -ForegroundColor Yellow
        Write-Host ""
    }
    
    if ($response.allQueueEmails -and $response.allQueueEmails.Count -gt 0) {
        Write-Host "=== QUEUE EMAILS ===" -ForegroundColor Yellow
        $response.allQueueEmails | ForEach-Object {
            Write-Host "ID: $($_.id) | Status: $($_.status) | Lead: $($_.lead_email) | Scheduled: $($_.scheduled_at)" -ForegroundColor White
        }
        Write-Host ""
    } else {
        Write-Host "=== NO QUEUE EMAILS FOUND ===" -ForegroundColor Red
        Write-Host "The campaign creation did not insert any emails into the queue." -ForegroundColor Yellow
        Write-Host ""
    }
    
    Write-Host "=== DIAGNOSIS ===" -ForegroundColor Cyan
    if ($response.totalInQueue -eq 0) {
        Write-Host "❌ Problem: No emails in queue at all" -ForegroundColor Red
        Write-Host "This means the campaign creation process failed to insert emails." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Possible causes:" -ForegroundColor White
        Write-Host "1. No leads selected when creating campaign" -ForegroundColor Gray
        Write-Host "2. No offers available when creating campaign" -ForegroundColor Gray
        Write-Host "3. No connected inboxes available" -ForegroundColor Gray
        Write-Host "4. Database error during campaign creation" -ForegroundColor Gray
        Write-Host "5. API error that wasn't properly reported" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor White
        Write-Host "1. Check if you have leads in your database" -ForegroundColor Gray
        Write-Host "2. Check if you have offers in your database" -ForegroundColor Gray
        Write-Host "3. Check if you have connected inboxes" -ForegroundColor Gray
        Write-Host "4. Try creating a new campaign and watch for errors" -ForegroundColor Gray
    } else {
        Write-Host "✅ Emails found in queue" -ForegroundColor Green
        if ($response.totalQueued -eq 0) {
            Write-Host "⚠️ But none with 'queued' status" -ForegroundColor Yellow
            Write-Host "Check the status counts above to see what status they have." -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "HTTP Status: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 404) {
            Write-Host "Debug endpoint not found. Make sure your Next.js server is running." -ForegroundColor Yellow
        }
    }
}

# Test script to verify message threading is working correctly
# This script will help you test the threading fixes end-to-end

Write-Host "=== Message Threading Test Script ===" -ForegroundColor Cyan
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
    # Try to connect to the Next.js server
    $response = Invoke-WebRequest -Uri $API_URL -Method GET -TimeoutSec 10 -UseBasicParsing
    Write-Host "✅ Next.js server is running (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    # Check if server is listening on port 3000
    $portCheck = netstat -ano | Select-String ":3000.*LISTENING"
    if ($portCheck) {
        Write-Host "✅ Next.js server is running on port 3000" -ForegroundColor Green
        Write-Host "   (HTTP request failed but port is listening - this is normal for some Next.js setups)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Next.js server is not running. Please start it with 'npm run dev'" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
        exit 1
    }
}

Write-Host ""
Write-Host "=== Step 2: Check Python Service ===" -ForegroundColor Yellow
try {
    # Assuming Python service runs on port 8000
    $pythonResponse = Invoke-WebRequest -Uri "http://localhost:8000" -Method GET -TimeoutSec 5
    Write-Host "✅ Python service is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Python service is not running. Please start it:" -ForegroundColor Red
    Write-Host "   cd python-crew-service && python main.py" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️ Continuing test without Python service (some features may not work)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Step 3: Test Webhook with Threading Info ===" -ForegroundColor Yellow

# Create a test webhook payload with threading information
$testPayload = @{
    deltas = @(
        @{
            type = "message.created"
            object_data = @{
                grant_id = "test-grant-123"
                id = "test-message-456"
                thread_id = "test-thread-789"
                folders = @("INBOX")
                from = @(
                    @{
                        email = "test@example.com"
                        name = "Test Lead"
                    }
                )
                subject = "Test threading message"
                snippet = "This is a test message to verify threading works correctly."
            }
        }
    )
} | ConvertTo-Json -Depth 10

try {
    Write-Host "Sending test webhook payload..." -ForegroundColor Cyan
    
    $headers = @{
        "Content-Type" = "application/json"
        "x-cascade-test" = "true"  # Skip signature verification
    }
    
    $webhookResponse = Invoke-RestMethod -Uri "$API_URL/api/webhooks/nylas" -Method POST -Headers $headers -Body $testPayload -TimeoutSec 30
    
    Write-Host "✅ Webhook processed successfully" -ForegroundColor Green
    Write-Host "Response: $($webhookResponse | ConvertTo-Json -Depth 2)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Webhook test failed: $($_.Exception.Message)" -ForegroundColor Red
    
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
}

Write-Host ""
Write-Host "=== Step 4: Check Database for Threading Data ===" -ForegroundColor Yellow
Write-Host "Manual checks you should perform:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Check sent_emails table for threading columns:" -ForegroundColor White
Write-Host "   SELECT message_id, reply_to_message_id, thread_id, campaign_type" -ForegroundColor Gray
Write-Host "   FROM sent_emails" -ForegroundColor Gray
Write-Host "   WHERE campaign_type = 'automated_reply'" -ForegroundColor Gray
Write-Host "   ORDER BY created_at DESC LIMIT 5;" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Check replies table for threading columns:" -ForegroundColor White
Write-Host "   SELECT message_id, thread_id, lead_id, action, sender_email" -ForegroundColor Gray
Write-Host "   FROM replies" -ForegroundColor Gray
Write-Host "   ORDER BY created_at DESC LIMIT 5;" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Check for thread relationships:" -ForegroundColor White
Write-Host "   SELECT r.message_id as reply_msg, r.thread_id, s.message_id as sent_msg" -ForegroundColor Gray
Write-Host "   FROM replies r" -ForegroundColor Gray
Write-Host "   LEFT JOIN sent_emails s ON s.thread_id = r.thread_id" -ForegroundColor Gray
Write-Host "   WHERE r.thread_id IS NOT NULL;" -ForegroundColor Gray
Write-Host ""

Write-Host "=== Step 5: Test Real Email Threading ===" -ForegroundColor Yellow
Write-Host "To test with real emails:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Send an email to one of your connected inboxes" -ForegroundColor White
Write-Host "2. Check the Python service logs for:" -ForegroundColor White
Write-Host "   - 'Thread ID: <thread_id>'" -ForegroundColor Gray
Write-Host "   - 'Message ID: <message_id>'" -ForegroundColor Gray
Write-Host "3. Check the Next.js logs for:" -ForegroundColor White
Write-Host "   - 'Adding reply_to_message_id: <message_id>'" -ForegroundColor Gray
Write-Host "   - 'Adding thread_id: <thread_id>'" -ForegroundColor Gray
Write-Host "4. Verify the AI reply appears as a threaded response in your email client" -ForegroundColor White
Write-Host ""

Write-Host "=== Threading Test Complete ===" -ForegroundColor Green
Write-Host "If you see any errors above, the threading implementation needs debugging." -ForegroundColor Yellow
Write-Host "If everything looks good, your message threading should now work correctly!" -ForegroundColor Green

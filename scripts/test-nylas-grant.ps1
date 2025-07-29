# Test script to check Nylas grant status and API connectivity
Write-Host "=== Nylas Grant Test Script ===" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date)" -ForegroundColor White
Write-Host ""

$API_KEY = "nyk_v0_DzGniSneYEgTYHjxjT7CHwChVxBVevSk7XAB20dA6jbwzAI4jSP65u643PkEi849"
$GRANT_ID = "b4e85802-1d5c-49b8-9b64-be68a40272c7"
$BASE_URL = "https://api.us.nylas.com/v3"

Write-Host "=== Step 1: Test API Key with /grants endpoint ===" -ForegroundColor Yellow
try {
    $headers = @{
        'Authorization' = "Bearer $API_KEY"
        'Content-Type' = 'application/json'
    }
    
    $response = Invoke-RestMethod -Uri "$BASE_URL/grants" -Headers $headers -Method GET -TimeoutSec 10
    Write-Host "✅ API Key is valid. Found $($response.data.Count) grants:" -ForegroundColor Green
    
    foreach ($grant in $response.data) {
        $status = if ($grant.grant_status -eq "valid") { "✅" } else { "❌" }
        Write-Host "   $status Grant: $($grant.id) - $($grant.email) - Status: $($grant.grant_status)" -ForegroundColor White
        
        if ($grant.id -eq $GRANT_ID) {
            Write-Host "   🎯 Found target grant! Status: $($grant.grant_status)" -ForegroundColor Green
        }
    }
    
} catch {
    Write-Host "❌ API Key test failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""
Write-Host "=== Step 2: Test Specific Grant Access ===" -ForegroundColor Yellow
try {
    $grantResponse = Invoke-RestMethod -Uri "$BASE_URL/grants/$GRANT_ID" -Headers $headers -Method GET -TimeoutSec 10
    Write-Host "✅ Grant access successful!" -ForegroundColor Green
    Write-Host "   Grant ID: $($grantResponse.id)" -ForegroundColor White
    Write-Host "   Email: $($grantResponse.email)" -ForegroundColor White
    Write-Host "   Status: $($grantResponse.grant_status)" -ForegroundColor White
    Write-Host "   Provider: $($grantResponse.provider)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Grant access failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   This means the grant is expired or invalid" -ForegroundColor Yellow
        Write-Host "   You need to reconnect your inbox to get a new grant" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Step 3: Test Message Access ===" -ForegroundColor Yellow
$TEST_MESSAGE_ID = "198557114f07d6a5"
try {
    $messageResponse = Invoke-RestMethod -Uri "$BASE_URL/grants/$GRANT_ID/messages/$TEST_MESSAGE_ID" -Headers $headers -Method GET -TimeoutSec 10
    Write-Host "✅ Message access successful!" -ForegroundColor Green
    Write-Host "   Message ID: $($messageResponse.id)" -ForegroundColor White
    Write-Host "   Subject: $($messageResponse.subject)" -ForegroundColor White
    Write-Host "   Thread ID: $($messageResponse.thread_id)" -ForegroundColor White
    Write-Host "   From: $($messageResponse.from[0].email)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Message access failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   This confirms the grant is expired/invalid" -ForegroundColor Yellow
    } elseif ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   Message not found (this is normal for test messages)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "If you see 401 errors above, you need to:" -ForegroundColor Yellow
Write-Host "1. Go to your app's settings page" -ForegroundColor White
Write-Host "2. Disconnect and reconnect your inbox" -ForegroundColor White
Write-Host "3. This will generate a new valid grant_id" -ForegroundColor White
Write-Host "4. Update your test data to use the new grant_id" -ForegroundColor White

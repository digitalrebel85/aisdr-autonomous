# Compare API keys between .env.local and python-crew-service/.env
# This will help identify if there's a mismatch

Write-Host "=== API Key Comparison Script ===" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date)" -ForegroundColor White
Write-Host ""

# Function to safely read env file and extract API key
function Get-ApiKeyFromFile($filePath) {
    if (-not (Test-Path $filePath)) {
        return $null
    }
    
    $content = Get-Content $filePath
    foreach ($line in $content) {
        if ($line -match "^NYLAS_API_KEY=(.+)$") {
            return $matches[1].Trim('"')  # Remove quotes if present
        }
    }
    return $null
}

# Get API keys from both files
$mainApiKey = Get-ApiKeyFromFile ".env.local"
$pythonApiKey = Get-ApiKeyFromFile "python-crew-service\.env"

Write-Host "=== API Key Analysis ===" -ForegroundColor Yellow
Write-Host ""

if ($mainApiKey) {
    Write-Host "✅ Main app (.env.local) API key found:" -ForegroundColor Green
    Write-Host "   Length: $($mainApiKey.Length)" -ForegroundColor White
    Write-Host "   Starts: $($mainApiKey.Substring(0, [Math]::Min(20, $mainApiKey.Length)))..." -ForegroundColor White
    Write-Host "   Ends: ...$($mainApiKey.Substring([Math]::Max(0, $mainApiKey.Length - 10)))" -ForegroundColor White
} else {
    Write-Host "❌ Main app API key NOT found in .env.local" -ForegroundColor Red
}

Write-Host ""

if ($pythonApiKey) {
    Write-Host "✅ Python service API key found:" -ForegroundColor Green
    Write-Host "   Length: $($pythonApiKey.Length)" -ForegroundColor White
    Write-Host "   Starts: $($pythonApiKey.Substring(0, [Math]::Min(20, $pythonApiKey.Length)))..." -ForegroundColor White
    Write-Host "   Ends: ...$($pythonApiKey.Substring([Math]::Max(0, $pythonApiKey.Length - 10)))" -ForegroundColor White
} else {
    Write-Host "❌ Python service API key NOT found in python-crew-service\.env" -ForegroundColor Red
}

Write-Host ""

# Compare the keys
if ($mainApiKey -and $pythonApiKey) {
    if ($mainApiKey -eq $pythonApiKey) {
        Write-Host "✅ API keys MATCH between both files" -ForegroundColor Green
        Write-Host "   The 401 error is likely due to an expired or invalid API key" -ForegroundColor Yellow
        Write-Host "   You may need to generate a new API key in your Nylas dashboard" -ForegroundColor Yellow
    } else {
        Write-Host "❌ API keys DO NOT MATCH!" -ForegroundColor Red
        Write-Host "   Main app length: $($mainApiKey.Length)" -ForegroundColor White
        Write-Host "   Python service length: $($pythonApiKey.Length)" -ForegroundColor White
        Write-Host "   You need to copy the correct API key to both files" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Cannot compare - one or both API keys are missing" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan

if ($mainApiKey -and $pythonApiKey -and ($mainApiKey -eq $pythonApiKey)) {
    Write-Host "1. The API key format and matching is correct" -ForegroundColor White
    Write-Host "2. The issue is likely that your Nylas API key is expired or invalid" -ForegroundColor White
    Write-Host "3. Go to your Nylas dashboard: https://dashboard.nylas.com/" -ForegroundColor White
    Write-Host "4. Generate a new API key" -ForegroundColor White
    Write-Host "5. Update both .env.local and python-crew-service\.env with the new key" -ForegroundColor White
    Write-Host "6. Restart both Next.js and Python services" -ForegroundColor White
} elseif (-not $mainApiKey -or -not $pythonApiKey) {
    Write-Host "1. Add the missing NYLAS_API_KEY to the file(s) that don't have it" -ForegroundColor White
    Write-Host "2. Ensure both files have the exact same API key" -ForegroundColor White
    Write-Host "3. Remove any quotes around the API key value" -ForegroundColor White
} else {
    Write-Host "1. Copy the API key from .env.local to python-crew-service\.env" -ForegroundColor White
    Write-Host "2. Ensure both have the exact same value" -ForegroundColor White
    Write-Host "3. Remove any quotes around the API key value" -ForegroundColor White
    Write-Host "4. Restart both services" -ForegroundColor White
}

Write-Host ""
Write-Host "=== Test Your API Key ===" -ForegroundColor Cyan
Write-Host "You can test your API key directly with curl:" -ForegroundColor White
if ($mainApiKey) {
    Write-Host "curl -H `"Authorization: Bearer $mainApiKey`" https://api.us.nylas.com/v3/grants" -ForegroundColor Gray
}

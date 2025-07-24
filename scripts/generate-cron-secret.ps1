# Generate a secure CRON_SECRET for your .env.local file

Write-Host "=== CRON_SECRET Generator ===" -ForegroundColor Cyan

# Generate a random 32-character alphanumeric string
$chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
$secret = ""
for ($i = 0; $i -lt 32; $i++) {
    $secret += $chars[(Get-Random -Maximum $chars.Length)]
}

Write-Host ""
Write-Host "Generated CRON_SECRET:" -ForegroundColor Green
Write-Host $secret -ForegroundColor Yellow
Write-Host ""
Write-Host "Add this line to your .env.local file (WITHOUT quotes):" -ForegroundColor Cyan
Write-Host "CRON_SECRET=$secret" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Remove any quotes around the secret in .env.local!" -ForegroundColor Red
Write-Host "Correct format:   CRON_SECRET=$secret" -ForegroundColor Green
Write-Host "Incorrect format: CRON_SECRET=`"$secret`"" -ForegroundColor Red
Write-Host ""

# Copy to clipboard if possible
try {
    $secret | Set-Clipboard
    Write-Host "✅ Secret copied to clipboard!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not copy to clipboard, please copy manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open your .env.local file" -ForegroundColor White
Write-Host "2. Find the CRON_SECRET line" -ForegroundColor White
Write-Host "3. Replace it with: CRON_SECRET=$secret" -ForegroundColor White
Write-Host "4. Save the file" -ForegroundColor White
Write-Host "5. Run the cron script again" -ForegroundColor White

@echo off
REM Simple test for the debug queue endpoint

cd /d "c:\Users\chris\OneDrive\Desktop\aisdrnewstyle"

REM Load CRON_SECRET from .env.local
for /f "usebackq tokens=1,2 delims== eol=#" %%a in (".env.local") do (
    if "%%a"=="CRON_SECRET" (
        set "CRON_SECRET=%%b"
    )
)

echo Testing debug queue endpoint...
echo CRON_SECRET: %CRON_SECRET:~0,8%...

REM Use curl to test the endpoint
curl -X GET "http://localhost:3000/api/debug/queue" ^
  -H "Authorization: Bearer %CRON_SECRET%" ^
  -H "Content-Type: application/json"

echo.
echo.
pause

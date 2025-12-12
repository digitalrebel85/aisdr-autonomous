@echo off
REM Batch file to run the outreach cron job
REM Make sure your .env.local has CRON_SECRET set

cd /d "c:\Users\chris\OneDrive\Documents\GitHub\aisdrnewstyle"

REM Check if .env.local exists
if not exist ".env.local" (
    echo ERROR: .env.local file not found!
    echo Please create .env.local with CRON_SECRET=your-secret-here
    pause
    exit /b 1
)

REM Load environment variables from .env.local (skip empty lines and comments)
for /f "usebackq tokens=1,2 delims== eol=#" %%a in (".env.local") do (
    if "%%a"=="CRON_SECRET" (
        set "CRON_SECRET=%%b"
        echo Found CRON_SECRET in .env.local
    )
)

REM Check if CRON_SECRET was loaded
if not defined CRON_SECRET (
    echo ERROR: CRON_SECRET not found in .env.local
    echo Please add: CRON_SECRET=your-secret-here
    pause
    exit /b 1
)

echo Using CRON_SECRET: %CRON_SECRET:~0,8%...
echo Running outreach cron job...

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "scripts\process-outreach-cron.ps1"

if %ERRORLEVEL% neq 0 (
    echo ERROR: PowerShell script failed with exit code %ERRORLEVEL%
    pause
)

echo Cron job completed.
pause

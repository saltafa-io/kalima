@echo off
setlocal

echo ==================================
echo  Kalima Build and Deploy Script
echo ==================================
echo.

REM --- Auto-increment version ---
echo --- Determining new version...
set "last_version="
for /f "tokens=3" %%a in ('findstr /R /C:"^- [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] v[0-9]*\.[0-9]*\.[0-9]*" "docs\PROJECT.md"') do (
    set "last_version=%%a"
    goto :found_version
)

:found_version
if not defined last_version (
    echo Could not find previous version in docs/PROJECT.md. Using v0.1.0.
    set "version=v0.1.0"
) else (
    for /f "tokens=1,2,3 delims=.v" %%a in ("%last_version%") do (
        set /a "patch=%%c + 1"
        call set "version=v%%a.%%b.%%patch%%"
    )
)
echo New version: %version%
echo.

REM Prompt for commit message
set /p message="Enter commit message description: "
if not defined message (
    echo Commit message is required. Aborting.
    goto :eof
)

echo.
echo --- Cleaning old build cache ---
if exist .next (
    rmdir /s /q .next
)
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
)
echo.
echo --- Running build ---
call npm run build

REM Check if build was successful
if %errorlevel% neq 0 (
    echo.
    echo BUILD FAILED. Aborting git push.
    pause
    goto :eof
)

echo [STEP 2/3] Build successful.
echo.
echo --- Staging, Committing, and Pushing to Git ---

REM Get current date in YYYY-MM-DD format
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%"
set "MM=%dt:~4,2%"
set "DD=%dt:~6,2%"
set "current_date=%YYYY%-%MM%-%DD%"

REM Construct commit message
set "commit_message=%current_date% %version% - %message%"

REM Git commands
echo [STEP 3/3] Adding files, committing with message: "%commit_message%", and pushing...
echo.
git add .
git commit -m "%commit_message%"
git push

echo.
echo --- Deployment script finished. ---

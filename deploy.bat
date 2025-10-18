@echo off
setlocal

echo ==================================
echo  Kalima Build and Deploy Script
echo ==================================
echo.

REM Prompt for version and commit message
set /p version="Enter version (e.g., v0.5.0): "
if not defined version (
    echo Version is required. Aborting.
    goto :eof
)

set /p message="Enter commit message: "
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
echo --- Done! ---
pause

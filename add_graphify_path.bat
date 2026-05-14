@echo off
rem Add Graphify executable folder to PATH for this session
set "GRAPHIFY_DIR=C:\\Python313\\Scripts"
rem Avoid duplicate entries
echo %PATH% | find /I "%GRAPHIFY_DIR%" >nul
if errorlevel 1 (
    set "PATH=%GRAPHIFY_DIR%;%PATH%"
    echo Added %GRAPHIFY_DIR% to PATH.
) else (
    echo %GRAPHIFY_DIR% is already in PATH.
)
rem Run any command you need after this script, e.g., graphify . --update

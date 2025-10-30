@echo off
echo.
echo Clearing Hytopia cache...
echo.

if exist .hytopia (
    rmdir /s /q .hytopia
    echo [OK] Cleared .hytopia folder
)

if exist index.mjs (
    del /f index.mjs
    echo [OK] Deleted index.mjs
)

echo.
echo Cache cleared! Starting server...
echo.
echo ============================================================
hytopia start

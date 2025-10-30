# Clear Hytopia build cache
# Run this if you get errors after changing code

Write-Host "🧹 Clearing Hytopia build cache..." -ForegroundColor Yellow

# Remove .hytopia cache directory
if (Test-Path ".hytopia") {
    Remove-Item -Recurse -Force ".hytopia"
    Write-Host "✅ Cleared .hytopia cache" -ForegroundColor Green
}

# Remove bundled index.mjs
if (Test-Path "index.mjs") {
    Remove-Item -Force "index.mjs"
    Write-Host "✅ Cleared index.mjs bundle" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Cache cleared! Now run: hytopia start" -ForegroundColor Green

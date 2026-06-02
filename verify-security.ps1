# ════════════════════════════════════════════════════════════════════════════
# KIMatrix Web Frontend - Security Verification Script (PowerShell)
# ════════════════════════════════════════════════════════════════════════════
# Run this before pushing to verify no sensitive data is committed
# Usage: .\verify-security.ps1
# ════════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "🔒 KIMatrix Web - Security Verification" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$Errors = 0

# ────────────────────────────────────────────────────────────────────────────
# Check 1: No .env files (except .env.example)
# ────────────────────────────────────────────────────────────────────────────
Write-Host "✓ Checking environment files..." -ForegroundColor Yellow
$envFiles = git ls-files | Select-String -Pattern "^\.env$|^\.env\.local$|\.env\.development\.local$|\.env\.production\.local$"
if ($envFiles) {
    Write-Host "  ❌ ERROR: .env files found in staging area" -ForegroundColor Red
    $envFiles | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
    $Errors++
} else {
    Write-Host "  ✓ No sensitive .env files staged" -ForegroundColor Green
}

# ────────────────────────────────────────────────────────────────────────────
# Check 2: No secrets in staged files
# ────────────────────────────────────────────────────────────────────────────
Write-Host "✓ Scanning for secrets in staged files..." -ForegroundColor Yellow
$secrets = git diff --cached | Select-String -Pattern "password\s*=\s*['\`"][^'\`"]{3,}|api_key\s*=\s*['\`"][^'\`"]{10,}|secret\s*=\s*['\`"][^'\`"]{10,}" -CaseSensitive:$false
if ($secrets) {
    Write-Host "  ⚠️  WARNING: Potential secrets detected in staged changes" -ForegroundColor Yellow
    Write-Host "  Review the following matches:" -ForegroundColor Yellow
    $secrets | Select-Object -First 5 | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }
    $Errors++
} else {
    Write-Host "  ✓ No obvious secrets detected" -ForegroundColor Green
}

# ────────────────────────────────────────────────────────────────────────────
# Check 3: No node_modules
# ────────────────────────────────────────────────────────────────────────────
Write-Host "✓ Checking for node_modules..." -ForegroundColor Yellow
$nodeModules = git ls-files | Select-String -Pattern "node_modules/"
if ($nodeModules) {
    Write-Host "  ❌ ERROR: node_modules found in staging area" -ForegroundColor Red
    $Errors++
} else {
    Write-Host "  ✓ node_modules not staged" -ForegroundColor Green
}

# ────────────────────────────────────────────────────────────────────────────
# Check 4: No build outputs
# ────────────────────────────────────────────────────────────────────────────
Write-Host "✓ Checking for build outputs..." -ForegroundColor Yellow
$buildOutputs = git ls-files | Select-String -Pattern "^\.next/|^out/|^dist/|^build/"
if ($buildOutputs) {
    Write-Host "  ⚠️  WARNING: Build output directories found" -ForegroundColor Yellow
    $Errors++
} else {
    Write-Host "  ✓ No build outputs staged" -ForegroundColor Green
}

# ────────────────────────────────────────────────────────────────────────────
# Check 5: Essential files exist
# ────────────────────────────────────────────────────────────────────────────
Write-Host "✓ Verifying essential files..." -ForegroundColor Yellow
$MissingFiles = 0

if (-not (Test-Path ".gitignore")) {
    Write-Host "  ❌ Missing: .gitignore" -ForegroundColor Red
    $MissingFiles++
}

if (-not (Test-Path ".env.example")) {
    Write-Host "  ❌ Missing: .env.example" -ForegroundColor Red
    $MissingFiles++
}

if (-not (Test-Path "package.json")) {
    Write-Host "  ❌ Missing: package.json" -ForegroundColor Red
    $MissingFiles++
}

if ($MissingFiles -eq 0) {
    Write-Host "  ✓ All essential files present" -ForegroundColor Green
} else {
    $Errors++
}

# ────────────────────────────────────────────────────────────────────────────
# Check 6: No large files
# ────────────────────────────────────────────────────────────────────────────
Write-Host "✓ Checking for large files..." -ForegroundColor Yellow
$largeFiles = git ls-files | Where-Object { 
    (Test-Path $_) -and ((Get-Item $_).Length -gt 1MB)
}
if ($largeFiles) {
    Write-Host "  ⚠️  WARNING: Large files detected (>1MB):" -ForegroundColor Yellow
    $largeFiles | Select-Object -First 5 | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }
    Write-Host "  Consider using Git LFS for large files" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ No large files detected" -ForegroundColor Green
}

# ────────────────────────────────────────────────────────────────────────────
# Summary
# ────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
if ($Errors -eq 0) {
    Write-Host "✅ Security verification passed!" -ForegroundColor Green
    Write-Host "Safe to push to repository." -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Security verification failed with $Errors error(s)" -ForegroundColor Red
    Write-Host "Fix issues above before pushing." -ForegroundColor Red
    exit 1
}

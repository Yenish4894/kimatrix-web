#!/bin/bash

# ════════════════════════════════════════════════════════════════════════════
# KIMatrix Web Frontend - Security Verification Script
# ════════════════════════════════════════════════════════════════════════════
# Run this before pushing to verify no sensitive data is committed
# Usage: ./verify-security.sh
# ════════════════════════════════════════════════════════════════════════════

set -e

echo ""
echo "🔒 KIMatrix Web - Security Verification"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

ERRORS=0

# ────────────────────────────────────────────────────────────────────────────
# Check 1: No .env files (except .env.example)
# ────────────────────────────────────────────────────────────────────────────
echo "✓ Checking environment files..."
if git ls-files | grep -E "^\.env$|^\.env\.local$|\.env\.development\.local$|\.env\.production\.local$" > /dev/null 2>&1; then
    echo "  ❌ ERROR: .env files found in staging area"
    git ls-files | grep -E "^\.env$|^\.env\.local$"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✓ No sensitive .env files staged"
fi

# ────────────────────────────────────────────────────────────────────────────
# Check 2: No secrets in staged files
# ────────────────────────────────────────────────────────────────────────────
echo "✓ Scanning for secrets in staged files..."
if git diff --cached | grep -iE "password\s*=\s*['\"][^'\"]{3,}|api_key\s*=\s*['\"][^'\"]{10,}|secret\s*=\s*['\"][^'\"]{10,}" > /dev/null 2>&1; then
    echo "  ⚠️  WARNING: Potential secrets detected in staged changes"
    echo "  Review the following matches:"
    git diff --cached | grep -iE "password\s*=\s*['\"][^'\"]{3,}|api_key\s*=\s*['\"][^'\"]{10,}|secret\s*=\s*['\"][^'\"]{10,}" | head -5
    ERRORS=$((ERRORS + 1))
else
    echo "  ✓ No obvious secrets detected"
fi

# ────────────────────────────────────────────────────────────────────────────
# Check 3: No node_modules
# ────────────────────────────────────────────────────────────────────────────
echo "✓ Checking for node_modules..."
if git ls-files | grep "node_modules/" > /dev/null 2>&1; then
    echo "  ❌ ERROR: node_modules found in staging area"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✓ node_modules not staged"
fi

# ────────────────────────────────────────────────────────────────────────────
# Check 4: No build outputs
# ────────────────────────────────────────────────────────────────────────────
echo "✓ Checking for build outputs..."
if git ls-files | grep -E "^\.next/|^out/|^dist/|^build/" > /dev/null 2>&1; then
    echo "  ⚠️  WARNING: Build output directories found"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✓ No build outputs staged"
fi

# ────────────────────────────────────────────────────────────────────────────
# Check 5: Essential files exist
# ────────────────────────────────────────────────────────────────────────────
echo "✓ Verifying essential files..."
MISSING_FILES=0

if [ ! -f ".gitignore" ]; then
    echo "  ❌ Missing: .gitignore"
    MISSING_FILES=$((MISSING_FILES + 1))
fi

if [ ! -f ".env.example" ]; then
    echo "  ❌ Missing: .env.example"
    MISSING_FILES=$((MISSING_FILES + 1))
fi

if [ ! -f "package.json" ]; then
    echo "  ❌ Missing: package.json"
    MISSING_FILES=$((MISSING_FILES + 1))
fi

if [ $MISSING_FILES -eq 0 ]; then
    echo "  ✓ All essential files present"
else
    ERRORS=$((ERRORS + 1))
fi

# ────────────────────────────────────────────────────────────────────────────
# Check 6: No large files
# ────────────────────────────────────────────────────────────────────────────
echo "✓ Checking for large files..."
LARGE_FILES=$(git ls-files | xargs -I {} du -k {} 2>/dev/null | awk '$1 > 1024 {print $2}' || true)
if [ -n "$LARGE_FILES" ]; then
    echo "  ⚠️  WARNING: Large files detected (>1MB):"
    echo "$LARGE_FILES" | head -5
    echo "  Consider using Git LFS for large files"
else
    echo "  ✓ No large files detected"
fi

# ────────────────────────────────────────────────────────────────────────────
# Summary
# ────────────────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════════════════"
if [ $ERRORS -eq 0 ]; then
    echo "✅ Security verification passed!"
    echo "Safe to push to repository."
    exit 0
else
    echo "❌ Security verification failed with $ERRORS error(s)"
    echo "Fix issues above before pushing."
    exit 1
fi

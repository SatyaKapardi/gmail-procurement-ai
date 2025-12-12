#!/bin/bash

# Pre-push safety check script
# Run this before pushing to GitHub to ensure no secrets are committed

echo "Checking for potential secrets and sensitive data..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check for .env files
echo -e "\n${YELLOW}Checking for .env files...${NC}"
if git ls-files | grep -q "\.env$"; then
    echo -e "${RED}ERROR: .env files found in git!${NC}"
    git ls-files | grep "\.env$"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}OK: No .env files in git${NC}"
fi

# Check for common API key patterns
echo -e "\n${YELLOW}Checking for API key patterns...${NC}"
PATTERNS=("gsk_[A-Za-z0-9]" "AIza[0-9A-Za-z_-]" "sk-[0-9A-Za-z]" "xoxb-[0-9A-Za-z]")
FOUND_KEYS=0

for pattern in "${PATTERNS[@]}"; do
    if git grep -q "$pattern" -- ':!node_modules' ':!*.md' 2>/dev/null; then
        echo -e "${RED}WARNING: Potential API key pattern found: $pattern${NC}"
        FOUND_KEYS=1
    fi
done

if [ $FOUND_KEYS -eq 0 ]; then
    echo -e "${GREEN}OK: No API key patterns found${NC}"
else
    ERRORS=$((ERRORS + 1))
fi

# Check for placeholder values that should be replaced
echo -e "\n${YELLOW}Checking for placeholder values...${NC}"
PLACEHOLDERS=("YOUR_GOOGLE_CLIENT_ID" "YOUR_CLOUDFLARE_WORKERS_URL" "YOUR_D1_DATABASE_ID" "YOUR_KV_NAMESPACE_ID")
MISSING_PLACEHOLDERS=0

for placeholder in "${PLACEHOLDERS[@]}"; do
    if ! git grep -q "$placeholder" -- ':!node_modules' ':!*.example' ':!*.md' 2>/dev/null; then
        echo -e "${YELLOW}INFO: Placeholder '$placeholder' not found (may have been replaced)${NC}"
    fi
done

# Check for hardcoded URLs that might contain sensitive info
echo -e "\n${YELLOW}Checking for hardcoded sensitive URLs...${NC}"
if git grep -q "workers\.dev.*bskapardi\|workers\.dev.*[0-9]" -- ':!node_modules' ':!*.md' 2>/dev/null; then
    echo -e "${YELLOW}INFO: Found Workers URL (this is usually safe to commit)${NC}"
fi

# Summary
echo -e "\n${YELLOW}=== Summary ===${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}All checks passed! Safe to push.${NC}"
    exit 0
else
    echo -e "${RED}Found $ERRORS issue(s). Please fix before pushing.${NC}"
    exit 1
fi

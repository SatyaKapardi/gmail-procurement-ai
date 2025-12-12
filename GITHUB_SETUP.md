# GitHub Setup Guide

This guide helps you safely push your project to GitHub without exposing API keys or sensitive information.

## Pre-Push Checklist

Before pushing to GitHub, ensure:

1. All API keys are removed from code files
2. All `.env` files are in `.gitignore`
3. No hardcoded credentials in any files
4. Placeholder values are used instead

## Files That Need Configuration

### 1. Extension Configuration

**File: `extension/manifest.json`**
- Replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` with your actual Google Client ID
- This file is safe to commit (Client ID is public for Chrome extensions)

**File: `extension/sidebar.js`**
- Replace `YOUR_CLOUDFLARE_WORKERS_URL` with your actual Workers URL
- This is safe to commit (URLs are public)

### 2. Backend Configuration

**File: `backend/wrangler.toml`**
- Contains database IDs and KV namespace IDs
- These are safe to commit (they're resource identifiers, not secrets)
- If you want to keep them private, you can use environment variables

**Secrets (NOT in code):**
- All API keys are set via `wrangler secret put` or `.env` files
- Never commit actual API keys

## Safe to Commit

These files are safe to commit to GitHub:

- All source code files (`.js`, `.json`, `.md`, `.css`, `.html`)
- Configuration templates (`.env.example`, `wrangler.toml`)
- Documentation files
- `.gitignore` file

## Never Commit

These should NEVER be committed:

- `.env` files (any variation)
- Files containing actual API keys
- `wrangler.toml.local` (local overrides)
- `.wrangler/` directory (local cache)
- Any file with `secret`, `key`, or `credential` in the name

## Verification Steps

Before pushing, run these checks:

1. **Check for hardcoded API keys:**
   ```bash
   grep -r "gsk_\|AIza\|sk-\|xoxb-" . --exclude-dir=node_modules
   ```
   Should return no results

2. **Verify .env files are ignored:**
   ```bash
   git status
   ```
   Should NOT show any `.env` files

3. **Check for sensitive data:**
   ```bash
   git diff --cached
   ```
   Review all changes before committing

## Initial Git Setup

If this is a new repository:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Check what will be committed
git status

# Verify no sensitive files are included
git ls-files | grep -E "\.env$|secret|key"

# Commit
git commit -m "Initial commit: Gmail Procurement AI Extension"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push
git push -u origin main
```

## If You Accidentally Committed Secrets

If you accidentally committed API keys:

1. **Remove from git history:**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   ```

2. **Or use BFG Repo-Cleaner:**
   ```bash
   bfg --delete-files .env
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

3. **Force push (WARNING: This rewrites history):**
   ```bash
   git push origin --force --all
   ```

4. **Rotate all exposed API keys immediately**

## Recommended Repository Structure

```
your-repo/
├── .gitignore          # Excludes sensitive files
├── .env.example        # Template (safe to commit)
├── README.md           # Project documentation
├── SETUP.md            # Setup instructions
├── ENV_SETUP.md        # Environment variables guide
├── backend/
│   ├── .env.example    # Backend template
│   ├── src/
│   └── wrangler.toml   # Configuration (safe)
└── extension/
    ├── manifest.json   # Extension config (with placeholder)
    └── sidebar.js      # Extension code (with placeholder)
```

## Security Best Practices

1. **Use environment variables** for all secrets
2. **Never hardcode** API keys in source code
3. **Use placeholders** in templates (e.g., `YOUR_API_KEY`)
4. **Review changes** before committing
5. **Rotate keys** if accidentally exposed
6. **Use GitHub Secrets** for CI/CD if needed

## GitHub Repository Settings

After pushing, configure:

1. **Repository Settings → Secrets and variables → Actions**
   - Add secrets for CI/CD if needed

2. **Repository Settings → General → Danger Zone**
   - Enable "Vulnerability alerts"
   - Enable "Dependabot alerts"

3. **Add a Security Policy:**
   - Create `SECURITY.md` with reporting instructions

## Quick Reference

**Safe placeholders to use:**
- `YOUR_GOOGLE_CLIENT_ID` - For OAuth Client ID
- `YOUR_CLOUDFLARE_WORKERS_URL` - For Workers URL
- `YOUR_API_KEY` - For API keys
- `your-email@example.com` - For email addresses

**Never use:**
- Actual API keys
- Real passwords
- Production database credentials
- Private keys or certificates

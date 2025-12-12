# Quick Start Guide

## Before Pushing to GitHub

1. **Run the safety check:**
   ```bash
   ./pre-push-check.sh
   ```

2. **Verify no secrets are committed:**
   ```bash
   git status
   git diff
   ```

3. **If everything looks good, push:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

## After Cloning from GitHub

1. **Copy environment templates:**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp backend/wrangler.toml.example backend/wrangler.toml
   ```

2. **Fill in your values:**
   - Edit `.env` files with your API keys
   - Edit `backend/wrangler.toml` with your database IDs
   - Edit `extension/manifest.json` with your Google Client ID
   - Edit `extension/sidebar.js` with your Workers URL

3. **Set up Cloudflare secrets:**
   ```bash
   cd backend
   wrangler secret put GEMINI_API_KEY
   wrangler secret put GROQ_API_KEY
   # etc.
   ```

## Files You Need to Configure

- `extension/manifest.json` - Replace `YOUR_GOOGLE_CLIENT_ID`
- `extension/sidebar.js` - Replace `YOUR_CLOUDFLARE_WORKERS_URL`
- `backend/wrangler.toml` - Replace `YOUR_D1_DATABASE_ID` and `YOUR_KV_NAMESPACE_ID`
- `.env` files - Add your API keys (not committed to git)

See `GITHUB_SETUP.md` for detailed security guidelines.

# Complete Step-by-Step Setup Guide

This guide will walk you through setting up the Gmail Procurement AI Intelligence Chrome Extension from scratch.

---

## Step 1: Google Cloud Console Setup

**Purpose**: Set up OAuth credentials so the extension can access Gmail on behalf of users.

### 1.1 Create or Select a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click "New Project" or select an existing project
4. Give it a name (e.g., "Gmail Procurement AI")
5. Click "Create"

### 1.2 Enable Gmail API

1. In the left sidebar, go to **APIs & Services** → **Library**
2. In the search bar, type "Gmail API"
3. Click on "Gmail API" from the results
4. Click the **Enable** button
5. Wait for it to enable (may take a few seconds)

**Why**: The extension needs Gmail API access to read emails and extract information.

### 1.3 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials** (in the left sidebar)
2. Click **+ Create Credentials** at the top
3. Select **OAuth client ID**
4. If prompted, configure the OAuth consent screen first:
   - Choose "External" (unless you have a Google Workspace)
   - Fill in app name, user support email, developer email
   - Click "Save and Continue" through the steps
5. Back at credentials creation:
   - **Application type**: Select **Chrome extension** (NOT "Web application")
   - **Name**: Enter a name (e.g., "Gmail Procurement Extension")
   - Click **Create**
6. **Important**: 
   - Copy the **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
   - You do NOT need the Client Secret for Chrome extensions
   - You do NOT need to add redirect URIs (Chrome handles this automatically)
   - If you see errors about redirect URIs, ignore them - they don't apply to Chrome extensions

**Why**: Chrome extensions use `chrome.identity.getAuthToken()` which automatically handles OAuth without needing redirect URIs.

---

## Step 2: Get Google Gemini API Key

**Purpose**: The AI analysis uses Google's Gemini API to summarize emails and generate responses.

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Get API Key** or **Create API Key**
4. Select your project (or create a new one)
5. Copy the API key that appears
6. **Save it securely** - you'll need it in Step 3

**Why**: Gemini API powers the AI analysis that summarizes emails, finds related threads, and generates draft responses.

---

## Step 3: Cloudflare Setup

**Purpose**: Set up the backend server that processes emails and runs AI analysis.

### 3.1 Install Wrangler CLI

1. Open Terminal (Mac) or Command Prompt (Windows)
2. Install Node.js if you don't have it: [nodejs.org](https://nodejs.org/)
3. Install Wrangler globally:
   ```bash
   npm install -g wrangler
   ```
4. Login to Cloudflare:
   ```bash
   wrangler login
   ```
   - This will open a browser window
   - Sign in with your Cloudflare account (create one at [cloudflare.com](https://dash.cloudflare.com/sign-up) if needed)
   - Authorize Wrangler

**Why**: Wrangler is the CLI tool to deploy and manage Cloudflare Workers.

### 3.2 Create D1 Database

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create the database:
   ```bash
   wrangler d1 create procurement-db
   ```
3. **Copy the `database_id`** from the output (looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
   - You'll see a line like: `database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`

**Why**: D1 stores email metadata, purchase orders, and communication history.

### 3.3 Create KV Namespace (for caching)

1. Create the KV namespace:
   ```bash
   wrangler kv:namespace create CACHE
   ```
2. **Copy the `id`** from the output (looks like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - You'll see a line like: `id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"`

**Why**: KV caches email analysis results to reduce API calls and improve performance.

### 3.4 Update Configuration File

1. Open `backend/wrangler.toml` in a text editor
2. Find these lines:
   ```toml
   database_id = "YOUR_D1_DATABASE_ID"
   id = "YOUR_KV_NAMESPACE_ID"
   ```
3. Replace `YOUR_D1_DATABASE_ID` with the database_id you copied in step 3.2
4. Replace `YOUR_KV_NAMESPACE_ID` with the id you copied in step 3.3
5. Save the file

**Why**: This tells Wrangler which database and cache to use.

### 3.5 Set Secrets (API Keys)

**Option A: Using Wrangler Secrets (Production)**

These commands will prompt you to paste secrets. Run each one:

1. Set Gemini API key:
   ```bash
   wrangler secret put GEMINI_API_KEY
   ```
   - When prompted, paste your Gemini API key from Step 2
   - Press Enter

2. Set Google Client ID:
   ```bash
   wrangler secret put GOOGLE_CLIENT_ID
   ```
   - When prompted, paste your Client ID from Step 1.3
   - Press Enter

3. Set Google Client Secret (optional - only if you plan to use server-side OAuth):
   ```bash
   wrangler secret put GOOGLE_CLIENT_SECRET
   ```
   - This is optional for Chrome extensions
   - You can skip this if you only use Chrome extension OAuth

4. Set LLM Provider (if using a provider other than Gemini):
   ```bash
   wrangler secret put LLM_PROVIDER
   ```
   - Enter: `groq`, `openrouter`, `together`, `huggingface`, or `gemini`

5. Set provider-specific API keys (if not using Gemini):
   ```bash
   wrangler secret put GROQ_API_KEY        # If using Groq
   wrangler secret put OPENROUTER_API_KEY  # If using OpenRouter
   wrangler secret put TOGETHER_API_KEY    # If using Together AI
   wrangler secret put HUGGINGFACE_API_KEY # If using Hugging Face
   ```

**Option B: Using .env File (Local Development)**

1. Copy the example file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` and fill in your actual values

3. Wrangler will automatically load `.env` for local development

**Why**: Secrets are stored securely and used by the Workers to authenticate with APIs. For production, use Wrangler secrets. For local development, use `.env` files.

See `ENV_SETUP.md` for complete environment variable documentation.

### 3.6 Deploy Database Schema

1. Make sure you're still in the `backend` folder
2. Run:
   ```bash
   wrangler d1 execute procurement-db --file=./schema.sql
   ```
3. This creates the tables (emails, purchase_orders, communications) in your database

**Why**: The database needs tables to store data. The schema.sql file defines the structure.

### 3.7 Install Dependencies and Deploy

1. Install Node.js dependencies:
   ```bash
   npm install
   ```
2. Deploy the Workers:
   ```bash
   npm run deploy
   ```
3. **Copy the Workers URL** from the output
   - You'll see something like: `https://gmail-procurement-ai.abc123.workers.dev`
   - Save this URL - you'll need it in Step 4

**Why**: This uploads your backend code to Cloudflare's servers and makes it accessible via the URL.

---

## Step 4: Chrome Extension Setup

**Purpose**: Configure and load the extension into Chrome.

### 4.1 Update Extension Configuration

1. Open `extension/manifest.json` in a text editor
2. Find this line:
   ```json
   "client_id": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
   ```
3. Replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID from Step 1.3
4. Save the file

### 4.2 Update API URL

1. Open `extension/sidebar.js` in a text editor
2. Find line 4 (or search for `YOUR_CLOUDFLARE_WORKERS_URL`):
   ```javascript
   const API_BASE_URL = 'YOUR_CLOUDFLARE_WORKERS_URL';
   ```
3. Replace `YOUR_CLOUDFLARE_WORKERS_URL` with your Workers URL from Step 3.7
   - Example: `const API_BASE_URL = 'https://gmail-procurement-ai.abc123.workers.dev';`
4. Save the file

**Why**: The extension needs to know where to send API requests.

### 4.3 Add Extension Icons

1. Create or download three PNG images:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)
2. Place them in the `extension/icons/` folder
3. You can use any image editor or online tools like [favicon-generator.org](https://www.favicon-generator.org/)

**Why**: Chrome requires icons to display the extension in the toolbar and extension list.

### 4.4 Load Extension in Chrome

1. Open Google Chrome
2. Go to `chrome://extensions/` (type this in the address bar)
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked**
5. Navigate to and select the `extension` folder (the one containing manifest.json)
6. The extension should now appear in your extensions list

**Why**: This loads your extension so Chrome can run it.

---

## Step 5: Test the Extension

**Purpose**: Verify everything works correctly.

1. Open Gmail in Chrome (go to [mail.google.com](https://mail.google.com))
2. Navigate to any email thread (preferably one related to a purchase order)
3. Click the extension icon in Chrome's toolbar
4. A sidebar should appear on the right side of Gmail
5. If prompted, grant permissions:
   - Click "Allow" when Chrome asks for Gmail access
   - Sign in with your Google account if needed
6. The sidebar should show:
   - "Analyzing email..." message
   - Then display the AI analysis with 5 sections

**What to expect**: The sidebar will analyze the email, extract PO numbers, find related threads, identify missing information, and offer to generate draft responses.

---

## Troubleshooting

### Extension not loading
- Check the browser console: Right-click extension icon → Inspect popup
- Verify `manifest.json` has correct Client ID
- Make sure all icons are in `extension/icons/` folder

### API errors
- Check Workers logs: `cd backend && wrangler tail`
- Verify API URL in `sidebar.js` matches your Workers URL
- Check that secrets are set: `wrangler secret list`

### OAuth issues
- Verify Client ID is correct in `manifest.json`
- Make sure you selected "Chrome extension" (not "Web application") in Google Cloud Console
- Check that Gmail API is enabled in Google Cloud Console

### Database errors
- Verify database_id is correct in `wrangler.toml`
- Check schema was deployed: `wrangler d1 execute procurement-db --file=./schema.sql`
- View database in Cloudflare dashboard: [dash.cloudflare.com](https://dash.cloudflare.com)

### No analysis appearing
- Check browser console for JavaScript errors
- Verify Workers URL is accessible (try opening it in a browser)
- Check Workers logs for errors: `wrangler tail`

---

## Summary Checklist

- [ ] Google Cloud Console: Project created, Gmail API enabled
- [ ] OAuth credentials: Chrome extension type, Client ID copied
- [ ] Gemini API key obtained
- [ ] Cloudflare: Wrangler installed and logged in
- [ ] D1 database created and ID copied
- [ ] KV namespace created and ID copied
- [ ] `wrangler.toml` updated with IDs
- [ ] Secrets set (GEMINI_API_KEY, GOOGLE_CLIENT_ID)
- [ ] Database schema deployed
- [ ] Workers deployed and URL copied
- [ ] `manifest.json` updated with Client ID
- [ ] `sidebar.js` updated with Workers URL
- [ ] Extension icons added
- [ ] Extension loaded in Chrome
- [ ] Tested with a Gmail thread

Once all steps are complete, your extension should be fully functional!

# Gmail Procurement AI Intelligence Chrome Extension

A Chrome extension that provides AI-powered procurement email intelligence for Gmail, helping users manage purchase orders, track commitments, and generate contextual email responses.

## Features

1. **Current Thread Summary** - Bullet points of key information (commitments, dates, pricing, issues)
2. **Related Conversations** - Shows summaries of other email threads related to the same PO
   - Internal threads (user ↔ managers/team)
   - External threads (user ↔ vendor)
3. **Missing Information** - Gap analysis showing what information is still needed
4. **Suggested Responses** - AI-generated draft responses:
   - Vendor-facing (professional, external)
   - Internal stakeholders (includes sensitive context)
5. **Context Panel** - Supplier performance metrics, negotiation leverage, historical data

## Architecture

- **Frontend**: Chrome Extension (Manifest V3) with React-like vanilla JS sidebar
- **Backend**: Cloudflare Workers (serverless API)
- **Database**: Cloudflare D1 (SQLite)
- **Cache**: Cloudflare Workers KV
- **AI**: Google Gemini API (gemini-2.0-flash-exp model)

## Setup Instructions

### Prerequisites

1. **Google Cloud Console Setup**
   - Create a project in [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Gmail API
   - Create OAuth 2.0 credentials (Web application)
   - Add authorized redirect URI: `https://YOUR_WORKERS_URL.workers.dev/api/oauth/callback`
   - Note your Client ID and Client Secret

2. **Google Gemini API**
   - Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

3. **Cloudflare Account**
   - Sign up at [Cloudflare](https://dash.cloudflare.com/)
   - Install Wrangler CLI: `npm install -g wrangler`
   - Login: `wrangler login`

### Backend Setup (Cloudflare Workers)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   npm install
   ```

2. **Create D1 Database:**
   ```bash
   wrangler d1 create procurement-db
   ```
   Note the database ID and update `wrangler.toml` with it.

3. **Create KV Namespace:**
   ```bash
   wrangler kv:namespace create CACHE
   ```
   Note the namespace ID and update `wrangler.toml` with it.

4. **Run database migration:**
   ```bash
   wrangler d1 execute procurement-db --file=./schema.sql
   ```

5. **Set secrets:**
   
   For production (Cloudflare Workers), use wrangler secrets:
   ```bash
   wrangler secret put GEMINI_API_KEY
   wrangler secret put GOOGLE_CLIENT_ID
   wrangler secret put GOOGLE_CLIENT_SECRET
   ```
   
   For local development, create a `.env` file:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your actual values
   ```
   
   See `ENV_SETUP.md` for detailed environment variable configuration.

6. **Update `wrangler.toml`:**
   - Replace `YOUR_D1_DATABASE_ID` with your database ID
   - Replace `YOUR_KV_NAMESPACE_ID` with your KV namespace ID

7. **Deploy:**
   ```bash
   npm run deploy
   ```
   Note your Workers URL (e.g., `https://gmail-procurement-ai.YOUR_SUBDOMAIN.workers.dev`)

### Extension Setup

1. **Update configuration:**
   - Open `extension/manifest.json`
   - Replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` with your actual Google Client ID
   - Open `extension/sidebar.js`
   - Replace `YOUR_CLOUDFLARE_WORKERS_URL` with your Workers URL

2. **Add extension icons:**
   - Create or download icons (16x16, 48x48, 128x128 pixels)
   - Place them in `extension/icons/` directory

3. **Load extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `extension` directory

4. **Grant permissions:**
   - The extension will request permissions on first use
   - Grant Gmail read access when prompted

## Usage

1. Open Gmail in Chrome
2. Navigate to an email thread related to a purchase order
3. Click the extension icon in the Chrome toolbar
4. The sidebar will appear on the right side with AI-powered analysis
5. Use the collapsible sections to view:
   - Thread summary
   - Related conversations
   - Missing information
   - Suggested responses (generate and copy/open in Gmail)
   - Context panel with metrics

## API Endpoints

### POST `/api/analyze-thread`
Analyzes an email thread and returns structured intelligence.

**Request:**
```json
{
  "email_data": {
    "threadId": "thread_id",
    "subject": "Email subject",
    "sender": "sender@example.com",
    "recipients": ["recipient@example.com"],
    "body": "Email body text",
    "participants": ["participant@example.com"],
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "user_id": "user_123"
}
```

**Response:**
```json
{
  "thread_summary": ["bullet point 1", "bullet point 2"],
  "related_conversations": {
    "internal": [{"summary": "key facts"}],
    "external": [{"summary": "key facts"}]
  },
  "missing_information": [
    {"field": "pricing", "description": "what's missing"}
  ],
  "context": {
    "supplier_performance": "rating",
    "negotiation_leverage": "assessment",
    "historical_data": "history"
  }
}
```

### POST `/api/generate-draft`
Generates an email draft response.

**Request:**
```json
{
  "email_data": {...},
  "analysis": {...},
  "draft_type": "vendor" | "internal",
  "user_id": "user_123"
}
```

**Response:**
```json
{
  "draft": "Generated email draft text"
}
```

## Database Schema

### `emails` table
- `id` (INTEGER PRIMARY KEY)
- `thread_id` (TEXT)
- `sender` (TEXT)
- `recipients` (TEXT - JSON array)
- `subject` (TEXT)
- `body` (TEXT)
- `is_internal` (INTEGER - 0 or 1)
- `po_number` (TEXT)
- `user_id` (TEXT)
- `timestamp` (TEXT)

### `purchase_orders` table
- `id` (INTEGER PRIMARY KEY)
- `po_number` (TEXT UNIQUE)
- `vendor` (TEXT)
- `amount` (REAL)
- `delivery_date` (TEXT)
- `status` (TEXT)
- `user_id` (TEXT)

### `communications` table
- `id` (INTEGER PRIMARY KEY)
- `thread_id` (TEXT)
- `po_number` (TEXT)
- `user_id` (TEXT)
- `metadata` (TEXT - JSON)

## Development

### Backend Development
```bash
cd backend
npm run dev  # Start local development server
```

### Testing
- Test email extraction in Gmail
- Verify API endpoints with curl or Postman
- Check D1 database queries in Cloudflare dashboard

## Troubleshooting

1. **Extension not loading:**
   - Check Chrome console for errors (`chrome://extensions/` → Details → Inspect views)
   - Verify manifest.json syntax

2. **API errors:**
   - Check Workers logs: `wrangler tail`
   - Verify secrets are set correctly
   - Check CORS headers

3. **OAuth issues:**
   - Verify redirect URI matches in Google Cloud Console
   - Check that Client ID/Secret are correct

4. **Database errors:**
   - Verify D1 database is created and bound correctly
   - Check schema migration ran successfully

## License

MIT License - feel free to modify and use for your needs.

## Notes

- Free tier limits:
  - Cloudflare D1: 5GB storage, 5M reads/day, 100K writes/day
  - Cloudflare Workers: 100K requests/day (free tier)
  - Cloudflare KV: 100K reads/day, 1K writes/day (free tier)
- Adjust internal email detection logic in `backend/src/index.js` (line ~200) to match your domain
- PO number extraction uses regex patterns - customize as needed

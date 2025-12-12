# Project Structure

```
.
├── extension/                    # Chrome Extension (Frontend)
│   ├── manifest.json            # Extension manifest (Manifest V3)
│   ├── background.js            # Service worker for OAuth and message handling
│   ├── content.js               # Content script that injects sidebar into Gmail
│   ├── sidebar.js               # Vanilla JS sidebar component with all 5 sections
│   ├── sidebar.css              # Styles for the sidebar UI
│   ├── styles.css               # Styles for sidebar container
│   ├── sidebar.html             # HTML template (not directly used, for reference)
│   └── icons/                   # Extension icons (16x16, 48x48, 128x128)
│       └── README.md
│
├── backend/                     # Cloudflare Workers (Backend)
│   ├── src/
│   │   └── index.js            # Main Workers entry point with API endpoints
│   ├── schema.sql               # D1 database schema
│   ├── wrangler.toml            # Cloudflare Workers configuration
│   ├── package.json             # Node.js dependencies
│   └── .gitignore
│
├── README.md                    # Main documentation
├── SETUP.md                     # Quick setup guide
├── PROJECT_STRUCTURE.md         # This file
└── .gitignore                   # Git ignore rules

```

## Key Files

### Extension Files

- **manifest.json**: Defines extension permissions, content scripts, and OAuth configuration
- **background.js**: Handles extension icon clicks and OAuth token management
- **content.js**: Injects sidebar into Gmail pages and extracts email data
- **sidebar.js**: Main UI component with all 5 intelligence sections

### Backend Files

- **src/index.js**: 
  - `/api/analyze-thread` - Main analysis endpoint
  - `/api/generate-draft` - Draft generation endpoint
  - `/api/oauth/callback` - OAuth callback handler
  - Gemini API integration
  - D1 database queries
  - KV caching

- **schema.sql**: Database tables for emails, purchase_orders, and communications

## Data Flow

1. User clicks extension icon → `background.js` → `content.js`
2. `content.js` extracts email data from Gmail DOM
3. Sidebar sends email data to Cloudflare Workers API
4. Workers:
   - Extracts PO number using regex
   - Queries D1 for related threads
   - Calls Gemini API for analysis
   - Caches result in KV
   - Stores email in D1
5. Sidebar displays analysis in 5 collapsible sections
6. User can generate drafts, copy, or open in Gmail

## Technologies

- **Frontend**: Vanilla JavaScript (no build step needed)
- **Backend**: Cloudflare Workers (serverless)
- **Database**: Cloudflare D1 (SQLite)
- **Cache**: Cloudflare Workers KV
- **AI**: Google Gemini API (gemini-2.0-flash-exp)
- **Auth**: Google OAuth 2.0

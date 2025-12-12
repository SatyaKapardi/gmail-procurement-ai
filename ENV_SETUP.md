# Environment Variables Setup Guide

This project uses environment variables to store API keys and configuration. This guide explains how to set them up.

## Quick Start

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your actual values

3. For Cloudflare Workers (production), set secrets:
   ```bash
   cd backend
   wrangler secret put GEMINI_API_KEY
   wrangler secret put GROQ_API_KEY
   # ... etc
   ```

## Environment Variables Reference

### Required for Backend (Cloudflare Workers)

These must be set as Cloudflare Workers secrets for production:

- `LLM_PROVIDER` - Which LLM to use: `gemini`, `groq`, `openrouter`, `together`, or `huggingface`
- `GEMINI_API_KEY` - Google Gemini API key (if using Gemini)
- `GROQ_API_KEY` - Groq API key (if using Groq)
- `OPENROUTER_API_KEY` - OpenRouter API key (if using OpenRouter)
- `TOGETHER_API_KEY` - Together AI API key (if using Together AI)
- `HUGGINGFACE_API_KEY` - Hugging Face API key (if using Hugging Face)
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret (optional for Chrome extensions)

### Required for Extension

Update these in the extension files:

- `extension/manifest.json` - Set `oauth2.client_id` to your Google Client ID
- `extension/sidebar.js` - Set `API_BASE_URL` to your Cloudflare Workers URL

## Setting Secrets for Cloudflare Workers

For production deployment, use Wrangler to set secrets:

```bash
cd backend

# Set LLM provider
wrangler secret put LLM_PROVIDER
# Enter: groq (or gemini, openrouter, together, huggingface)

# Set API keys based on your provider
wrangler secret put GROQ_API_KEY
# Paste your Groq API key

# Or for Gemini
wrangler secret put GEMINI_API_KEY
# Paste your Gemini API key

# Set Google OAuth credentials
wrangler secret put GOOGLE_CLIENT_ID
# Paste your Google Client ID

wrangler secret put GOOGLE_CLIENT_SECRET
# Paste your Google Client Secret (optional)
```

## Local Development

For local development with `wrangler dev`, create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
# Edit .env with your values
```

Wrangler will automatically load `.env` file for local development.

## Security Notes

- Never commit `.env` files to git (already in `.gitignore`)
- Use `.env.example` as a template
- For production, always use `wrangler secret put` instead of `.env` files
- Rotate API keys regularly
- Use different keys for development and production

## Getting API Keys

### Google Gemini
- https://makersuite.google.com/app/apikey

### Groq
- https://console.groq.com/keys

### OpenRouter
- https://openrouter.ai/keys

### Together AI
- https://api.together.xyz/

### Hugging Face
- https://huggingface.co/settings/tokens

### Google OAuth
- https://console.cloud.google.com/apis/credentials

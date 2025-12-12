# Free LLM Provider Setup Guide

The extension now supports multiple free LLM providers! You can easily switch between them to avoid rate limits.

## Supported Providers

### 1. **Groq** (Recommended - Fastest & Best Free Tier)
- **Free Tier**: 14,400 requests/day
- **Speed**: Very fast (uses specialized hardware)
- **Models**: Llama 3.1 70B, Mixtral 8x7B, Llama 3.1 8B
- **Get API Key**: https://console.groq.com/keys
- **Setup**:
  ```bash
  cd backend
  wrangler secret put GROQ_API_KEY
  # Paste your Groq API key
  wrangler secret put LLM_PROVIDER
  # Type: groq
  ```

### 2. **OpenRouter** (Multiple Free Models)
- **Free Tier**: Various free models available
- **Models**: Llama 3.1 8B (free), Mistral, etc.
- **Get API Key**: https://openrouter.ai/keys
- **Setup**:
  ```bash
  wrangler secret put OPENROUTER_API_KEY
  wrangler secret put LLM_PROVIDER
  # Type: openrouter
  ```

### 3. **Together AI**
- **Free Tier**: $25 free credits
- **Models**: Llama 3, Mistral, etc.
- **Get API Key**: https://api.together.xyz/
- **Setup**:
  ```bash
  wrangler secret put TOGETHER_API_KEY
  wrangler secret put LLM_PROVIDER
  # Type: together
  ```

### 4. **Hugging Face Inference API**
- **Free Tier**: Limited requests
- **Models**: Many open-source models
- **Get API Key**: https://huggingface.co/settings/tokens
- **Setup**:
  ```bash
  wrangler secret put HUGGINGFACE_API_KEY
  wrangler secret put LLM_PROVIDER
  # Type: huggingface
  ```

### 5. **Google Gemini** (Default)
- **Free Tier**: 15 requests/minute
- **Get API Key**: https://makersuite.google.com/app/apikey
- **Setup**:
  ```bash
  wrangler secret put GEMINI_API_KEY
  # LLM_PROVIDER defaults to 'gemini' if not set
  ```

## Quick Setup (Recommended: Groq)

1. **Get Groq API Key**:
   - Go to https://console.groq.com/keys
   - Sign up (free)
   - Create an API key
   - Copy it

2. **Set Secrets in Cloudflare**:
   ```bash
   cd backend
   wrangler secret put GROQ_API_KEY
   # Paste your Groq API key
   
   wrangler secret put LLM_PROVIDER
   # Type: groq
   ```

3. **Redeploy**:
   ```bash
   npm run deploy
   ```

4. **Done!** The extension will now use Groq instead of Gemini.

## Switching Providers

To switch between providers, just update the `LLM_PROVIDER` secret:

```bash
wrangler secret put LLM_PROVIDER
# Type: groq, openrouter, together, huggingface, or gemini
```

Then redeploy:
```bash
npm run deploy
```

## Rate Limits Comparison

| Provider | Free Tier Limits |
|----------|-----------------|
| **Groq** | 14,400 requests/day |
| **OpenRouter** | Varies by model |
| **Together AI** | $25 free credits |
| **Hugging Face** | Limited |
| **Gemini** | 15 requests/minute |

## Troubleshooting

### "API key not configured" error
- Make sure you set the correct API key secret for your provider
- Check secret names in the table above

### Still getting rate limits
- Try switching to Groq (highest free tier)
- Wait a few minutes between requests
- Check your usage in the provider's dashboard

### Provider not working
- Verify the API key is correct
- Check the provider's status page
- Look at Cloudflare Workers logs: `wrangler tail`

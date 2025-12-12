// LLM Provider Configuration
// Set LLM_PROVIDER env var to: 'groq', 'huggingface', 'together', 'openrouter', or 'gemini' (default)
const LLM_PROVIDERS = {
  groq: {
    name: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-8b-instant', // Fast and free: 'llama-3.1-8b-instant', 'llama-3.1-70b-versatile', 'mixtral-8x7b-32768'
    needsKey: true,
    keyName: 'GROQ_API_KEY'
  },
  huggingface: {
    name: 'Hugging Face',
    url: 'https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct',
    model: null, // model is in URL
    needsKey: true,
    keyName: 'HUGGINGFACE_API_KEY'
  },
  together: {
    name: 'Together AI',
    url: 'https://api.together.xyz/v1/chat/completions',
    model: 'meta-llama/Llama-3-8b-chat-hf',
    needsKey: true,
    keyName: 'TOGETHER_API_KEY'
  },
  openrouter: {
    name: 'OpenRouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'meta-llama/llama-3.1-8b-instruct:free', // Free model
    needsKey: true,
    keyName: 'OPENROUTER_API_KEY'
  },
  gemini: {
    name: 'Google Gemini',
    url: null, // Uses custom URL format
    model: 'gemini-2.0-flash-exp',
    needsKey: true,
    keyName: 'GEMINI_API_KEY'
  }
};

// Cloudflare Workers entry point
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route handling
    if (url.pathname === '/api/analyze-thread' && request.method === 'POST') {
      return handleAnalyzeThread(request, env, corsHeaders);
    }

    if (url.pathname === '/api/generate-draft' && request.method === 'POST') {
      return handleGenerateDraft(request, env, corsHeaders);
    }

    if (url.pathname === '/api/oauth/callback' && request.method === 'GET') {
      return handleOAuthCallback(request, env, corsHeaders);
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};

async function handleAnalyzeThread(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { email_data, user_id } = body;

    // Validate required fields
    if (!email_data) {
      throw new Error('Missing email_data in request');
    }
    if (!user_id) {
      throw new Error('Missing user_id in request');
    }

    // Check cache first
    const cacheKey = `email_${email_data.threadId}_${user_id}`;
    const cached = await env.CACHE.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract PO number
    const poNumber = extractPONumber(email_data);

    // Get related threads from database
    const relatedThreads = await getRelatedThreads(env.DB, poNumber, user_id, email_data.sender);

    // Call Gemini API for analysis
    const analysis = await analyzeWithGemini(env, email_data, relatedThreads, poNumber);

    // Store in cache (24 hour TTL)
    await env.CACHE.put(cacheKey, JSON.stringify(analysis), { expirationTtl: 86400 });

    // Store email in database
    await storeEmail(env.DB, email_data, poNumber, user_id);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Analyze thread error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleGenerateDraft(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { email_data, analysis, draft_type, user_id } = body;

    // Validate required fields
    if (!email_data) {
      throw new Error('Missing email_data in request');
    }
    if (!draft_type) {
      throw new Error('Missing draft_type in request');
    }

    const draft = await generateDraftWithGemini(env, email_data, analysis, draft_type);

    return new Response(JSON.stringify({ draft }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Generate draft error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleOAuthCallback(request, env, corsHeaders) {
  // OAuth callback handler
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  
  if (!code) {
    return new Response('Missing code parameter', { status: 400, headers: corsHeaders });
  }

  // Exchange code for token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${new URL(request.url).origin}/api/oauth/callback`,
      grant_type: 'authorization_code'
    })
  });

  const tokens = await tokenResponse.json();
  
  return new Response(JSON.stringify(tokens), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function extractPONumber(emailData) {
  // Regex patterns for PO numbers
  const patterns = [
    /PO[#:\s-]?(\d{4,})/i,
    /Purchase\s+Order[#:\s-]?(\d{4,})/i,
    /P\.O\.\s*[#:\s-]?(\d{4,})/i,
    /(\d{4,}-\d{2,})/ // Format: 1234-56
  ];

  const text = `${emailData.subject} ${emailData.body}`;
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }

  return null;
}

async function getRelatedThreads(db, poNumber, userId, currentSender) {
  if (!poNumber) return { internal: [], external: [] };

  try {
    // Query emails related to this PO
    const result = await db.prepare(`
      SELECT e.*, c.is_internal
      FROM emails e
      JOIN communications c ON e.thread_id = c.thread_id
      WHERE c.po_number = ? AND e.user_id = ?
      ORDER BY e.timestamp DESC
      LIMIT 20
    `).bind(poNumber, userId).all();

    // Validate result structure
    if (!result || !result.results) {
      console.warn('Database query returned invalid structure:', result);
      return { internal: [], external: [] };
    }

    const internal = [];
    const external = [];

    for (const email of result.results) {
      if (!email) continue; // Skip null/undefined entries
      
      const isInternal = email.is_internal === 1 || email.is_internal === true;
      const emailData = {
        thread_id: email.thread_id || '',
        subject: email.subject || '',
        sender: email.sender || '',
        timestamp: email.timestamp || ''
      };

      if (isInternal) {
        internal.push(emailData);
      } else {
        external.push(emailData);
      }
    }

    return { internal, external };
  } catch (error) {
    console.error('Database query error:', error);
    return { internal: [], external: [] };
  }
}

// Get the configured LLM provider
function getLLMProvider(env) {
  const providerName = (env.LLM_PROVIDER || 'gemini').toLowerCase();
  const provider = LLM_PROVIDERS[providerName];
  
  if (!provider) {
    console.warn(`Unknown LLM provider: ${providerName}, falling back to gemini`);
    return LLM_PROVIDERS.gemini;
  }
  
  return provider;
}

// Generic LLM API call function that works with multiple providers
async function callLLMAPI(env, prompt, maxRetries = 3) {
  const provider = getLLMProvider(env);
  
  // Check API key
  const apiKey = env[provider.keyName];
  if (!apiKey) {
    throw new Error(`${provider.name} API key (${provider.keyName}) is not configured. Please set it as a secret in Cloudflare Workers.`);
  }

  let requestBody;
  let apiUrl;
  let headers;

  if (provider.name === 'Google Gemini') {
    // Gemini uses a different API format
    apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${apiKey}`;
    requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };
    headers = { 'Content-Type': 'application/json' };
  } else {
    // OpenAI-compatible format (Groq, Together, OpenRouter, Hugging Face)
    apiUrl = provider.url;
    
    // Adjust max_tokens based on provider/model
    let maxTokens = 2000;
    if (provider.name === 'Groq') {
      // Groq models have different limits
      if (provider.model.includes('70b')) {
        maxTokens = 8000; // llama-3.1-70b-versatile supports up to 8000
      } else {
        maxTokens = 4000; // Smaller models
      }
    }
    
    requestBody = {
      model: provider.model,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: maxTokens
    };
    
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    
    // Hugging Face uses different format
    if (provider.name === 'Hugging Face') {
      // Hugging Face Inference API uses a different format
      requestBody = {
        inputs: prompt,
        parameters: {
          max_new_tokens: maxTokens,
          temperature: 0.7
        }
      };
    }
  }

  // Call with retry logic
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Log request for debugging (without API key)
    if (attempt === 0) {
      console.log(`[${provider.name}] Calling API: ${apiUrl}`);
      console.log(`[${provider.name}] Model: ${provider.model}`);
      console.log(`[${provider.name}] Request body:`, JSON.stringify({
        ...requestBody,
        messages: requestBody.messages ? requestBody.messages.map(m => ({ role: m.role, content: m.content.substring(0, 100) + '...' })) : requestBody.messages
      }).substring(0, 500));
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    // Handle rate limit (429) with exponential backoff
    if (response.status === 429) {
      if (attempt < maxRetries - 1) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter 
          ? parseInt(retryAfter) * 1000 
          : Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
        
        console.log(`Rate limit hit (${provider.name}), retrying after ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      } else {
        const errorData = await response.text();
        console.error(`${provider.name} API rate limit error after retries:`, errorData);
        throw new Error(`${provider.name} API rate limit exceeded. Please wait a few minutes and try again.`);
      }
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.text();
        // Try to parse as JSON for better error messages
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.error) {
            console.error(`${provider.name} API error:`, response.status, JSON.stringify(errorJson.error));
            throw new Error(`${provider.name} API error: ${errorJson.error.message || JSON.stringify(errorJson.error)}`);
          }
        } catch {
          // Not JSON, use as text
        }
        console.error(`${provider.name} API error:`, response.status, errorData);
        throw new Error(`${provider.name} API error: ${response.status} ${response.statusText}. Details: ${errorData.substring(0, 200)}`);
      } catch (err) {
        // If it's already our error, rethrow it
        if (err.message.includes('API error')) {
          throw err;
        }
        // Otherwise wrap it
        throw new Error(`${provider.name} API error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    
    // Parse response based on provider
    if (provider.name === 'Google Gemini') {
      // Gemini response format
      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`);
      }
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response from Gemini API');
      }
      return data.candidates[0].content.parts[0].text;
    } else if (provider.name === 'Hugging Face') {
      // Hugging Face response format
      if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
        return data[0].generated_text;
      }
      if (data.error) {
        throw new Error(`Hugging Face API error: ${data.error}`);
      }
      throw new Error(`Invalid response from Hugging Face API: ${JSON.stringify(data).substring(0, 200)}`);
    } else {
      // OpenAI-compatible response format (Groq, Together, OpenRouter)
      if (data.error) {
        throw new Error(`${provider.name} API error: ${data.error.message || JSON.stringify(data.error)}`);
      }
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        console.error(`Invalid ${provider.name} response structure:`, JSON.stringify(data).substring(0, 500));
        throw new Error(`Invalid response from ${provider.name} API: no choices found`);
      }
      if (!data.choices[0]?.message?.content) {
        console.error(`Invalid ${provider.name} response structure:`, JSON.stringify(data.choices[0]).substring(0, 500));
        throw new Error(`Invalid response from ${provider.name} API: missing message content`);
      }
      return data.choices[0].message.content;
    }
  }
}

// Legacy function for backward compatibility (now uses callLLMAPI)
async function callGeminiAPIWithRetry(geminiUrl, requestBody, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    // Handle rate limit (429) with exponential backoff
    if (response.status === 429) {
      if (attempt < maxRetries - 1) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter 
          ? parseInt(retryAfter) * 1000 
          : Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
        
        console.log(`Rate limit hit, retrying after ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      } else {
        const errorData = await response.text();
        console.error('Gemini API rate limit error after retries:', errorData);
        throw new Error('Gemini API rate limit exceeded. Please wait a few minutes and try again. Free tier has rate limits on API requests.');
      }
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', response.status, errorData);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    return response;
  }
}

async function analyzeWithGemini(env, emailData, relatedThreads, poNumber) {
  const prompt = `Analyze this procurement email and provide structured intelligence:

Email Subject: ${emailData.subject}
Email Body: ${emailData.body}
Sender: ${emailData.sender}
PO Number: ${poNumber || 'Not found'}

Related Internal Threads: ${JSON.stringify(relatedThreads.internal)}
Related External Threads: ${JSON.stringify(relatedThreads.external)}

Provide a JSON response with the following structure:
{
  "thread_summary": ["bullet point 1", "bullet point 2", ...],
  "related_conversations": {
    "internal": [{"summary": "key facts from thread"}],
    "external": [{"summary": "key facts from thread"}]
  },
  "missing_information": [
    {"field": "pricing", "description": "what's missing"},
    {"field": "delivery_date", "description": "what's missing"}
  ],
  "context": {
    "supplier_performance": "rating or metric",
    "negotiation_leverage": "assessment",
    "historical_data": "relevant history"
  }
}

Focus on: commitments, dates, pricing, issues, approvals needed.`;

  const text = await callLLMAPI(env, prompt);
  
  if (!text) {
    throw new Error('Empty response from LLM API');
  }
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse JSON from Gemini response:', parseError);
      // Fall through to fallback parsing
    }
  }

  // Fallback parsing
  return {
    thread_summary: extractBulletPoints(text),
    related_conversations: { internal: [], external: [] },
    missing_information: [],
    context: {}
  };
}

async function generateDraftWithGemini(env, emailData, analysis, draftType) {
  const context = draftType === 'vendor' 
    ? 'Generate a professional, external-facing email response to the vendor. Be courteous and business-appropriate.'
    : 'Generate an internal email response for managers/team. Include sensitive context and internal considerations.';

  const prompt = `Generate an email draft response:

Original Email:
Subject: ${emailData.subject}
Body: ${emailData.body}

Context: ${context}

Analysis Summary: ${JSON.stringify(analysis.thread_summary)}
Missing Information: ${JSON.stringify(analysis.missing_information)}

Generate a complete email draft that addresses the key points and missing information.`;

  return await callLLMAPI(env, prompt);
}

function extractBulletPoints(text) {
  const lines = text.split('\n');
  return lines
    .filter(line => /^[-•*]\s/.test(line.trim()) || /^\d+\.\s/.test(line.trim()))
    .map(line => line.replace(/^[-•*\d.]\s+/, '').trim())
    .filter(line => line.length > 0);
}

async function storeEmail(db, emailData, poNumber, userId) {
  try {
    // Determine if internal or external
    const isInternal = !emailData.sender.includes('@') || 
                       emailData.sender.includes('@company.com'); // Adjust domain

    // Insert email
    await db.prepare(`
      INSERT OR REPLACE INTO emails (thread_id, sender, recipients, subject, body, is_internal, po_number, user_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      emailData.threadId,
      emailData.sender,
      JSON.stringify(emailData.recipients),
      emailData.subject,
      emailData.body,
      isInternal ? 1 : 0,
      poNumber,
      userId,
      new Date().toISOString()
    ).run();

    // Link to PO if found
    if (poNumber) {
      await db.prepare(`
        INSERT OR REPLACE INTO communications (thread_id, po_number, user_id, metadata)
        VALUES (?, ?, ?, ?)
      `).bind(
        emailData.threadId,
        poNumber,
        userId,
        JSON.stringify({ extracted_at: new Date().toISOString() })
      ).run();
    }
  } catch (error) {
    console.error('Store email error:', error);
  }
}

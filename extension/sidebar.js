// Vanilla JavaScript sidebar component for Chrome extension
(function() {
  'use strict';

  const API_BASE_URL = 'YOUR_CLOUDFLARE_WORKERS_URL'; // Replace with your Workers URL (e.g., https://your-worker.workers.dev)

  let emailData = null;
  let analysis = null;
  let loading = false;
  let error = null;
  let collapsedSections = {};
  let drafts = { vendor: null, internal: null };

  // Initialize sidebar
  function init() {
    console.log('[Procurement AI Sidebar] Initializing...');
    const root = document.getElementById('procurement-ai-root');
    if (!root) {
      console.warn('[Procurement AI Sidebar] Root element not found, retrying...');
      // Retry after a short delay
      setTimeout(init, 100);
      return;
    }

    console.log('[Procurement AI Sidebar] Root element found, rendering...');
    render();
    
    // Listen for email data from content script
    window.addEventListener('procurement-ai-email-data', handleEmailData);
    console.log('[Procurement AI Sidebar] Initialized successfully');
  }

  function handleEmailData(event) {
    console.log('[Procurement AI Sidebar] Received email data:', event.detail);
    emailData = event.detail;
    if (emailData && (emailData.subject || emailData.sender)) {
      analyzeEmail(emailData);
    } else {
      console.warn('[Procurement AI Sidebar] Invalid email data received');
    }
  }

  async function analyzeEmail(data) {
    loading = true;
    error = null;
    render();

    try {
      const token = await getAuthToken();
      if (!token) {
        // Show helpful error message with setup instructions
        const errorMsg = 'Authentication failed. Please check:\n' +
          '1. The OAuth2 Client ID in manifest.json is correct\n' +
          '2. The Client ID was created as "Chrome extension" type (not "Web application")\n' +
          '3. Your extension ID is added to the OAuth2 client in Google Cloud Console\n' +
          '4. Gmail API is enabled in your Google Cloud project\n\n' +
          'See SETUP.md for detailed instructions.';
        throw new Error(errorMsg);
      }

      const userId = await getUserId();
      if (!userId) {
        throw new Error('Failed to get user ID');
      }

      console.log('[Procurement AI Sidebar] Calling API:', `${API_BASE_URL}/api/analyze-thread`);
      console.log('[Procurement AI Sidebar] Email data:', data);
      console.log('[Procurement AI Sidebar] User ID:', userId);
      console.log('[Procurement AI Sidebar] Token present:', !!token);

      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/analyze-thread`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            email_data: data,
            user_id: userId
          })
        });
      } catch (fetchError) {
        console.error('[Procurement AI Sidebar] Fetch error:', fetchError);
        if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
          throw new Error(`Network error: Unable to reach API at ${API_BASE_URL}. Please check if the backend is deployed and accessible.`);
        }
        throw new Error(`Network error: ${fetchError.message}`);
      }

      console.log('[Procurement AI Sidebar] API response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `API error: ${response.status} ${response.statusText || 'Unknown error'}`;
        
        // Handle rate limit errors with user-friendly message
        if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. The AI service is temporarily unavailable due to high demand.\n\n' +
            'Please wait a few minutes and try again. Free tier API keys have rate limits.\n\n' +
            'Tip: The extension will automatically retry, but you may need to wait a bit longer.';
        } else {
          try {
            const errorData = await response.text();
            if (errorData) {
              console.error('[Procurement AI Sidebar] API error response:', errorData);
              try {
                const errorJson = JSON.parse(errorData);
                errorMessage = errorJson.error || errorJson.message || errorMessage;
                
                // Check if it's a rate limit error in the message
                if (errorMessage.toLowerCase().includes('rate limit') || 
                    errorMessage.toLowerCase().includes('too many requests')) {
                  errorMessage = 'Rate limit exceeded. Please wait a few minutes and try again.\n\n' +
                    'The AI service has rate limits on free tier API keys.';
                }
              } catch {
                errorMessage = `${errorMessage} - ${errorData.substring(0, 100)}`;
              }
            }
          } catch (parseErr) {
            console.error('[Procurement AI Sidebar] Error parsing error response:', parseErr);
          }
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('[Procurement AI Sidebar] API response data:', responseData);
      analysis = responseData;
    } catch (err) {
      error = err.message || 'Unknown error occurred';
      console.error('[Procurement AI Sidebar] Analysis error:', err);
      console.error('[Procurement AI Sidebar] Error stack:', err.stack);
    } finally {
      loading = false;
      render();
    }
  }

  // Message bridge helper functions for communicating with content script
  function sendMessageToExtension(action, data = {}) {
    return new Promise((resolve) => {
      const requestId = `req_${Date.now()}_${Math.random()}`;
      
      const messageHandler = (event) => {
        if (event.data && event.data.type === 'procurement-ai-response' && event.data.requestId === requestId) {
          window.removeEventListener('message', messageHandler);
          if (event.data.data && event.data.data.error) {
            console.error('[Procurement AI Sidebar] Extension error:', event.data.data.error);
            resolve(null);
          } else {
            resolve(event.data.data);
          }
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      console.log('[Procurement AI Sidebar] Sending message to extension:', action);
      window.postMessage({
        type: 'procurement-ai-request',
        requestId,
        action,
        data
      }, '*');
      
      // Timeout after 10 seconds
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        console.warn('[Procurement AI Sidebar] Message timeout for action:', action);
        resolve(null);
      }, 10000);
    });
  }

  async function getUserId() {
    try {
      const result = await sendMessageToExtension('storage-get', { keys: ['user_id'] });
      if (!result || !result.user_id) {
        const userId = `user_${Date.now()}`;
        await sendMessageToExtension('storage-set', { items: { user_id: userId } });
        return userId;
      }
      return result.user_id;
    } catch (error) {
      console.error('[Procurement AI Sidebar] Error getting user ID:', error);
      // Fallback to generating a new ID
      const userId = `user_${Date.now()}`;
      await sendMessageToExtension('storage-set', { items: { user_id: userId } });
      return userId;
    }
  }

  async function getAuthToken() {
    try {
      const response = await sendMessageToExtension('getAuthToken');
      return response?.token || null;
    } catch (error) {
      console.error('[Procurement AI Sidebar] Error getting auth token:', error);
      return null;
    }
  }

  function toggleSection(sectionId) {
    collapsedSections[sectionId] = !collapsedSections[sectionId];
    render();
  }

  async function generateDraft(type) {
    loading = true;
    error = null;
    render();

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Failed to get authentication token. Please check your Google account permissions.');
      }

      const userId = await getUserId();
      if (!userId) {
        throw new Error('Failed to get user ID');
      }

      console.log('[Procurement AI Sidebar] Generating draft:', type);

      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/generate-draft`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            email_data: emailData,
            analysis: analysis,
            draft_type: type,
            user_id: userId
          })
        });
      } catch (fetchError) {
        console.error('[Procurement AI Sidebar] Fetch error:', fetchError);
        if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
          throw new Error(`Network error: Unable to reach API at ${API_BASE_URL}. Please check if the backend is deployed and accessible.`);
        }
        throw new Error(`Network error: ${fetchError.message}`);
      }

      console.log('[Procurement AI Sidebar] Draft API response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `API error: ${response.status} ${response.statusText || 'Unknown error'}`;
        try {
          const errorData = await response.text();
          if (errorData) {
            console.error('[Procurement AI Sidebar] Draft API error response:', errorData);
            try {
              const errorJson = JSON.parse(errorData);
              errorMessage = errorJson.error || errorJson.message || errorMessage;
            } catch {
              errorMessage = `${errorMessage} - ${errorData.substring(0, 100)}`;
            }
          }
        } catch (parseErr) {
          console.error('[Procurement AI Sidebar] Error parsing error response:', parseErr);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('[Procurement AI Sidebar] Draft result:', result);
      drafts[type] = result.draft;
    } catch (err) {
      error = err.message || 'Unknown error occurred while generating draft';
      console.error('[Procurement AI Sidebar] Draft generation error:', err);
      console.error('[Procurement AI Sidebar] Error stack:', err.stack);
    } finally {
      loading = false;
      render();
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  }

  function openGmailCompose(draft) {
    const subject = emailData?.subject?.replace(/^(Re:|Fwd?:)\s*/i, '') || '';
    const body = encodeURIComponent(draft);
    const composeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${emailData?.sender || ''}&su=${encodeURIComponent(subject)}&body=${body}`;
    window.open(composeUrl, '_blank');
  }

  function closeSidebar() {
    const sidebar = document.getElementById('procurement-ai-sidebar');
    if (sidebar) {
      sidebar.classList.remove('visible');
    }
  }

  function render() {
    const root = document.getElementById('procurement-ai-root');
    if (!root) return;

    // Clear existing content
    while (root.firstChild) {
      root.removeChild(root.firstChild);
    }

    // Create main sidebar container
    const sidebar = document.createElement('div');
    sidebar.className = 'procurement-sidebar';

    // Create header
    const header = document.createElement('div');
    header.className = 'sidebar-header';
    
    const title = document.createElement('h2');
    title.textContent = 'Procurement AI Intelligence';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.setAttribute('data-action', 'close');
    closeBtn.textContent = '×';
    
    header.appendChild(title);
    header.appendChild(closeBtn);

    // Create content area
    const content = document.createElement('div');
    content.className = 'sidebar-content';

    // Add loading/error messages
    if (loading) {
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'loading';
      loadingDiv.textContent = 'Analyzing email...';
      content.appendChild(loadingDiv);
    }

    if (error) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error';
      
      // Handle multi-line error messages
      const errorLines = error.split('\n');
      errorLines.forEach((line, index) => {
        if (index === 0) {
          errorDiv.appendChild(document.createTextNode(`Error: ${line}`));
        } else {
          errorDiv.appendChild(document.createElement('br'));
          errorDiv.appendChild(document.createTextNode(line));
        }
      });
      
      content.appendChild(errorDiv);
    }

    // Add sections
    if (!loading && !error) {
      content.appendChild(renderSection('summary', 'Current Thread Summary', renderThreadSummary()));
      content.appendChild(renderSection('related', 'Related Conversations', renderRelatedConversations()));
      content.appendChild(renderSection('missing', 'Missing Information', renderMissingInfo()));
      content.appendChild(renderSection('responses', 'Suggested Responses', renderSuggestedResponses()));
      content.appendChild(renderSection('context', 'Context Panel', renderContextPanel()));
    }

    sidebar.appendChild(header);
    sidebar.appendChild(content);
    root.appendChild(sidebar);

    // Attach event listeners
    attachEventListeners();
  }

  function attachEventListeners() {
    // Close button
    const closeBtn = document.querySelector('[data-action="close"]');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeSidebar);
    }

    // Section toggles
    document.querySelectorAll('.section-header').forEach(header => {
      header.addEventListener('click', function() {
        const sectionContent = this.closest('.section').querySelector('.section-content');
        const sectionId = sectionContent?.dataset?.sectionId;
        if (sectionId) {
          toggleSection(sectionId);
        }
      });
    });

    // Draft buttons
    document.querySelectorAll('[data-draft-type]').forEach(btn => {
      btn.addEventListener('click', function() {
        const type = this.dataset.draftType;
        const action = this.dataset.action;
        
        if (action === 'generate') {
          generateDraft(type);
        } else if (action === 'copy') {
          const draftElement = document.querySelector(`[data-draft="${type}"]`);
          if (draftElement) {
            copyToClipboard(draftElement.textContent);
          }
        } else if (action === 'open') {
          const draftElement = document.querySelector(`[data-draft="${type}"]`);
          if (draftElement) {
            openGmailCompose(draftElement.textContent);
          }
        }
      });
    });
  }

  function renderSection(id, title, contentElement) {
    const section = document.createElement('div');
    section.className = 'section';

    const header = document.createElement('div');
    header.className = 'section-header';
    header.setAttribute('data-section-id', id);

    const titleEl = document.createElement('h3');
    titleEl.textContent = title;

    const toggle = document.createElement('span');
    toggle.className = 'section-toggle';
    if (collapsedSections[id]) {
      toggle.classList.add('collapsed');
    }
    toggle.textContent = '▼';

    header.appendChild(titleEl);
    header.appendChild(toggle);

    const content = document.createElement('div');
    content.className = 'section-content';
    content.setAttribute('data-section-id', id);
    if (collapsedSections[id]) {
      content.classList.add('collapsed');
    }

    if (contentElement) {
      if (typeof contentElement === 'string') {
        // Fallback for text content
        content.textContent = contentElement;
      } else {
        content.appendChild(contentElement);
      }
    }

    section.appendChild(header);
    section.appendChild(content);

    return section;
  }

  function renderThreadSummary() {
    const container = document.createElement('div');
    if (!analysis?.thread_summary) {
      container.textContent = 'No summary available';
      return container;
    }
    
    const list = document.createElement('ul');
    list.className = 'bullet-list';
    
    analysis.thread_summary.forEach(point => {
      const li = document.createElement('li');
      li.textContent = point;
      list.appendChild(li);
    });
    
    container.appendChild(list);
    return container;
  }

  function renderRelatedConversations() {
    const container = document.createElement('div');
    if (!analysis?.related_conversations) {
      container.textContent = 'No related conversations found';
      return container;
    }

    const internal = analysis.related_conversations.internal || [];
    const external = analysis.related_conversations.external || [];

    if (internal.length > 0) {
      const group = document.createElement('div');
      group.className = 'thread-group';
      
      const h4 = document.createElement('h4');
      h4.textContent = 'Internal Threads';
      group.appendChild(h4);
      
      const list = document.createElement('ul');
      list.className = 'bullet-list';
      internal.forEach(thread => {
        const li = document.createElement('li');
        li.textContent = thread.summary || JSON.stringify(thread);
        list.appendChild(li);
      });
      group.appendChild(list);
      container.appendChild(group);
    }

    if (external.length > 0) {
      const group = document.createElement('div');
      group.className = 'thread-group';
      
      const h4 = document.createElement('h4');
      h4.textContent = 'External Threads (Vendor)';
      group.appendChild(h4);
      
      const list = document.createElement('ul');
      list.className = 'bullet-list';
      external.forEach(thread => {
        const li = document.createElement('li');
        li.textContent = thread.summary || JSON.stringify(thread);
        list.appendChild(li);
      });
      group.appendChild(list);
      container.appendChild(group);
    }

    if (container.children.length === 0) {
      container.textContent = 'No related conversations found';
    }

    return container;
  }

  function renderMissingInfo() {
    const container = document.createElement('div');
    if (!analysis?.missing_information || analysis.missing_information.length === 0) {
      container.textContent = 'All information appears to be present';
      return container;
    }
    
    analysis.missing_information.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'missing-info-item';
      
      const strong = document.createElement('strong');
      strong.textContent = `${item.field}: `;
      itemDiv.appendChild(strong);
      
      const desc = document.createTextNode(item.description);
      itemDiv.appendChild(desc);
      
      container.appendChild(itemDiv);
    });
    
    return container;
  }

  function renderSuggestedResponses() {
    const container = document.createElement('div');

    // Vendor Response section
    const vendorSection = document.createElement('div');
    vendorSection.style.marginBottom = '16px';
    
    const vendorH4 = document.createElement('h4');
    vendorH4.textContent = 'Vendor Response';
    vendorSection.appendChild(vendorH4);
    
    const vendorBtnGroup = document.createElement('div');
    vendorBtnGroup.className = 'button-group';
    
    const vendorGenerateBtn = document.createElement('button');
    vendorGenerateBtn.className = 'btn btn-primary';
    vendorGenerateBtn.setAttribute('data-draft-type', 'vendor');
    vendorGenerateBtn.setAttribute('data-action', 'generate');
    vendorGenerateBtn.textContent = 'Generate Draft';
    if (loading) {
      vendorGenerateBtn.disabled = true;
    }
    vendorBtnGroup.appendChild(vendorGenerateBtn);
    
    if (drafts.vendor) {
      const vendorCopyBtn = document.createElement('button');
      vendorCopyBtn.className = 'btn btn-secondary';
      vendorCopyBtn.setAttribute('data-draft-type', 'vendor');
      vendorCopyBtn.setAttribute('data-action', 'copy');
      vendorCopyBtn.textContent = 'Copy';
      vendorBtnGroup.appendChild(vendorCopyBtn);
      
      const vendorOpenBtn = document.createElement('button');
      vendorOpenBtn.className = 'btn btn-secondary';
      vendorOpenBtn.setAttribute('data-draft-type', 'vendor');
      vendorOpenBtn.setAttribute('data-action', 'open');
      vendorOpenBtn.textContent = 'Open in Gmail';
      vendorBtnGroup.appendChild(vendorOpenBtn);
      
      const vendorDraft = document.createElement('div');
      vendorDraft.className = 'draft-response';
      vendorDraft.setAttribute('data-draft', 'vendor');
      vendorDraft.textContent = drafts.vendor;
      vendorSection.appendChild(vendorBtnGroup);
      vendorSection.appendChild(vendorDraft);
    } else {
      vendorSection.appendChild(vendorBtnGroup);
    }
    
    container.appendChild(vendorSection);

    // Internal Response section
    const internalSection = document.createElement('div');
    
    const internalH4 = document.createElement('h4');
    internalH4.textContent = 'Internal Response';
    internalSection.appendChild(internalH4);
    
    const internalBtnGroup = document.createElement('div');
    internalBtnGroup.className = 'button-group';
    
    const internalGenerateBtn = document.createElement('button');
    internalGenerateBtn.className = 'btn btn-primary';
    internalGenerateBtn.setAttribute('data-draft-type', 'internal');
    internalGenerateBtn.setAttribute('data-action', 'generate');
    internalGenerateBtn.textContent = 'Generate Draft';
    if (loading) {
      internalGenerateBtn.disabled = true;
    }
    internalBtnGroup.appendChild(internalGenerateBtn);
    
    if (drafts.internal) {
      const internalCopyBtn = document.createElement('button');
      internalCopyBtn.className = 'btn btn-secondary';
      internalCopyBtn.setAttribute('data-draft-type', 'internal');
      internalCopyBtn.setAttribute('data-action', 'copy');
      internalCopyBtn.textContent = 'Copy';
      internalBtnGroup.appendChild(internalCopyBtn);
      
      const internalOpenBtn = document.createElement('button');
      internalOpenBtn.className = 'btn btn-secondary';
      internalOpenBtn.setAttribute('data-draft-type', 'internal');
      internalOpenBtn.setAttribute('data-action', 'open');
      internalOpenBtn.textContent = 'Open in Gmail';
      internalBtnGroup.appendChild(internalOpenBtn);
      
      const internalDraft = document.createElement('div');
      internalDraft.className = 'draft-response';
      internalDraft.setAttribute('data-draft', 'internal');
      internalDraft.textContent = drafts.internal;
      internalSection.appendChild(internalBtnGroup);
      internalSection.appendChild(internalDraft);
    } else {
      internalSection.appendChild(internalBtnGroup);
    }
    
    container.appendChild(internalSection);
    return container;
  }

  function renderContextPanel() {
    const container = document.createElement('div');
    if (!analysis?.context) {
      container.textContent = 'No context data available';
      return container;
    }

    const ctx = analysis.context;
    const grid = document.createElement('div');
    grid.className = 'metrics-grid';
    
    if (ctx.supplier_performance) {
      const card = document.createElement('div');
      card.className = 'metric-card';
      
      const label = document.createElement('div');
      label.className = 'metric-label';
      label.textContent = 'Supplier Performance';
      
      const value = document.createElement('div');
      value.className = 'metric-value';
      value.textContent = ctx.supplier_performance;
      
      card.appendChild(label);
      card.appendChild(value);
      grid.appendChild(card);
    }
    
    if (ctx.negotiation_leverage) {
      const card = document.createElement('div');
      card.className = 'metric-card';
      
      const label = document.createElement('div');
      label.className = 'metric-label';
      label.textContent = 'Negotiation Leverage';
      
      const value = document.createElement('div');
      value.className = 'metric-value';
      value.textContent = ctx.negotiation_leverage;
      
      card.appendChild(label);
      card.appendChild(value);
      grid.appendChild(card);
    }
    
    if (ctx.historical_data) {
      const card = document.createElement('div');
      card.className = 'metric-card';
      card.style.gridColumn = '1 / -1';
      
      const label = document.createElement('div');
      label.className = 'metric-label';
      label.textContent = 'Historical Data';
      
      const value = document.createElement('div');
      value.className = 'metric-value';
      value.textContent = ctx.historical_data;
      
      card.appendChild(label);
      card.appendChild(value);
      grid.appendChild(card);
    }
    
    container.appendChild(grid);
    return container;
  }

  // Note: escapeHtml is no longer needed since we use textContent
  // Keeping for backwards compatibility if needed elsewhere
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.textContent; // Return textContent instead of innerHTML
  }

  // Initialize when DOM is ready
  function startInit() {
    // Try to initialize immediately
    init();
    
    // Also set up a fallback in case the root element isn't ready yet
    const maxRetries = 50; // 5 seconds max
    let retries = 0;
    const checkInterval = setInterval(() => {
      const root = document.getElementById('procurement-ai-root');
      if (root && root.children.length === 0) {
        // Root exists but hasn't been rendered yet
        clearInterval(checkInterval);
        init();
      } else if (retries >= maxRetries) {
        clearInterval(checkInterval);
        console.error('[Procurement AI Sidebar] Failed to initialize after retries');
      }
      retries++;
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startInit);
  } else {
    // Small delay to ensure content script has created the root element
    setTimeout(startInit, 50);
  }
})();

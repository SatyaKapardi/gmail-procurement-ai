// Background service worker for Chrome extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Gmail Procurement AI Intelligence extension installed');
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  console.log('[Procurement AI] Extension icon clicked, tab URL:', tab.url);
  
  // Only activate on Gmail pages
  if (tab.url && tab.url.includes('mail.google.com')) {
    // Try to send message to content script
    try {
      chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('[Procurement AI] Content script not ready, injecting...', chrome.runtime.lastError.message);
          // Content script not loaded, inject it
          injectContentScript(tab.id);
        } else {
          console.log('[Procurement AI] Message sent successfully:', response);
        }
      });
    } catch (error) {
      console.error('[Procurement AI] Error:', error);
      // Try to inject the content script
      injectContentScript(tab.id);
    }
  } else {
    // Open Gmail if not already there
    chrome.tabs.create({ url: 'https://mail.google.com' });
  }
});

// Inject content script if not already loaded
async function injectContentScript(tabId) {
  try {
    console.log('[Procurement AI] Injecting content script into tab:', tabId);
    
    // Inject the content script
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
    
    // Inject the CSS
    await chrome.scripting.insertCSS({
      target: { tabId: tabId },
      files: ['styles.css']
    });
    
    console.log('[Procurement AI] Content script injected successfully');
    
    // Wait a bit for the script to initialize, then send the toggle message
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, { action: 'toggleSidebar' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Procurement AI] Error after injection:', chrome.runtime.lastError.message);
        } else {
          console.log('[Procurement AI] Toggle message sent after injection:', response);
        }
      });
    }, 500);
  } catch (error) {
    console.error('[Procurement AI] Failed to inject content script:', error);
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Procurement AI Background] Received message:', request.action);
  
  if (request.action === 'getAuthToken') {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        const errorMsg = chrome.runtime.lastError.message;
        console.error('[Procurement AI Background] Auth error:', errorMsg);
        
        // Get extension ID for helpful error message
        const extensionId = chrome.runtime.id;
        
        // Provide more helpful error messages
        let userFriendlyError = errorMsg;
        if (errorMsg.includes('bad client id')) {
          userFriendlyError = 'Invalid OAuth2 Client ID. To fix:\n\n' +
            '1. Get your Extension ID:\n' +
            '   - Go to chrome://extensions/\n' +
            '   - Find this extension and copy the ID\n' +
            '   - Your Extension ID: ' + extensionId + '\n\n' +
            '2. In Google Cloud Console:\n' +
            '   - Go to APIs & Services > Credentials\n' +
            '   - Edit your OAuth2 client (must be "Chrome extension" type)\n' +
            '   - Add your Extension ID to the allowed extension IDs\n' +
            '   - Verify the Client ID matches manifest.json\n\n' +
            '3. Verify:\n' +
            '   - Gmail API is enabled in your project\n' +
            '   - OAuth consent screen is configured\n\n' +
            'See SETUP.md for detailed instructions.';
        } else if (errorMsg.includes('OAuth2')) {
          userFriendlyError = 'OAuth2 configuration error.\n' +
            'Extension ID: ' + extensionId + '\n' +
            'Please check your Google Cloud Console setup.\n' +
            'See SETUP.md for instructions.';
        }
        
        sendResponse({ token: null, error: userFriendlyError });
      } else {
        console.log('[Procurement AI Background] Auth token obtained');
        sendResponse({ token });
      }
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'apiCall') {
    // Forward API calls to Cloudflare Workers
    fetch(request.url, {
      method: request.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...request.headers
      },
      body: JSON.stringify(request.data)
    })
      .then(response => response.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(error => {
        console.error('[Procurement AI Background] API call error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

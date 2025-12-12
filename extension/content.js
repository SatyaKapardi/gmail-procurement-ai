// Content script that injects sidebar into Gmail
(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.procurementAIContentScriptLoaded) {
    console.log('[Procurement AI] Content script already loaded, skipping initialization');
    return;
  }
  window.procurementAIContentScriptLoaded = true;

  let sidebarContainer = null;
  let isSidebarVisible = false;

  // Create sidebar container
  function createSidebar() {
    if (sidebarContainer) return;

    console.log('[Procurement AI] Creating sidebar...');

    sidebarContainer = document.createElement('div');
    sidebarContainer.id = 'procurement-ai-sidebar';
    
    // Create root element using DOM methods to avoid TrustedHTML issues
    const root = document.createElement('div');
    root.id = 'procurement-ai-root';
    sidebarContainer.appendChild(root);
    
    // Inject styles
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('sidebar.css');
    document.head.appendChild(link);

    // Append container first so the script can find the root element
    document.body.appendChild(sidebarContainer);

    // Inject sidebar script after container is in DOM
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('sidebar.js');
    script.onload = () => {
      console.log('[Procurement AI] Sidebar script loaded');
    };
    script.onerror = (error) => {
      console.error('[Procurement AI] Failed to load sidebar script:', error);
    };
    document.body.appendChild(script);

    console.log('[Procurement AI] Sidebar container created');
  }

  // Extract email data from Gmail
  function extractEmailData() {
    const emailData = {
      threadId: null,
      subject: '',
      sender: '',
      recipients: [],
      body: '',
      participants: [],
      timestamp: null
    };

    try {
      // Extract thread ID from URL
      const urlParams = new URLSearchParams(window.location.search);
      emailData.threadId = urlParams.get('th') || urlParams.get('threadID');

      // Extract subject - try multiple selectors for Gmail's varying structure
      const subjectSelectors = [
        'h2[data-thread-perm-id]',
        'h2.hP',
        '[data-thread-perm-id]',
        '.hP'
      ];
      for (const selector of subjectSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          emailData.subject = element.textContent.trim();
          break;
        }
      }

      // Extract sender and recipients - try multiple approaches
      const senderSelectors = [
        'span[email]',
        '[email]',
        '.gD',
        '.go'
      ];
      const participantsSet = new Set();
      
      for (const selector of senderSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const email = el.getAttribute('email') || el.textContent.trim();
          if (email && email.includes('@')) {
            participantsSet.add(email);
            if (!emailData.sender) {
              emailData.sender = email;
            }
          }
        });
      }

      emailData.participants = Array.from(participantsSet);
      emailData.recipients = emailData.participants.filter(email => email !== emailData.sender);

      // Extract email body - try multiple selectors
      const bodySelectors = [
        '.a3s',
        '.ii.gt',
        '[role="main"] .Am',
        '.Am',
        '.a3s.aiL',
        '[data-message-id]'
      ];
      for (const selector of bodySelectors) {
        const element = document.querySelector(selector);
        if (element) {
          emailData.body = element.innerText || element.textContent;
          if (emailData.body && emailData.body.length > 50) break; // Got substantial content
        }
      }

      // Extract timestamp
      const timeSelectors = ['.g3', '.g2', '[title*=":"]', '.gK'];
      for (const selector of timeSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          emailData.timestamp = element.getAttribute('title') || element.textContent;
          break;
        }
      }

    } catch (error) {
      console.error('Error extracting email data:', error);
    }

    return emailData;
  }

  // Toggle sidebar visibility
  function toggleSidebar() {
    if (!sidebarContainer) {
      createSidebar();
      // Wait a bit for the script to load before showing
      setTimeout(() => {
        isSidebarVisible = true;
        if (sidebarContainer) {
          sidebarContainer.classList.add('visible');
        }
        const emailData = extractEmailData();
        window.dispatchEvent(new CustomEvent('procurement-ai-email-data', {
          detail: emailData
        }));
      }, 100);
      return;
    }
    
    isSidebarVisible = !isSidebarVisible;
    if (sidebarContainer) {
      sidebarContainer.classList.toggle('visible', isSidebarVisible);
    }

    // Dispatch event to React app with email data
    if (isSidebarVisible) {
      const emailData = extractEmailData();
      window.dispatchEvent(new CustomEvent('procurement-ai-email-data', {
        detail: emailData
      }));
    }
  }

  // Set up message listener early
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Procurement AI] Received message:', request.action);
    
    if (request.action === 'toggleSidebar') {
      toggleSidebar();
      sendResponse({ success: true });
      return true;
    }
    
    if (request.action === 'analyzeEmail') {
      const emailData = extractEmailData();
      sendResponse({ success: true, emailData });
      return true;
    }
  });

  // Message bridge for sidebar.js (which runs in page context)
  window.addEventListener('message', (event) => {
    // Only accept messages from our own window
    if (event.source !== window) return;
    
    if (event.data && event.data.type === 'procurement-ai-request') {
      const { requestId, action, data } = event.data;
      console.log('[Procurement AI] Bridge received request:', action);
      
      if (action === 'getAuthToken') {
        chrome.runtime.sendMessage({ action: 'getAuthToken' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('[Procurement AI] Bridge error:', chrome.runtime.lastError.message);
            window.postMessage({
              type: 'procurement-ai-response',
              requestId,
              data: { error: chrome.runtime.lastError.message }
            }, '*');
          } else {
            window.postMessage({
              type: 'procurement-ai-response',
              requestId,
              data: response
            }, '*');
          }
        });
      } else if (action === 'storage-get') {
        chrome.storage.local.get(data.keys || [], (result) => {
          if (chrome.runtime.lastError) {
            console.error('[Procurement AI] Storage get error:', chrome.runtime.lastError.message);
            window.postMessage({
              type: 'procurement-ai-response',
              requestId,
              data: { error: chrome.runtime.lastError.message }
            }, '*');
          } else {
            window.postMessage({
              type: 'procurement-ai-response',
              requestId,
              data: result
            }, '*');
          }
        });
      } else if (action === 'storage-set') {
        chrome.storage.local.set(data.items || {}, () => {
          if (chrome.runtime.lastError) {
            console.error('[Procurement AI] Storage set error:', chrome.runtime.lastError.message);
            window.postMessage({
              type: 'procurement-ai-response',
              requestId,
              data: { error: chrome.runtime.lastError.message }
            }, '*');
          } else {
            window.postMessage({
              type: 'procurement-ai-response',
              requestId,
              data: { success: true }
            }, '*');
          }
        });
      }
    }
  });

  // Message listener is set up above (moved earlier to ensure it's ready)

  // Check if we're viewing an email thread
  function isEmailThreadView() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('th') || urlParams.has('threadID') || 
           document.querySelector('h2[data-thread-perm-id]') !== null;
  }

  // Show sidebar automatically when email thread is detected
  function checkAndShowSidebar() {
    if (isEmailThreadView() && sidebarContainer && !isSidebarVisible) {
      isSidebarVisible = true;
      sidebarContainer.classList.add('visible');
      const emailData = extractEmailData();
      if (emailData && (emailData.subject || emailData.sender)) {
        window.dispatchEvent(new CustomEvent('procurement-ai-email-data', {
          detail: emailData
        }));
      }
    }
  }

  // Initialize sidebar on Gmail load
  function initialize() {
    console.log('[Procurement AI] Initializing content script...');
    
    // Wait for Gmail to fully load
    const checkGmailReady = setInterval(() => {
      // Check if Gmail's main content area exists
      const gmailMain = document.querySelector('[role="main"]') || document.body;
      if (gmailMain) {
        clearInterval(checkGmailReady);
        createSidebar();
        
        // Check if we should auto-show sidebar for email thread
        setTimeout(() => {
          checkAndShowSidebar();
        }, 1000);
        
        console.log('[Procurement AI] Content script initialized');
      }
    }, 100);
    
    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkGmailReady);
      createSidebar();
      setTimeout(() => {
        checkAndShowSidebar();
      }, 1000);
      console.log('[Procurement AI] Content script initialized (timeout)');
    }, 5000);
  }

  // Watch for navigation changes (Gmail is a SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(() => {
        checkAndShowSidebar();
      }, 500);
    }
  }).observe(document, { subtree: true, childList: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // Use setTimeout to ensure Gmail has initialized
    setTimeout(initialize, 500);
  }
})();

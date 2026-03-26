// Content script for EntraSort extension
(function() {
  'use strict';
  
  let isEnabled = true;
  let observer = null;
  let sortingInterval = null;
  let sortTimeout = null;
  
  // Determine if we're in the main frame or iframe
  const isMainFrame = window.self === window.top;
  const isEntraIframe = window.name === 'EntraNav.ReactView';
  
  console.log(`EntraSort: Script loaded - isMainFrame: ${isMainFrame}, isEntraIframe: ${isEntraIframe}, window.name: "${window.name}", URL: ${window.location.href}`);
  
  // Load initial state
  chrome.storage.sync.get(['entrasortEnabled'], function(result) {
    isEnabled = result.entrasortEnabled !== false; // Default to true
    console.log(`EntraSort: Initial state loaded - enabled: ${isEnabled}`);
    if (isEnabled) {
      initializeSorting();
    }
  });
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(`EntraSort: Received message - action: ${request.action}`);
    if (request.action === 'enable') {
      isEnabled = true;
      initializeSorting();
    } else if (request.action === 'disable') {
      isEnabled = false;
      stopSorting();
    }
  });
  
  function initializeSorting() {
    if (!isEnabled) return;
    
    console.log(`EntraSort: Initializing sorting - isMainFrame: ${isMainFrame}, isEntraIframe: ${isEntraIframe}`);
    
    if (isEntraIframe) {
      // We're inside the Entra iframe - start sorting here
      console.log('EntraSort: Running inside Entra iframe - starting iframe sorting');
      startIframeSorting();
    } else if (isMainFrame) {
      // We're in the main frame - look for the iframe
      console.log('EntraSort: Running in main frame - looking for iframe');
      startMainFrameWatching();
    } else {
      // We might be in a different iframe
      console.log('EntraSort: Running in unknown iframe context');
      // Try to sort anyway in case the iframe name detection failed
      setTimeout(() => {
        const targetULs = document.querySelectorAll('ul.navLinkGroupContainerClass-156.nestedItemsClass-159');
        console.log(`EntraSort: Found ${targetULs.length} target ULs in unknown iframe context`);
        if (targetULs.length > 0) {
          console.log('EntraSort: Starting sorting in unknown iframe context');
          startIframeSorting();
        }
      }, 1000);
    }
  }
  
  function startIframeSorting() {
    console.log('EntraSort: Starting iframe sorting');
    
    // Start periodic sorting in iframe
    sortingInterval = setInterval(() => {
      if (isEnabled) {
        sortMenuItemsInIframe();
      }
    }, 2000);
    
    // Set up mutation observer for dynamic content in iframe
    setupIframeMutationObserver();
    
    // Initial sort with multiple attempts
    setTimeout(sortMenuItemsInIframe, 500);
    setTimeout(sortMenuItemsInIframe, 1500);
    setTimeout(sortMenuItemsInIframe, 3000);
  }
  
  function startMainFrameWatching() {
    console.log('EntraSort: Starting main frame watching');
    
    // In main frame, we watch for iframe and set up communication
    const checkForIframe = setInterval(() => {
      if (!isEnabled) {
        clearInterval(checkForIframe);
        return;
      }
      
      const iframe = document.querySelector('iframe[name="EntraNav.ReactView"]');
      if (iframe) {
        console.log('EntraSort: Found Entra iframe in main frame');
        console.log('EntraSort: Setting up postMessage communication with iframe');
        
        // Set up communication
        setupIframeMessageHandling(iframe);
        
        // Send initial enable message
        setTimeout(() => {
          if (iframe.contentWindow) {
            console.log('EntraSort: Sending initial enable message to iframe');
            iframe.contentWindow.postMessage({action: 'entrasort-enable'}, 'https://reactblade.portal.azure.net');
          }
        }, 1000);
        
        clearInterval(checkForIframe);
      }
    }, 1000);
  }
  
  function stopSorting() {
    if (sortingInterval) {
      clearInterval(sortingInterval);
      sortingInterval = null;
    }
    
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }
  
  function setupIframeMutationObserver() {
    observer = new MutationObserver(function(mutations) {
      if (!isEnabled) return;
      
      let shouldSort = false;
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldSort = true;
        }
      });
      
      if (shouldSort) {
        if (sortTimeout) clearTimeout(sortTimeout);
        sortTimeout = setTimeout(sortMenuItemsInIframe, 500);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  function sortMenuItemsInIframe() {
    if (!isEnabled) return;
    
    try {
      console.log('EntraSort: Attempting to sort menu items in iframe');
      
      // Try multiple selectors in case the classes have changed
      const selectors = [
        'ul.navLinkGroupContainerClass-156.nestedItemsClass-159',
        'ul[class*="navLinkGroupContainerClass"][class*="nestedItemsClass"]',
        'ul[class*="navLinkGroup"]',
        'ul[class*="nestedItems"]'
      ];
      
      let targetULs = [];
      
      for (const selector of selectors) {
        targetULs = document.querySelectorAll(selector);
        console.log(`EntraSort: Selector "${selector}" found ${targetULs.length} elements`);
        if (targetULs.length > 0) break;
      }
      
      if (targetULs.length === 0) {
        console.log('EntraSort: No target ULs found with any selector');
        // Log all ULs for debugging
        const allULs = document.querySelectorAll('ul');
        console.log(`EntraSort: Found ${allULs.length} total UL elements in document`);
        if (allULs.length > 0) {
          console.log('EntraSort: First few UL classes:', 
            Array.from(allULs).slice(0, 5).map(ul => ul.className));
        }
        return;
      }
      
      let sortedAny = false;
      
      targetULs.forEach((ul, index) => {
        console.log(`EntraSort: Processing UL ${index + 1}/${targetULs.length}`);
        const items = Array.from(ul.children);
        
        if (items.length === 0) {
          console.log(`EntraSort: UL ${index + 1} has no children`);
          return;
        }
        
        console.log(`EntraSort: UL ${index + 1} has ${items.length} items:`, 
          items.map(item => item.textContent.trim()).slice(0, 5));
        
        // Check if already sorted
        const sortedItems = [...items].sort((a, b) => 
          a.textContent.trim().localeCompare(b.textContent.trim())
        );
        
        // Compare current order with sorted order
        const needsSorting = !items.every((item, index) => item === sortedItems[index]);
        
        if (needsSorting) {
          console.log(`EntraSort: UL ${index + 1} needs sorting`);
          // Sort and reappend
          sortedItems.forEach(item => ul.appendChild(item));
          sortedAny = true;
        } else {
          console.log(`EntraSort: UL ${index + 1} already sorted`);
        }
      });
      
      if (sortedAny) {
        console.log('EntraSort: Menu items sorted alphabetically in iframe');
      } else {
        console.log('EntraSort: All menu items already sorted or no changes needed');
      }
      
    } catch (error) {
      console.error('EntraSort: Error sorting menu items in iframe:', error);
    }
  }
  
  function injectSortingIntoIframe(iframe) {
    console.log('EntraSort: Attempting to inject sorting into iframe');
    console.log('EntraSort: Iframe src:', iframe.src);
    console.log('EntraSort: Iframe origin:', iframe.contentWindow ? 'accessible' : 'not accessible');
    
    // Function to be injected into the iframe
    const sortingFunction = function() {
      // Add a unique identifier to verify injection worked
      window.entrasortInjected = true;
      console.log('🎯 EntraSort: Injected sorting function running in iframe - SUCCESS!');
      console.log('🎯 EntraSort iframe: Document ready state:', document.readyState);
      console.log('🎯 EntraSort iframe: URL:', window.location.href);
      console.log('🎯 EntraSort iframe: Document title:', document.title);
      
      let iframeSortingInterval;
      let isIframeEnabled = true;
      
      function sortMenuInIframe() {
        if (!isIframeEnabled) return;
        
        try {
          console.log('🔍 EntraSort iframe: Starting sorting attempt');
          
          // First, let's see what we have in the document
          const allElements = document.querySelectorAll('*');
          console.log(`🔍 EntraSort iframe: Total elements in document: ${allElements.length}`);
          
          const allULs = document.querySelectorAll('ul');
          console.log(`🔍 EntraSort iframe: Total UL elements: ${allULs.length}`);
          
          // Log all UL elements with their classes
          if (allULs.length > 0) {
            console.log('🔍 EntraSort iframe: All UL elements:');
            allULs.forEach((ul, i) => {
              console.log(`  UL ${i + 1}: class="${ul.className}", children: ${ul.children.length}, text preview: "${ul.textContent.substring(0, 100)}..."`);
            });
          }
          
          // Try multiple selectors
          const selectors = [
            'ul.navLinkGroupContainerClass-156.nestedItemsClass-159',
            'ul[class*="navLinkGroupContainerClass"][class*="nestedItemsClass"]',
            'ul[class*="navLinkGroup"]',
            'ul[class*="nestedItems"]',
            'ul[class*="nav"]',
            'ul[class*="menu"]',
            'ul[class*="link"]'
          ];
          
          let targetULs = [];
          let foundSelector = '';
          
          for (const selector of selectors) {
            targetULs = document.querySelectorAll(selector);
            console.log(`🔍 EntraSort iframe: Selector "${selector}" found ${targetULs.length} elements`);
            if (targetULs.length > 0) {
              foundSelector = selector;
              break;
            }
          }
          
          if (targetULs.length === 0) {
            console.log('❌ EntraSort iframe: No target ULs found with any selector');
            
            // Try to find any UL with list items that contain text
            const candidateULs = Array.from(allULs).filter(ul => {
              const items = ul.children;
              return items.length > 1 && 
                     Array.from(items).some(item => item.textContent.trim().length > 0);
            });
            
            console.log(`🔍 EntraSort iframe: Found ${candidateULs.length} candidate ULs with multiple text items`);
            
            if (candidateULs.length > 0) {
              console.log('🔍 EntraSort iframe: Candidate ULs:');
              candidateULs.forEach((ul, i) => {
                const items = Array.from(ul.children);
                const itemTexts = items.map(item => item.textContent.trim()).filter(text => text);
                console.log(`  Candidate ${i + 1}: ${items.length} items, classes: "${ul.className}"`);
                console.log(`    Item texts:`, itemTexts.slice(0, 5));
              });
              
              // Use the first candidate
              targetULs = [candidateULs[0]];
              foundSelector = 'candidate';
            } else {
              return;
            }
          }
          
          console.log(`✅ EntraSort iframe: Using selector "${foundSelector}", processing ${targetULs.length} ULs`);
          
          let sortedAny = false;
          
          targetULs.forEach((ul, index) => {
            const items = Array.from(ul.children);
            
            if (items.length === 0) {
              console.log(`⚠️  EntraSort iframe: UL ${index + 1} has no children`);
              return;
            }
            
            const itemTexts = items.map(item => item.textContent.trim()).filter(text => text);
            console.log(`🔍 EntraSort iframe: UL ${index + 1} has ${items.length} items with text:`, itemTexts.slice(0, 10));
            
            const sortedItems = [...items].sort((a, b) => 
              a.textContent.trim().localeCompare(b.textContent.trim())
            );
            
            const needsSorting = !items.every((item, index) => item === sortedItems[index]);
            
            if (needsSorting) {
              console.log(`🔄 EntraSort iframe: Sorting UL ${index + 1}`);
              sortedItems.forEach(item => ul.appendChild(item));
              sortedAny = true;
              
              // Log the new order
              const newOrder = Array.from(ul.children).map(item => item.textContent.trim()).filter(text => text);
              console.log(`✅ EntraSort iframe: New order:`, newOrder.slice(0, 10));
            } else {
              console.log(`✅ EntraSort iframe: UL ${index + 1} already sorted`);
            }
          });
          
          if (sortedAny) {
            console.log('🎉 EntraSort iframe: Menu items sorted successfully!');
          } else {
            console.log('ℹ️  EntraSort iframe: All items already in correct order');
          }
          
        } catch (error) {
          console.error('❌ EntraSort iframe: Error during sorting:', error);
        }
      }
      
      // Start periodic sorting
      iframeSortingInterval = setInterval(sortMenuInIframe, 2000);
      
      // Initial sorts
      setTimeout(sortMenuInIframe, 500);
      setTimeout(sortMenuInIframe, 1500);
      setTimeout(sortMenuInIframe, 3000);
      
      // Listen for disable messages
      window.addEventListener('message', function(event) {
        if (event.data && event.data.action === 'entrasort-disable') {
          isIframeEnabled = false;
          if (iframeSortingInterval) {
            clearInterval(iframeSortingInterval);
          }
        } else if (event.data && event.data.action === 'entrasort-enable') {
          isIframeEnabled = true;
          iframeSortingInterval = setInterval(sortMenuInIframe, 2000);
          setTimeout(sortMenuInIframe, 500);
        }
      });
    };
    
    // Try different methods to inject the code
    try {
      // Method 1: Direct iframe access (might fail due to cross-origin)
      if (iframe.contentDocument) {
        console.log('EntraSort: Injecting via contentDocument - iframe is same-origin');
        const script = iframe.contentDocument.createElement('script');
        script.textContent = `(${sortingFunction.toString()})();`;
        iframe.contentDocument.head.appendChild(script);
        console.log('EntraSort: Script injected successfully');
        
        // Set up communication
        setupIframeMessageHandling(iframe);
        return;
      } else {
        console.log('EntraSort: contentDocument not accessible - likely cross-origin iframe');
      }
    } catch (e) {
      console.log('EntraSort: Direct injection failed:', e.message);
    }
    
    // Method 2: Wait for iframe load and try again
    console.log('EntraSort: Setting up iframe load listener');
    iframe.addEventListener('load', () => {
      console.log('EntraSort: Iframe load event fired, trying injection again');
      try {
        if (iframe.contentDocument) {
          console.log('EntraSort: contentDocument now accessible after load');
          const script = iframe.contentDocument.createElement('script');
          script.textContent = `(${sortingFunction.toString()})();`;
          iframe.contentDocument.head.appendChild(script);
          console.log('EntraSort: Script injected successfully after load');
          setupIframeMessageHandling(iframe);
        } else {
          console.log('EntraSort: contentDocument still not accessible after load - cross-origin iframe confirmed');
          
          // Method 3: Try postMessage approach for cross-origin
          console.log('EntraSort: Attempting postMessage approach for cross-origin iframe');
          iframe.contentWindow.postMessage({
            action: 'entrasort-inject',
            code: sortingFunction.toString()
          }, '*');
        }
      } catch (e) {
        console.error('EntraSort: Failed to inject after load:', e);
      }
    });
    
    // Method 3: Also try immediately with postMessage in case iframe is already loaded
    try {
      if (iframe.contentWindow) {
        console.log('EntraSort: Trying immediate postMessage injection');
        iframe.contentWindow.postMessage({
          action: 'entrasort-inject',
          code: sortingFunction.toString()
        }, '*');
      }
    } catch (e) {
      console.log('EntraSort: PostMessage injection failed:', e.message);
    }
  }
  
  function setupIframeMessageHandling(iframe) {
    console.log('EntraSort: Setting up iframe message handling');
    
    // Store iframe reference for later communication
    window.entrasortIframe = iframe;
    
    // Listen for enable/disable messages from popup and forward to iframe
    const messageHandler = function(request) {
      if (iframe.contentWindow) {
        console.log(`EntraSort: Forwarding message to iframe - action: ${request.action}`);
        const targetOrigin = 'https://reactblade.portal.azure.net';
        if (request.action === 'enable') {
          iframe.contentWindow.postMessage({action: 'entrasort-enable'}, targetOrigin);
        } else if (request.action === 'disable') {
          iframe.contentWindow.postMessage({action: 'entrasort-disable'}, targetOrigin);
        }
      }
    };
    
    // Remove any existing listener to avoid duplicates
    if (window.entrasortMessageHandler) {
      chrome.runtime.onMessage.removeListener(window.entrasortMessageHandler);
    }
    
    // Add new listener
    window.entrasortMessageHandler = messageHandler;
    chrome.runtime.onMessage.addListener(messageHandler);
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSorting);
  } else {
    initializeSorting();
  }
  
})();

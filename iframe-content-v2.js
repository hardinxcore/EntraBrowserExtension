// Content script specifically for the Entra iframe (reactblade.portal.azure.net)
(function() {
  'use strict';
  
  console.log('🎯 EntraSort iframe-content.js: Script loaded in iframe!');
  console.log('🎯 EntraSort iframe: URL:', window.location.href);
  console.log('🎯 EntraSort iframe: Document ready state:', document.readyState);
  
  let isEnabled = true;
  let sortingInterval = null;
  let observer = null;
  let hasSortedSuccessfully = false; // Track if we've completed sorting
  let sortTimeout = null;
  let sortAttempts = 0;
  const MAX_SORT_ATTEMPTS = 5; // Stop trying after this many attempts
  
  // Load initial state from storage
  chrome.storage.sync.get(['entrasortEnabled'], function(result) {
    isEnabled = result.entrasortEnabled !== false; // Default to true
    console.log(`🎯 EntraSort iframe: Initial state loaded - enabled: ${isEnabled}`);
    if (isEnabled) {
      initializeSorting();
    }
  });
  
  // Listen for messages from popup (forwarded through main frame)
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(`🎯 EntraSort iframe: Received message - action: ${request.action}`);
    if (request.action === 'enable') {
      isEnabled = true;
      initializeSorting();
    } else if (request.action === 'disable') {
      isEnabled = false;
      stopSorting();
    }
  });
  
  // Also listen for postMessage from main frame
  window.addEventListener('message', function(event) {
    // Validate origin for security
    const allowedOrigins = [
      'https://entra.microsoft.com', 
      'https://portal.azure.com',
      'https://aad.portal.azure.com',
      'https://admin.microsoft.com'
    ];
    if (!allowedOrigins.includes(event.origin)) {
      return;
    }
    
    console.log('🎯 EntraSort iframe: Received postMessage:', event.data);
    if (event.data && event.data.action === 'entrasort-enable') {
      isEnabled = true;
      initializeSorting();
    } else if (event.data && event.data.action === 'entrasort-disable') {
      isEnabled = false;
      stopSorting();
    }
  });
  
  function initializeSorting() {
    console.log('🎯 EntraSort iframe: Initializing sorting');
    
    // Reset state when re-initializing (e.g., when toggled back on)
    hasSortedSuccessfully = false;
    sortAttempts = 0;
    
    // Start periodic sorting
    if (sortingInterval) {
      clearInterval(sortingInterval);
    }
    sortingInterval = setInterval(sortMenuItems, 2000);
    
    // Set up mutation observer
    setupMutationObserver();
    
    // Initial sort attempts
    setTimeout(sortMenuItems, 500);
    setTimeout(sortMenuItems, 1500);
    setTimeout(sortMenuItems, 3000);
  }
  
  function stopSorting() {
    console.log('🎯 EntraSort iframe: Stopping sorting');
    if (sortingInterval) {
      clearInterval(sortingInterval);
      sortingInterval = null;
    }
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    hasSortedSuccessfully = false; // Reset for next time
  }
  
  function stopPeriodicSorting() {
    if (sortingInterval) {
      clearInterval(sortingInterval);
      sortingInterval = null;
      console.log('🛑 EntraSort iframe: Stopped periodic sorting - task completed');
    }
  }
  
  function setupMutationObserver() {
    if (observer) {
      observer.disconnect();
    }
    
    observer = new MutationObserver(function(mutations) {
      if (!isEnabled || hasSortedSuccessfully) return;
      
      let shouldSort = false;
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldSort = true;
        }
      });
      
      if (shouldSort) {
        if (sortTimeout) clearTimeout(sortTimeout);
        sortTimeout = setTimeout(sortMenuItems, 500);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  function sortMenuItems() {
    if (!isEnabled) return;
    
    // Stop if we've already completed sorting successfully or tried too many times
    if (hasSortedSuccessfully || sortAttempts >= MAX_SORT_ATTEMPTS) {
      if (sortAttempts >= MAX_SORT_ATTEMPTS && !hasSortedSuccessfully) {
        console.log('🛑 EntraSort iframe: Stopping after maximum attempts reached');
      }
      stopPeriodicSorting();
      return;
    }
    
    sortAttempts++;
    console.log(`🔍 EntraSort iframe: Starting sorting attempt ${sortAttempts}/${MAX_SORT_ATTEMPTS}`);
    
    try {
      // First, let's see what we have in the document
      const allElements = document.querySelectorAll('*');
      console.log(`🔍 EntraSort iframe: Total elements in document: ${allElements.length}`);
      
      const allULs = document.querySelectorAll('ul');
      console.log(`🔍 EntraSort iframe: Total UL elements: ${allULs.length}`);
      
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
        
        // Try to find any UL with multiple list items that contain meaningful text
        const candidateULs = Array.from(allULs).filter(ul => {
          const items = ul.children;
          if (items.length < 2) return false;
          
          const textItems = Array.from(items).filter(item => 
            item.textContent.trim().length > 0 && 
            item.textContent.trim().length < 200 // Not too long
          );
          
          return textItems.length >= 2;
        });
        
        console.log(`🔍 EntraSort iframe: Found ${candidateULs.length} candidate ULs with multiple text items`);
        
        if (candidateULs.length > 0) {
          console.log('🔍 EntraSort iframe: Candidate ULs:');
          candidateULs.slice(0, 5).forEach((ul, i) => {
            const items = Array.from(ul.children);
            const itemTexts = items.map(item => item.textContent.trim()).filter(text => text && text.length < 100);
            console.log(`  Candidate ${i + 1}: ${items.length} items, classes: "${ul.className}"`);
            console.log(`    Item texts:`, itemTexts.slice(0, 5));
          });
          
          // Use all candidates that look like menus
          targetULs = candidateULs.slice(0, 3); // Limit to first 3 to avoid sorting non-menu lists
          foundSelector = 'candidate';
        } else {
          console.log('❌ EntraSort iframe: No suitable candidate ULs found');
          // Mark as completed (no sortable content found) to stop trying
          hasSortedSuccessfully = true;
          console.log('ℹ️  EntraSort iframe: All items already in correct order or no sortable items found');
          stopPeriodicSorting();
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
        console.log(`🔍 EntraSort iframe: UL ${index + 1} has ${items.length} items:`);
        console.log(`    Texts:`, itemTexts.slice(0, 10));
        
        // Only sort if we have meaningful text items
        if (itemTexts.length < 2) {
          console.log(`⚠️  EntraSort iframe: UL ${index + 1} has insufficient text items, skipping`);
          return;
        }
        
        const sortedItems = [...items].sort((a, b) => {
          // Clean text by keeping only letters and spaces, removing all special characters
          const textA = a.textContent.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ').trim();
          const textB = b.textContent.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ').trim();
          return textA.localeCompare(textB);
        });
        
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
        hasSortedSuccessfully = true;
        stopPeriodicSorting();
      } else {
        console.log('ℹ️  EntraSort iframe: All items already in correct order or no sortable items found');
        hasSortedSuccessfully = true;
        stopPeriodicSorting();
      }
      
    } catch (error) {
      console.error('❌ EntraSort iframe: Error during sorting:', error);
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSorting);
  } else {
    initializeSorting();
  }
  
  console.log('🎯 EntraSort iframe-content.js: Script initialization complete');
  
})();

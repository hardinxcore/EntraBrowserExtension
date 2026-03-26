// Handle keyboard shortcut to add current page
chrome.commands.onCommand.addListener((command) => {
  if (command === 'add-favorite') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.url || (!tab.url.includes('entra.microsoft.com') && !tab.url.includes('portal.azure.com'))) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Entra Favorites',
          message: 'Not a valid Entra or Azure portal page!'
        });
        return;
      }

      const rawTitle = tab.title || 'Unknown';
      const cleanTitle = rawTitle.replace(' - Microsoft Azure', '').replace(' - Microsoft Entra admin center', '').trim();
      
      let type = 'applications';
      if (tab.url.includes('Group') || tab.url.includes('GroupsManagementMenuBlade')) {
        type = 'groups';
      } else if (tab.url.includes('User') || tab.url.includes('UserManagementMenuBlade') || tab.url.includes('UsersAndTenants')) {
        type = 'users';
      }

      const id = Date.now().toString();
      const newFav = {
        id,
        name: cleanTitle,
        url: tab.url,
        type,
        addedAt: Date.now(),
        color: '' // Default no color tag
      };

      chrome.storage.sync.get(['entraFavorites'], (result) => {
        const favorites = result.entraFavorites || [];
        favorites.push(newFav);
        
        chrome.storage.sync.set({ entraFavorites: favorites }, () => {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Entra Favorites',
            message: `"${cleanTitle}" added to favorites!`
          });
        });
      });
    });
  }
});

// Omnibox integration: typing "entra [Tab]" in address bar
let cachedFavorites = [];
function fetchFavoritesForOmnibox() {
  chrome.storage.sync.get(['entraFavorites'], (result) => {
    cachedFavorites = result.entraFavorites || [];
  });
}

// Load on startup
fetchFavoritesForOmnibox();

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  const query = text.toLowerCase().trim();
  const matched = cachedFavorites.filter(f => f.name.toLowerCase().includes(query));
  
  if (matched.length > 0) {
    chrome.omnibox.setDefaultSuggestion({
      description: `Open <match>${matched[0].name}</match>`
    });
    
    // Provide rest as suggestions (limit 5)
    if (matched.length > 1) {
      const suggestions = matched.slice(1, 6).map(f => {
        return {
          content: f.url,
          description: `<dim>[${f.type.toUpperCase()}]</dim> <match>${f.name}</match>`
        };
      });
      suggest(suggestions);
    }
  } else {
    chrome.omnibox.setDefaultSuggestion({
      description: `Search Microsoft Entra for <match>${text}</match>`
    });
  }
});

chrome.omnibox.onInputEntered.addListener((text, disposition) => {
  let finalUrl = `https://entra.microsoft.com/#search/${encodeURIComponent(text)}`;
  
  // If the user hit enter on a specific suggestion URL
  if (text.startsWith('http')) {
    finalUrl = text;
  } else {
    // If they just hit enter on the default suggestion
    const query = text.toLowerCase().trim();
    if (query === '') {
      finalUrl = 'https://entra.microsoft.com/';
    } else {
      const firstMatch = cachedFavorites.find(f => f.name.toLowerCase().includes(query));
      if (firstMatch) {
        finalUrl = firstMatch.url;
      }
    }
  }
  
  // Also check if a universal tenantId is configured and should be appended
  chrome.storage.sync.get(['entraGlobalTenantId'], (result) => {
    if (result.entraGlobalTenantId) {
      if (finalUrl.includes('?')) {
        finalUrl += `&tenantId=${encodeURIComponent(result.entraGlobalTenantId)}`;
      } else if (finalUrl.includes('#')) {
        const parts = finalUrl.split('#');
        parts[0] += `?tenantId=${encodeURIComponent(result.entraGlobalTenantId)}`;
        finalUrl = parts.join('#');
      } else {
        finalUrl += `?tenantId=${encodeURIComponent(result.entraGlobalTenantId)}`;
      }
    }
    
    // Open based on user disposition (current tab, new tab foreground/background)
    if (disposition === 'currentTab') {
      chrome.tabs.update({ url: finalUrl });
    } else {
      chrome.tabs.create({ url: finalUrl, active: disposition === 'newForegroundTab' });
    }
  });
});

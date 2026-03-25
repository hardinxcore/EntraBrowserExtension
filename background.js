chrome.commands.onCommand.addListener((command) => {
  if (command === 'add-favorite') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.url.includes('entra.microsoft.com')) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Entra Favorieten',
          message: 'Niet op een geldige Entra pagina!'
        });
        return;
      }

      const rawTitle = tab.title || 'Onbekend';
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
        addedAt: Date.now()
      };

      chrome.storage.sync.get(['entraFavorites'], (result) => {
        const favorites = result.entraFavorites || [];
        favorites.push(newFav);
        
        chrome.storage.sync.set({ entraFavorites: favorites }, () => {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Entra Favorieten',
            message: `"${cleanTitle}" toegevoegd aan favorieten!`
          });
        });
      });
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const tabs = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const addBtn = document.getElementById('add-btn');
  const toast = document.getElementById('toast');
  const searchInput = document.getElementById('search-input');
  
  // Lists & Empty state elements
  const lists = {
    applications: document.getElementById('list-applications'),
    groups: document.getElementById('list-groups'),
    users: document.getElementById('list-users')
  };
  const emptyStates = {
    applications: document.getElementById('empty-applications'),
    groups: document.getElementById('empty-groups'),
    users: document.getElementById('empty-users')
  };

  // State
  let favorites = [];
  let searchQuery = '';

  // Initialize
  loadFavorites();
  checkCurrentUrl();

  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
      searchInput.focus();
    });
  });

  // Search
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderFavorites();
  });

  // Export
  document.getElementById('export-btn').addEventListener('click', () => {
    if (favorites.length === 0) {
      showToast('Geen data om te exporteren.');
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(favorites, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `entra_favorieten_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
  });

  // Import
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('file-input').click();
  });
  
  document.getElementById('file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const imported = JSON.parse(evt.target.result);
          if (Array.isArray(imported)) {
             const validFavs = imported.filter(i => i.id && i.name && i.url && i.type);
             const ids = new Set(favorites.map(f => f.id));
             let addedCount = 0;
             
             validFavs.forEach(vf => {
                if (!ids.has(vf.id)) {
                  favorites.push(vf);
                  addedCount++;
                }
             });
             
             await saveFavorites(favorites);
             renderFavorites();
             showToast(`${addedCount} favorites geïmporteerd!`);
          } else {
             showToast('Ongeldig bestand.');
          }
        } catch(err) {
          showToast('Fout bij importeren.');
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    e.target.value = '';
  });

  // Edit Modal
  let editingId = null;
  const editModal = document.getElementById('edit-modal');
  const editInput = document.getElementById('edit-name-input');
  
  function openEditModal(id) {
    editingId = id;
    const fav = favorites.find(f => f.id === id);
    if (fav) {
      editInput.value = fav.name;
      editModal.classList.remove('hidden');
      editInput.focus();
      editInput.select();
    }
  }

  document.getElementById('cancel-edit-btn').addEventListener('click', () => {
    editModal.classList.add('hidden');
    editingId = null;
  });

  document.getElementById('save-edit-btn').addEventListener('click', async () => {
    if (editingId && editInput.value.trim() !== '') {
      const idx = favorites.findIndex(f => f.id === editingId);
      if (idx > -1) {
        favorites[idx].name = editInput.value.trim();
        await saveFavorites(favorites);
        renderFavorites();
        showToast('Naam gewijzigd!');
      }
      editModal.classList.add('hidden');
      editingId = null;
    }
  });
  
  // Submit edit on Enter
  editInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('save-edit-btn').click();
    }
  });

  // Add Page Logic
  addBtn.addEventListener('click', async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url.includes('entra.microsoft.com')) {
          showToast('Niet op een geldige Entra pagina!');
          return;
        }

        const cleanTitle = (tab.title || 'Onbekend').replace(' - Microsoft Azure', '').replace(' - Microsoft Entra admin center', '').trim();
        
        let type = 'applications';
        if (tab.url.includes('Group') || tab.url.includes('GroupsManagementMenuBlade')) {
          type = 'groups';
        } else if (tab.url.includes('User') || tab.url.includes('UserManagementMenuBlade') || tab.url.includes('UsersAndTenants')) {
          type = 'users';
        }

        const id = Date.now().toString();
        favorites.push({
          id,
          name: cleanTitle,
          url: tab.url,
          type,
          addedAt: Date.now()
        });
        
        await saveFavorites(favorites);
        
        // Switch to the correct tab if not already on it
        const currentActiveBtn = document.querySelector('.tab-btn.active');
        if (currentActiveBtn.getAttribute('data-tab') !== type) {
          document.querySelector(`.tab-btn[data-tab="${type}"]`).click();
        }
        
        renderFavorites();
        showToast('Opgeslagen!');
      }
    } catch (err) {
      showToast('Fout bij opslaan.');
    }
  });

  // Storage
  function loadFavorites() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get(['entraFavorites'], (result) => {
        if (result.entraFavorites) favorites = result.entraFavorites;
        renderFavorites();
      });
    }
  }

  function saveFavorites(favs) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set({ entraFavorites: favs }, () => resolve());
      } else resolve();
    });
  }

  function deleteFavorite(id) {
    if (confirm('Weet je zeker dat je deze favoriet wilt verwijderen?')) {
      favorites = favorites.filter(f => f.id !== id);
      saveFavorites(favorites).then(() => {
        renderFavorites();
        showToast('Verwijderd.');
      });
    }
  }

  // Render
  function renderFavorites() {
    Object.values(lists).forEach(list => list.innerHTML = '');
    
    // Filter & Group
    const filtered = searchQuery === '' 
      ? favorites 
      : favorites.filter(f => f.name.toLowerCase().includes(searchQuery));

    const grouped = {
      applications: filtered.filter(f => f.type === 'applications'),
      groups: filtered.filter(f => f.type === 'groups'),
      users: filtered.filter(f => f.type === 'users')
    };

    Object.keys(grouped).forEach(type => {
      const items = grouped[type];
      
      if (items.length === 0) {
        emptyStates[type].classList.add('visible');
      } else {
        emptyStates[type].classList.remove('visible');
        
        items.sort((a, b) => b.addedAt - a.addedAt).forEach(fav => {
          const li = document.createElement('li');
          li.className = 'favorite-item';
          
          let iconLetter = fav.name.charAt(0).toUpperCase();

          li.innerHTML = `
            <div class="favorite-info" title="${fav.name}">
              <div class="favorite-icon">${iconLetter}</div>
              <div class="favorite-name">${fav.name}</div>
            </div>
            <div class="item-actions">
              <button class="action-btn edit" title="Bewerken" data-id="${fav.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"></path>
                </svg>
              </button>
              <button class="action-btn delete" title="Verwijderen" data-id="${fav.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"></path>
                </svg>
              </button>
            </div>
          `;
          
          // Click info to navigate
          li.querySelector('.favorite-info').addEventListener('click', () => {
            if (typeof chrome !== 'undefined' && chrome.tabs) {
              chrome.tabs.create({ url: fav.url });
            }
          });

          // Click edit
          li.querySelector('.action-btn.edit').addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(fav.id);
          });

          // Click delete
          li.querySelector('.action-btn.delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteFavorite(fav.id);
          });

          lists[type].appendChild(li);
        });
      }
    });
  }

  // URL checking
  async function checkCurrentUrl() {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url.includes('entra.microsoft.com')) {
          addBtn.disabled = true;
          addBtn.innerText = 'Navigeer naar Entra';
          addBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            chrome.tabs.create({ url: 'https://entra.microsoft.com' });
          }, { once: true });
        }
      }
    } catch(err) {}
  }

  // Toast
  let toastTimeout;
  function showToast(message) {
    toast.innerText = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }
});

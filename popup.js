document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const tabs = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const addBtn = document.getElementById('add-btn');
  const toast = document.getElementById('toast');
  const searchInput = document.getElementById('search-input');
  const tenantInput = document.getElementById('tenant-input');
  const sortToggle = document.getElementById('sort-toggle');
  
  // Lists
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
  let globalTenantId = '';
  const COLORS = {
    blue: '#0078d4',
    red: '#d13438',
    green: '#107c10',
    yellow: '#ffaa44',
    purple: '#5c2d91',
    none: 'rgba(0, 120, 212, 0.1)'
  };

  // Setup Color Picker
  const colorPickerContainer = document.getElementById('edit-color-picker');
  Object.keys(COLORS).forEach(cName => {
    const el = document.createElement('div');
    el.className = 'color-option';
    el.style.backgroundColor = COLORS[cName];
    el.dataset.color = COLORS[cName];
    el.dataset.name = cName;
    el.title = cName;
    colorPickerContainer.appendChild(el);
    
    el.addEventListener('click', () => {
      document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');
    });
  });

  // Init
  loadFavorites();
  loadSettings();
  checkCurrentUrl();

  // Settings: Tenant & Sort Toggle
  function loadSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get(['entraGlobalTenantId', 'entrasortEnabled'], (result) => {
        if (result.entraGlobalTenantId) {
          globalTenantId = result.entraGlobalTenantId;
          tenantInput.value = globalTenantId;
        }
        sortToggle.checked = result.entrasortEnabled !== false;
      });
    }
  }

  tenantInput.addEventListener('input', (e) => {
    globalTenantId = e.target.value.trim();
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ entraGlobalTenantId: globalTenantId });
    }
  });

  sortToggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ entrasortEnabled: isEnabled }, () => {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            if (tab.url && (tab.url.includes('microsoft') || tab.url.includes('azure'))) {
              chrome.tabs.sendMessage(tab.id, { action: isEnabled ? 'enable' : 'disable' }).catch(() => {});
            }
          });
        });
        showToast(isEnabled ? 'Auto-sort On' : 'Auto-sort Off');
      });
    }
  });

  // Tabs
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
    });
  });

  // Search
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderFavorites();
  });

  // Export / Import
  document.getElementById('export-btn').addEventListener('click', () => {
    if (favorites.length === 0) {
      showToast('No data to export.');
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(favorites, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `entra_favorites_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
  });

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
             const ids = new Set(favorites.map(f => f.id));
             let addedCount = 0;
             imported.forEach(vf => {
                if (vf.id && vf.name && vf.url && !ids.has(vf.id)) {
                  favorites.push(vf);
                  addedCount++;
                }
             });
             await saveFavorites(favorites);
             renderFavorites();
             showToast(`Imported ${addedCount} items!`);
          } else {
             showToast('Invalid file format.');
          }
        } catch(err) {
          showToast('Error importing file.');
        }
      };
      reader.readAsText(file);
    }
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
      
      // Auto-select current color
      document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
      if (fav.color) {
        const matching = Array.from(document.querySelectorAll('.color-option')).find(o => o.dataset.color === fav.color);
        if (matching) matching.classList.add('selected');
      } else {
        document.querySelector('.color-option[data-name="none"]').classList.add('selected');
      }

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
        const selectedColorDiv = document.querySelector('.color-option.selected');
        let selectedColor = selectedColorDiv ? selectedColorDiv.dataset.color : '';
        if (selectedColor === COLORS.none) selectedColor = '';
        favorites[idx].color = selectedColor;

        await saveFavorites(favorites);
        renderFavorites();
        showToast('Saved changes!');
      }
      editModal.classList.add('hidden');
      editingId = null;
    }
  });

  editInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') document.getElementById('save-edit-btn').click();
  });

  // Add Current Page
  addBtn.addEventListener('click', async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url || (!tab.url.includes('entra.microsoft.com') && !tab.url.includes('portal.azure.com'))) {
          showToast('Not on a valid Entra/Azure page!');
          return;
        }

        const cleanTitle = (tab.title || 'Unknown').replace(' - Microsoft Azure', '').replace(' - Microsoft Entra admin center', '').trim();
        
        let type = 'applications';
        if (tab.url.includes('Group') || tab.url.includes('GroupsManagementMenuBlade')) {
          type = 'groups';
        } else if (tab.url.includes('User') || tab.url.includes('UserManagementMenuBlade') || tab.url.includes('UsersAndTenants')) {
          type = 'users';
        }

        favorites.push({
          id: Date.now().toString(),
          name: cleanTitle,
          url: tab.url,
          type,
          addedAt: Date.now(),
          color: ''
        });
        
        await saveFavorites(favorites);
        
        const currentActiveBtn = document.querySelector('.tab-btn.active');
        if (currentActiveBtn.getAttribute('data-tab') !== type) {
          document.querySelector(`.tab-btn[data-tab="${type}"]`).click();
        }
        
        renderFavorites();
        showToast('Added to favorites!');
      }
    } catch (err) {
      showToast('Error saving.');
    }
  });

  // Helper
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

  function renderFavorites() {
    Object.values(lists).forEach(list => list.innerHTML = '');
    
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
          const bgStyle = fav.color ? `background-color: ${fav.color}; color: white;` : '';

          // Extract Object ID if present for "Copy ID"
          const objIdMatch = fav.url.match(/objectId\/([a-z0-9\-]+)/i) || fav.url.match(/appId\/([a-z0-9\-]+)/i);
          let copyBtnHtml = '';
          if (objIdMatch && objIdMatch[1]) {
            copyBtnHtml = `
              <button class="action-btn copy" title="Copy Object ID" data-val="${objIdMatch[1]}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              </button>
            `;
          }

          li.innerHTML = `
            <div class="favorite-info" title="${fav.name}">
              <div class="favorite-icon" style="${bgStyle}">${iconLetter}</div>
              <div class="favorite-name">${fav.name}</div>
            </div>
            <div class="item-actions">
              ${copyBtnHtml}
              <button class="action-btn edit" title="Edit" data-id="${fav.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"></path>
                </svg>
              </button>
              <button class="action-btn delete" title="Delete" data-id="${fav.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"></path>
                </svg>
              </button>
            </div>
          `;
          
          li.querySelector('.favorite-info').addEventListener('click', () => {
            if (typeof chrome !== 'undefined' && chrome.tabs) {
              let finalUrl = fav.url;
              if (globalTenantId) {
                if (finalUrl.includes('?')) {
                  finalUrl += `&tenantId=${encodeURIComponent(globalTenantId)}`;
                } else if (finalUrl.includes('#')) {
                  const parts = finalUrl.split('#');
                  parts[0] += `?tenantId=${encodeURIComponent(globalTenantId)}`;
                  finalUrl = parts.join('#');
                } else {
                  finalUrl += `?tenantId=${encodeURIComponent(globalTenantId)}`;
                }
              }
              chrome.tabs.create({ url: finalUrl });
            }
          });

          if (copyBtnHtml) {
            li.querySelector('.action-btn.copy').addEventListener('click', (e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(objIdMatch[1]).then(() => {
                showToast('Copied to clipboard!');
              });
            });
          }

          li.querySelector('.action-btn.edit').addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(fav.id);
          });

          li.querySelector('.action-btn.delete').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Delete this favorite?')) {
              favorites = favorites.filter(f => f.id !== fav.id);
              saveFavorites(favorites).then(() => {
                renderFavorites();
                showToast('Deleted.');
              });
            }
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
        if (!tab || !tab.url || (!tab.url.includes('entra.microsoft.com') && !tab.url.includes('portal.azure.com'))) {
          addBtn.disabled = true;
          addBtn.innerText = 'Navigate to Entra';
          addBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            chrome.tabs.create({ url: 'https://entra.microsoft.com' });
          }, { once: true });
        }
      }
    } catch(err) {}
  }

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

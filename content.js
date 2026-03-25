function sortEntraMenus() {
  try {
    // Find potential navigation containers (optimized for performance)
    const allContainers = document.querySelectorAll('nav, ul, [role="group"], [role="tree"], [role="list"], .fxc-menu, .ms-Nav-navItems');
    
    allContainers.forEach(container => {
      const children = Array.from(container.children);
      // Need at least 4 items to bother sorting, ignore very large lists (data tables)
      if (children.length < 4 || children.length > 80) return; 
      
      // Determine if this container is primarily a list of navigation links
      // We look for <a> tags, role="treeitem", role="menuitem", role="presentation"
      let validNavItems = 0;
      children.forEach(c => {
        const role = c.getAttribute('role');
        const tagName = c.tagName.toUpperCase();
        // Sometimes the link is inside a wrapper div
        const hasInnerLink = c.querySelector('a') !== null;
        
        if (tagName === 'A' || tagName === 'LI' || role === 'treeitem' || role === 'menuitem' || role === 'presentation' || hasInnerLink) {
          validNavItems++;
        }
      });
      
      // If at least 80% of children look like navigation items, treat it as a menu
      if (validNavItems / children.length >= 0.8) {
        
        const items = children.map(child => {
          let text = (child.innerText || child.textContent || '').trim();
          // Remove potential star icons, newlines, and extra spaces
          text = text.replace(/★/g, '').replace(/[\n\r]+|[\s]{2,}/g, ' ').trim().toLowerCase();
          return { element: child, text: text };
        }).filter(item => item.text !== '');
        
        if (items.length < 4) return;

        // Pinned keywords that should always stay at top
        const isPinned = (t) => ['overview', 'overzicht', 'getting started', 'aan de slag', 'home'].includes(t);
        
        let isSorted = true;
        for (let i = 0; i < items.length - 1; i++) {
          const a = items[i].text;
          const b = items[i+1].text;
          
          if (isPinned(a) && !isPinned(b)) continue;
          if (!isPinned(a) && isPinned(b)) { isSorted = false; break; }
          if (isPinned(a) && isPinned(b)) continue;
          
          if (a > b) {
            isSorted = false;
            break;
          }
        }
        
        if (!isSorted) {
          // It's out of order -> let's sort
          items.sort((a, b) => {
            const aPinned = isPinned(a.text);
            const bPinned = isPinned(b.text);
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            return a.text.localeCompare(b.text);
          });
          
          // Re-append to the container in sorted order
          const fragment = document.createDocumentFragment();
          items.forEach(item => fragment.appendChild(item.element));
          container.appendChild(fragment);
        }
      }
    });
  } catch(e) {
    // Fail silently on errors so we don't spam the console in the entra portal
    // console.debug("Entra Favorites: Fout bij sorteren", e);
  }
}

// Run periodically to catch SPA navigation and dynamic DOM mutations
setInterval(sortEntraMenus, 2000);
setTimeout(sortEntraMenus, 500);

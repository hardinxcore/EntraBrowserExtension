# Entra & Intune Favorites Sorter - Browser Extension

A power user browser extension designed for Microsoft Entra (Azure AD), Microsoft Intune, and Microsoft 365 administrators. This extension boosts your productivity by allowing you to quickly bookmark, navigate, and sort resources in the Entra and Intune admin centers.

![Entra Favorites](https://raw.githubusercontent.com/username/entra-favorites/main/images/screenshot.png) *(Add a screenshot here)*

## 🚀 Features

*   **Quick Bookmarks:** Add any Microsoft Entra Application, User, Group, or Intune Device / Policy to your favorites with a single click.
*   **Omnibox Integration:** Type `entra` in your Chrome address bar, hit `Tab`, and search your favorites directly from the browser!
*   **Global Tenant Switcher:** Managing multiple CSP environments? Enter a Tenant ID in the extension to automatically append it (`?tenantId=...`) to all your favorite links.
*   **Auto-Sort Navigation:** Hate the messy left-hand navigation blades in Azure/Entra/Intune? The extension automatically sorts all menus alphabetically (while keeping "Overview" at the top). Includes an easy on/off toggle.
*   **Copy Object IDs:** Instantly copy the exact Application ID or Object ID straight from the extension popup with one click (`📋`).
*   **Color Tags:** Assign colors to your favorites (e.g. Red for Production, Green for Test) to keep your lists organized.
*   **Export & Import:** Backup your favorites to JSON or share them with new colleagues so they don't have to navigate from scratch.
*   **Keyboard Shortcuts:** Press `Ctrl+Shift+E` (or `Cmd+Shift+E`) on any Entra page to save it instantly.
*   **Quick Links:** Handy shortcuts at the bottom of the popup to Azure Cloud Shell, Graph Explorer, and Microsoft 365 Admin Center.

## 🛠️ Installation

Currently, this extension is not available in the Chrome Web Store. You can install it manually by following these steps:

1. Clone or download this repository to your local machine:
   ```bash
   git clone https://github.com/yourusername/entra-favorites-extension.git
   ```
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle in the top right corner.
4. Click **Load unpacked** and select the folder you just downloaded (`EntraBrowserExtension`).
5. The extension is now installed! You can pin it to your toolbar for easy access.

## ⚙️ Permissions Used

*   `activeTab`: Required to capture the URL and Title of the current page when you add a favorite.
*   `storage`: Required to save your favorites, settings, and Tenant ID configurations.
*   `scripting`: Required to inject the automatic alphabet-sorting scripts into the Entra SPA.
*   `notifications`: Used to provide non-intrusive feedback when saving a favorite via keyboard shortcuts.
*   *Host Permissions*: `*://entra.microsoft.com/*`, `*://intune.microsoft.com/*`, `*://endpoint.microsoft.com/*`, `*://portal.azure.com/*`, `*://reactblade.portal.azure.net/*` to ensure the sidebar sorting works locally and within Microsoft's complex IFrames.

## ⌨️ Shortcuts

*   **Add Favorite:** `Ctrl+Shift+E` (Windows) / `Cmd+Shift+E` (Mac)
*   **Omnibox Search:** Focus address bar (`Ctrl+L`), type `entra` + `Tab`, then start typing the name of your favorite.

## 🧑‍💻 Contributing

Pull requests are more than welcome! Whether it's adding a new feature, fixing a bug, or translating the interface to other languages, feel free to contribute.

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

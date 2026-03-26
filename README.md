# Entra & Intune Favorites Sorter - Browser Extension

A power user browser extension designed for Microsoft Entra (Azure AD), Microsoft Intune, and Microsoft 365 administrators. This extension boosts your productivity by allowing you to quickly bookmark, navigate, and sort resources in the Entra and Intune admin centers.

![Entra Favorites](https://raw.githubusercontent.com/hardinxcore/EntraBrowserExtension/main/images/screenshot.png) *(Add a screenshot here)*

## 🚀 Features & Usage Guide

1.  **Quick Bookmarks & Keyboard Shortcuts**
    *   **Action:** Press `Ctrl+Shift+E` (Windows) or `Cmd+Shift+E` (Mac) while visiting any valid Entra, Intune, or Azure page.
    *   **Result:** Instantly saves your current page as a favorite (Application, User, Group, or Intune policy) and triggers a background notification. No clicking required!

2.  **Omnibox Integration (Address Bar Search)**
    *   **Action:** Click your Chrome address bar (or press `Ctrl+L`). Type `entra` and hit `Tab`. Then type part of a favorite's name.
    *   **Result:** You can instantly search your favorites without opening the popup and hit `Enter` to navigate directly.

3.  **Global Tenant Switcher**
    *   **Action:** In the extension popup, enter a Tenant ID in the input field at the top.
    *   **Result:** Managing multiple CSP environments? Every favorite you click will automatically have `?tenantId=...` appended to it, routing you directly to the correct customer environment.

4.  **Auto-Sort Navigation (Integrated EntraSort)**
    *   **Action:** Open the extension and ensure the **Auto-sort Menus** toggle is switched on.
    *   **Result:** The messy left-hand navigation blades in Azure/Entra/Intune are automatically sorted alphabetically (while keeping "Overview" fixed at the top). It effortlessly works even inside Microsoft's complex IFrames!

5.  **Copy Object IDs**
    *   **Action:** If you added a User, Group, or App, hover over the item in the list.
    *   **Result:** You will see a `📋` (copy) icon next to the edit and delete buttons. Clicking it instantly extracts and copies the GUID from the URL to your clipboard.

6.  **Color Tags**
    *   **Action:** Click the `Edit` (pencil) icon on an existing favorite.
    *   **Result:** The modal allows you to pick a color background for that item, letting you visually differentiate environments (e.g., Red for Prod, Green for Test).

7.  **Export & Import**
    *   **Action:** Click the top-right transfer icons to download your favorites as a `.json` file, or upload an existing file.
    *   **Result:** Easily backup your favorites or share them with new colleagues so they don't have to build a navigation list from scratch.

8.  **Quick Links**
    *   At the bottom of the popup, there are 3 rapid links to Azure Cloud Shell, Graph Explorer, and the Microsoft 365 Admin Center.

## 🛠️ Installation

Currently, this extension is not available in the Chrome Web Store. You can install it manually by following these steps:

1. Clone or download this repository to your local machine:
   ```bash
   git clone https://github.com/hardinxcore/EntraBrowserExtension.git
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

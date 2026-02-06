# Installation Guide

## Zen Browser Installation

### Step 1: Enable Unsigned Extensions

1. Open Zen Browser
2. Navigate to `about:config`
3. Accept the warning if prompted
4. Search for: `xpinstall.signatures.required`
5. Double-click to set it to `false`
6. Close the about:config tab

> **Note:** This setting persists across restarts. You only need to do this once.

### Step 2: Install the Extension

**Option A: From GitHub Release (Recommended)**

1. Go to: https://github.com/janilaatunen/zen-tab-manager/releases
2. Download the latest `zen-tab-manager.xpi`
3. Open Zen Browser
4. Navigate to `about:addons`
5. Click the gear icon ⚙️
6. Select "Install Add-on From File"
7. Choose the downloaded `zen-tab-manager.xpi`
8. Click "Add" when prompted

**Option B: From Local File**

1. Locate `zen-tab-manager.xpi` on your computer
2. Open Zen Browser
3. Navigate to `about:addons`
4. Click the gear icon ⚙️
5. Select "Install Add-on From File"
6. Choose `zen-tab-manager.xpi`
7. Click "Add" when prompted

### Step 3: Configure the Extension

1. In `about:addons`, find "Zen Tab Manager"
2. Click "Options" or "Preferences"
3. Configure your settings:
   - **Auto-Archive:** Enable and set hours threshold
   - **Excluded Domains:** Add domains to never archive
   - **Container Rules:** Map URL patterns to containers

> **Important:** For workspace organization to work, you must configure container → workspace mapping in Zen's settings.

## Firefox Installation

The extension works on Firefox with the same installation steps. However, Firefox doesn't have workspaces, so tabs will only be organized by container (visual distinction), not spatial separation.

## Verification

After installation, you should see:
- Extension icon in the toolbar
- "Zen Tab Manager" listed in `about:addons`
- Options page accessible from the add-ons manager

## Troubleshooting

**Extension won't install:**
- Verify `xpinstall.signatures.required` is set to `false`
- Check that you downloaded the full XPI file (should be ~13KB)
- Try restarting Zen Browser

**Settings not saving:**
- Check browser console for errors: `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows/Linux)
- Try reinstalling the extension

**Tabs not being archived:**
- Ensure auto-archive is enabled in settings
- Check that domains aren't in the excluded list
- Verify tabs aren't pinned (if "Exclude pinned tabs" is enabled)

**Tabs not moving to workspaces:**
- Verify container rules are configured
- Check that containers exist in Zen
- Configure Zen's container → workspace mapping in Zen's settings
- Enable Zen's auto-switching feature

## Updating

When a new version is released:

1. Download the new XPI file
2. Navigate to `about:addons`
3. Remove the old version
4. Install the new XPI file

> **Note:** Your settings are stored separately and won't be lost when updating.

## Uninstalling

1. Navigate to `about:addons`
2. Find "Zen Tab Manager"
3. Click the three dots menu
4. Select "Remove"

Your settings will be deleted with the extension.

## Support

- **Issues:** https://github.com/janilaatunen/zen-tab-manager/issues
- **Email:** jani@laatunen.fi

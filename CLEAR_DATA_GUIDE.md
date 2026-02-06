# Clear Synced Data Guide

This guide shows how to remove synced data from Zen Tab Manager.

## Method 1: Through Extension UI (Recommended)

### Disable Sync (Keep Local Settings)

1. Open Zen Browser
2. Navigate to `about:addons`
3. Find "Zen Tab Manager"
4. Click "Options" or "Preferences"
5. Uncheck "Enable settings sync across browsers"
6. Confirm the dialog that appears
7. Click "Save Settings"

**What happens:**
- Settings are copied from sync storage → local storage
- Sync storage is cleared
- Settings remain on this device but won't sync
- Other devices won't receive updates

### Reset Everything

1. Go to extension options (as above)
2. Click "Reset to Defaults"
3. Confirm the action
4. Settings return to defaults and sync storage is cleared

## Method 2: Browser Console (Manual)

### Clear Only Sync Storage

1. Open browser console: `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows/Linux)
2. Go to "Console" tab
3. Run this command:

```javascript
browser.storage.sync.clear().then(() => {
  console.log('Sync storage cleared');
});
```

**Result:** All synced data removed, local data untouched

### Clear All Extension Data

```javascript
// Clear both sync and local storage
Promise.all([
  browser.storage.sync.clear(),
  browser.storage.local.clear()
]).then(() => {
  console.log('All storage cleared');
});
```

**Result:** Complete data wipe, extension resets to defaults

### View Current Synced Data

```javascript
// See what's currently synced
browser.storage.sync.get(null).then(data => {
  console.log('Synced data:', data);
});
```

### Clear Specific Items

```javascript
// Remove only settings, keep other data
browser.storage.sync.remove('settings').then(() => {
  console.log('Settings removed from sync');
});
```

## Method 3: Complete Removal

### Remove Extension Completely

1. Go to `about:addons`
2. Find "Zen Tab Manager"
3. Click the three dots menu
4. Select "Remove"
5. Confirm removal

**What happens:**
- Extension is uninstalled
- All local data is deleted
- Synced data remains in Firefox Sync temporarily
- Synced data will be cleaned up by Firefox Sync eventually

### Force Clear Firefox Sync Data

If you want to ensure synced data is completely gone from all devices:

1. Disconnect Firefox Sync on all devices:
   - Go to `about:preferences#sync`
   - Click "Disconnect"
   - Wait 5 minutes

2. Reconnect Firefox Sync:
   - Sign in again
   - Sync will be clean

**Warning:** This affects ALL synced data (bookmarks, history, etc.), not just the extension.

## Method 4: Per-Device Cleanup

### Clear Data on One Device

If you want to remove data from a specific device without affecting others:

1. Disable sync on that device (Method 1)
2. Clear local storage via console:
   ```javascript
   browser.storage.local.clear()
   ```
3. Uninstall the extension (optional)

Other devices remain unaffected.

### Clear Data on All Devices

1. On Device A (primary):
   - Open extension options
   - Disable sync
   - Reset to defaults
   - Save settings

2. Wait 1-2 minutes for sync to propagate

3. On other devices:
   - Settings will be cleared automatically
   - Or manually disable sync on each

## Method 5: Selective Data Removal

### Keep Some Settings, Clear Others

Via console:

```javascript
// Get current settings
browser.storage.sync.get('settings').then(data => {
  let settings = data.settings;

  // Modify what you want to keep
  settings.workspaceRules = [];  // Clear rules but keep other settings

  // Save back
  return browser.storage.sync.set({ settings });
}).then(() => {
  console.log('Workspace rules cleared');
});
```

### Clear Only Container Rules

```javascript
browser.storage.sync.get('settings').then(data => {
  let settings = data.settings;
  settings.workspaceRules = [];
  return browser.storage.sync.set({ settings });
});
```

### Clear Only Excluded Domains

```javascript
browser.storage.sync.get('settings').then(data => {
  let settings = data.settings;
  settings.excludedDomains = [];
  return browser.storage.sync.set({ settings });
});
```

## Verification

### Check if Data is Cleared

```javascript
// Check sync storage
browser.storage.sync.get(null).then(data => {
  console.log('Sync storage:', Object.keys(data).length === 0 ? 'Empty' : data);
});

// Check local storage
browser.storage.local.get(null).then(data => {
  console.log('Local storage:', data);
});
```

### Monitor Sync Status

```javascript
// Listen for storage changes
browser.storage.onChanged.addListener((changes, areaName) => {
  console.log(`Storage changed in ${areaName}:`, changes);
});
```

## Troubleshooting

### Sync Data Not Clearing

1. Check if sync is actually enabled:
   ```javascript
   browser.storage.local.get('useSyncStorage').then(console.log);
   ```

2. Manually force clear:
   ```javascript
   browser.storage.sync.clear();
   ```

3. Wait 30-60 seconds for Firefox Sync to propagate

### Data Reappearing

- Another device might be re-syncing old data
- Disable sync on all devices first
- Clear sync storage on all devices
- Re-enable sync one at a time

### Cannot Access Console

1. Try the in-extension method (disable sync toggle)
2. Or use Firefox DevTools:
   - Go to `about:debugging#/runtime/this-firefox`
   - Find Zen Tab Manager
   - Click "Inspect"
   - Use console there

## Privacy Notes

- Synced data stays within Firefox Sync (encrypted)
- No data is sent to third parties
- Clearing sync storage removes data from Mozilla's sync servers
- Tab access times are never synced (always local)
- Uninstalling the extension removes all data

## Recovery

If you accidentally clear data:

1. **If sync was enabled:**
   - Data might still be on other devices
   - Install extension on another device
   - Let it sync back

2. **If you cleared everything:**
   - No automatic recovery
   - You'll need to reconfigure settings manually
   - Consider exporting settings first (future feature)

## Best Practices

1. **Before clearing:**
   - Screenshot your settings
   - Or copy workspace rules to a text file

2. **When switching devices:**
   - Let sync propagate (wait 1-2 minutes)
   - Don't clear data immediately

3. **When debugging:**
   - Check both sync and local storage
   - Use `console.log()` to verify before clearing

4. **For privacy:**
   - Disable sync if you don't need cross-device settings
   - Clear data before uninstalling if concerned about privacy

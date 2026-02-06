# Sync Storage Update

This document describes the changes made to enable cross-browser settings synchronization.

## What Changed

The extension now supports automatic settings sync across all browsers signed into Firefox Sync!

### Features Added

1. **Settings Sync Toggle**
   - New checkbox in settings: "Enable settings sync across browsers"
   - Default: ON (enabled)
   - When enabled, settings sync via Firefox Sync
   - When disabled, settings stay local to this device

2. **Automatic Migration**
   - Existing users automatically migrate from local → sync storage
   - Happens once on first update
   - No data loss

3. **Smart Storage Routing**
   - Settings automatically use the correct storage (sync or local)
   - Tab access times always stay local (device-specific)
   - Seamless switching between sync and local modes

## Technical Details

### What Syncs

When sync is enabled, these settings sync across all devices:
- ✅ Auto-archive enabled/disabled
- ✅ Archive time threshold (hours)
- ✅ Pinned tab protection setting
- ✅ Excluded domains list
- ✅ Container/workspace rules
- ✅ Sync preference itself

### What Stays Local

These remain device-specific:
- 📍 Tab access times (when each tab was last viewed)
- 📍 Migration status

### Storage Limits

`browser.storage.sync` has limits:
- **100KB total** across all synced data
- **8KB per item** maximum
- **512 items** maximum

Your settings are tiny (~2-5KB), so no concerns.

## Files Modified

### `background.js`
- Added `getSettingsStorage()` helper - returns sync or local storage
- Added `getSettings()` helper - loads settings from appropriate storage
- Added `saveSettings()` helper - saves settings to appropriate storage
- Added `migrateToSync()` function - one-time migration from local → sync
- Added message handler for toggling sync on/off
- Updated all storage calls to use helpers
- Tab access times remain in local storage

### `options.js`
- Added matching storage helper functions
- Added `toggleSyncStorage()` function with confirmation dialog
- Updated `loadSettings()` to load sync preference
- Updated `saveSettings()` to save sync preference
- Added event listener for sync checkbox

### `options.html`
- Added new "Sync Settings" section
- Added checkbox for enabling/disabling sync
- Added help text explaining the feature

### `manifest.json`
- No changes needed (existing "storage" permission covers both)

## How It Works

### Storage Selection Logic

```javascript
// Sync preference is always stored locally
const localPrefs = await browser.storage.local.get('useSyncStorage');
const useSyncStorage = localPrefs.useSyncStorage !== undefined
  ? localPrefs.useSyncStorage
  : true; // Default to enabled

// Settings go to sync or local based on preference
const storage = useSyncStorage
  ? browser.storage.sync
  : browser.storage.local;
```

### Migration Process

On first update:
1. Check if migration already completed
2. If not, load settings from local storage
3. If sync is enabled (default), copy settings to sync storage
4. Mark migration as complete
5. Future loads use sync storage

### Toggling Sync

When user toggles the checkbox:
1. Show confirmation dialog
2. If enabling: Copy current settings to sync storage
3. If disabling: Copy current settings to local storage
4. Update preference in local storage
5. Refresh settings display

## User Experience

### For New Users
- Sync is enabled by default
- Settings automatically sync across all Zen/Firefox browsers
- No configuration needed

### For Existing Users
- On first update, settings automatically migrate to sync
- Everything continues working seamlessly
- Can disable sync anytime in settings

### Switching Devices
1. Install extension on new device
2. Sign into Firefox Sync
3. Settings automatically appear
4. Tab access times start tracking on new device

## Testing

To test sync functionality:

### Test 1: Enable Sync
1. Open options page
2. Check "Enable settings sync"
3. Save settings
4. Open browser console (Cmd+Option+I)
5. Check for: `[Zen Tab Manager] Settings moved to sync storage`

### Test 2: Verify Sync Storage
```javascript
// In browser console
browser.storage.sync.get('settings').then(console.log)
// Should show your settings
```

### Test 3: Cross-Browser Sync
1. Install on Device A, configure settings
2. Install on Device B (same Firefox account)
3. Wait ~30 seconds for sync
4. Check settings on Device B - should match Device A

### Test 4: Disable Sync
1. Uncheck "Enable settings sync"
2. Confirm dialog
3. Verify settings still work
4. Check that changes stay local

### Test 5: Migration
1. Install old version, configure settings
2. Update to new version
3. Settings should automatically migrate
4. Check console for migration logs

## Troubleshooting

**Settings not syncing:**
- Verify Firefox Sync is enabled and signed in
- Check "Enable settings sync" is checked
- Allow 30-60 seconds for sync to propagate
- Check browser console for errors

**Sync toggle grayed out:**
- This shouldn't happen, but if it does:
- Check browser console for permission errors
- Verify extension has "storage" permission

**Migration failed:**
- Settings stay in local storage (safe fallback)
- Manually re-enter settings if needed
- Report issue with console logs

**Settings lost after toggle:**
- Should not happen - toggling copies settings
- If it does, reset to defaults and reconfigure
- Report issue with console logs

## Future Enhancements

Possible improvements:
- Sync conflict resolution (if settings differ)
- Sync status indicator (last synced time)
- Export/import settings as JSON backup
- Per-device sync exclusions

## Rollback

If sync causes issues, users can:
1. Disable sync in settings (moves to local)
2. Or reinstall old version
3. Settings remain safe in either case

## Notes

- Sync happens automatically via Firefox Sync infrastructure
- No AMO signing required for sync to work
- Works with unsigned extensions
- Sync is per-Firefox-Account, not per-device
- Privacy: Settings stay within Firefox Sync, never sent elsewhere

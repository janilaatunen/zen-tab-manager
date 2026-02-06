// Zen Tab Manager - Background Script

// Open options page when extension icon is clicked
browser.browserAction.onClicked.addListener(() => {
  browser.runtime.openOptionsPage();
});

// Default settings
const DEFAULT_SETTINGS = {
  archiveEnabled: true,
  archiveAfterHours: 48, // 2 days default
  excludePinnedTabs: true,
  excludedDomains: [], // Array of domains to exclude from archiving
  workspaceRules: [], // Array of {pattern: string, workspaceId: string}
  useSyncStorage: true, // Enable cross-browser sync by default
  lastCheck: Date.now()
};

// Storage helper functions
async function getSettingsStorage() {
  // Check local storage first for the useSyncStorage preference
  const localPrefs = await browser.storage.local.get('useSyncStorage');
  const useSyncStorage = localPrefs.useSyncStorage !== undefined ? localPrefs.useSyncStorage : true;

  return useSyncStorage ? browser.storage.sync : browser.storage.local;
}

async function getSettings() {
  const storage = await getSettingsStorage();
  const stored = await storage.get('settings');
  return stored.settings || DEFAULT_SETTINGS;
}

async function saveSettings(settings) {
  const storage = await getSettingsStorage();
  await storage.set({ settings });

  // Also save the sync preference to local storage
  await browser.storage.local.set({ useSyncStorage: settings.useSyncStorage });
}

// Migrate settings from local to sync storage
async function migrateToSync() {
  console.log('[Zen Tab Manager] Checking for migration...');

  // Check if migration has already been done
  const migrationCheck = await browser.storage.local.get('migrationComplete');
  if (migrationCheck.migrationComplete) {
    console.log('[Zen Tab Manager] Migration already complete');
    return;
  }

  // Get settings from local storage
  const localData = await browser.storage.local.get('settings');
  if (!localData.settings) {
    console.log('[Zen Tab Manager] No local settings to migrate');
    await browser.storage.local.set({ migrationComplete: true });
    return;
  }

  // Check if user wants to use sync
  const useSyncStorage = localData.settings.useSyncStorage !== false;

  if (useSyncStorage) {
    try {
      // Copy settings to sync storage
      await browser.storage.sync.set({ settings: localData.settings });
      console.log('[Zen Tab Manager] Settings migrated to sync storage');
    } catch (error) {
      console.log('[Zen Tab Manager] Migration failed, keeping local storage:', error);
      // If sync fails, disable it
      localData.settings.useSyncStorage = false;
      await browser.storage.local.set({ settings: localData.settings });
    }
  }

  // Mark migration as complete
  await browser.storage.local.set({
    migrationComplete: true,
    useSyncStorage: useSyncStorage
  });
}

// Initialize settings on install
browser.runtime.onInstalled.addListener(async (details) => {
  console.log('[Zen Tab Manager] Extension installed/updated:', details.reason);

  // Run migration if updating from old version
  if (details.reason === 'update') {
    await migrateToSync();
  }

  // Initialize settings if they don't exist
  const settings = await getSettings();
  if (!settings || Object.keys(settings).length === 0) {
    await saveSettings(DEFAULT_SETTINGS);
  }

  // Create alarm for periodic tab checks (every minute)
  browser.alarms.create('checkTabs', { periodInMinutes: 1 });

  // Initialize tab access times
  await initializeTabAccessTimes();
});

// Track tab access times
async function initializeTabAccessTimes() {
  const tabs = await browser.tabs.query({});
  const accessTimes = {};

  for (const tab of tabs) {
    accessTimes[tab.id] = Date.now();
  }

  await browser.storage.local.set({ tabAccessTimes: accessTimes });
}

// Update tab access time when activated
browser.tabs.onActivated.addListener(async (activeInfo) => {
  const stored = await browser.storage.local.get('tabAccessTimes');
  const accessTimes = stored.tabAccessTimes || {};

  accessTimes[activeInfo.tabId] = Date.now();
  await browser.storage.local.set({ tabAccessTimes: accessTimes });
});

// Track new tabs
browser.tabs.onCreated.addListener(async (tab) => {
  console.log('[Zen Tab Manager] Tab created:', tab.id, tab.url);

  const stored = await browser.storage.local.get('tabAccessTimes');
  const accessTimes = stored.tabAccessTimes || {};

  accessTimes[tab.id] = Date.now();
  await browser.storage.local.set({ tabAccessTimes: accessTimes });

  // Check if tab should be moved to a different workspace
  await checkAndMoveTabToWorkspace(tab);
});

// Track tab updates (URL changes)
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    console.log('[Zen Tab Manager] Tab URL changed:', tabId, changeInfo.url);

    // Update access time on URL change
    const stored = await browser.storage.local.get('tabAccessTimes');
    const accessTimes = stored.tabAccessTimes || {};
    accessTimes[tabId] = Date.now();
    await browser.storage.local.set({ tabAccessTimes: accessTimes });

    // Check if tab should be moved to a different workspace
    await checkAndMoveTabToWorkspace(tab);
  }
});

// Clean up closed tabs from tracking
browser.tabs.onRemoved.addListener(async (tabId) => {
  const stored = await browser.storage.local.get('tabAccessTimes');
  const accessTimes = stored.tabAccessTimes || {};

  delete accessTimes[tabId];
  await browser.storage.local.set({ tabAccessTimes: accessTimes });
});

// Check if tab should be assigned to a container
async function checkAndMoveTabToWorkspace(tab) {
  console.log('[Zen Tab Manager] Checking container rules for tab:', tab.id, tab.url);

  const settings = await getSettings();

  console.log('[Zen Tab Manager] Current container rules:', settings.workspaceRules);

  if (!tab.url || !settings.workspaceRules || settings.workspaceRules.length === 0) {
    console.log('[Zen Tab Manager] No URL or no rules configured');
    return;
  }

  // Check each container rule
  for (const rule of settings.workspaceRules) {
    console.log('[Zen Tab Manager] Testing rule:', rule.pattern, '→', rule.workspaceId);

    if (matchesPattern(tab.url, rule.pattern)) {
      console.log('[Zen Tab Manager] ✓ Pattern matched! Attempting to assign to container:', rule.workspaceId);

      // Skip if already in the correct container
      if (tab.cookieStoreId === rule.workspaceId) {
        console.log('[Zen Tab Manager] ✓ Tab already in correct container');
        break;
      }

      try {
        // Reopen tab in the correct container
        const newTab = await browser.tabs.create({
          url: tab.url,
          cookieStoreId: rule.workspaceId,
          active: tab.active,
          index: tab.index + 1
        });

        // Close the old tab
        await browser.tabs.remove(tab.id);

        console.log('[Zen Tab Manager] ✓ Tab moved to container successfully');
      } catch (error) {
        console.log('[Zen Tab Manager] ✗ Container assignment failed:', error);
      }
      break;
    } else {
      console.log('[Zen Tab Manager] ✗ Pattern did not match');
    }
  }
}

// Match URL against pattern (supports wildcards and domain matching)
function matchesPattern(url, pattern) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // Exact domain match
    if (pattern === domain) {
      return true;
    }

    // Wildcard subdomain match (*.example.com)
    if (pattern.startsWith('*.')) {
      const baseDomain = pattern.slice(2);
      if (domain === baseDomain || domain.endsWith('.' + baseDomain)) {
        return true;
      }
    }

    // Full URL pattern with wildcards
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    const regex = new RegExp('^' + regexPattern + '$');

    return regex.test(url) || regex.test(domain);
  } catch (error) {
    return false;
  }
}

// Check if domain should be excluded from archiving
function isExcludedDomain(url, excludedDomains) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    return excludedDomains.some(excluded => matchesPattern(url, excluded));
  } catch (error) {
    return false;
  }
}

// Archive old tabs
async function archiveOldTabs() {
  console.log('[Zen Tab Manager] Running archiveOldTabs check...');

  const settings = await getSettings();
  const localData = await browser.storage.local.get('tabAccessTimes');
  const accessTimes = localData.tabAccessTimes || {};

  console.log('[Zen Tab Manager] Settings:', {
    archiveEnabled: settings.archiveEnabled,
    archiveAfterHours: settings.archiveAfterHours,
    excludePinnedTabs: settings.excludePinnedTabs,
    excludedDomains: settings.excludedDomains
  });

  if (!settings.archiveEnabled) {
    console.log('[Zen Tab Manager] Archive is disabled, skipping');
    return;
  }

  const now = Date.now();
  const archiveThreshold = settings.archiveAfterHours * 60 * 60 * 1000; // Convert hours to milliseconds

  console.log('[Zen Tab Manager] Archive threshold:', archiveThreshold, 'ms (', settings.archiveAfterHours, 'hours)');

  // Zen Browser uses containers for workspaces, so we need to query across all containers
  // First, try to get all containers
  let allContainers = [];
  try {
    allContainers = await browser.contextualIdentities.query({});
    console.log('[Zen Tab Manager] Found', allContainers.length, 'containers:', allContainers.map(c => ({ id: c.cookieStoreId, name: c.name })));
  } catch (error) {
    console.log('[Zen Tab Manager] Could not query containers:', error);
  }

  // Query tabs - try to get ALL tabs regardless of container
  // We need to query all windows since Zen might split containers across windows
  const allWindows = await browser.windows.getAll({ populate: false });
  console.log('[Zen Tab Manager] Found', allWindows.length, 'windows');

  let tabs = [];
  for (const window of allWindows) {
    const windowTabs = await browser.tabs.query({ windowId: window.id });
    console.log('[Zen Tab Manager] Window', window.id, 'has', windowTabs.length, 'tabs');
    tabs.push(...windowTabs);
  }

  console.log('[Zen Tab Manager] Total tabs found:', tabs.length);

  // Log unique containers in the tabs
  const containersInUse = new Set(tabs.map(t => t.cookieStoreId || 'default'));
  console.log('[Zen Tab Manager] Tabs are in', containersInUse.size, 'containers:', Array.from(containersInUse));

  const tabsToClose = [];

  for (const tab of tabs) {
    // Skip pinned tabs if setting is enabled
    if (settings.excludePinnedTabs && tab.pinned) {
      console.log('[Zen Tab Manager] Skipping pinned tab:', tab.id, tab.url);
      continue;
    }

    // Skip tabs with excluded domains
    if (tab.url && isExcludedDomain(tab.url, settings.excludedDomains || [])) {
      console.log('[Zen Tab Manager] Skipping excluded domain:', tab.id, tab.url);
      continue;
    }

    // Check if tab is old enough to archive
    const lastAccess = accessTimes[tab.id] || now;
    const timeSinceAccess = now - lastAccess;

    console.log('[Zen Tab Manager] Tab', tab.id, ':', {
      url: tab.url,
      lastAccess: new Date(lastAccess).toISOString(),
      timeSinceAccess: timeSinceAccess,
      shouldClose: timeSinceAccess > archiveThreshold
    });

    if (timeSinceAccess > archiveThreshold) {
      tabsToClose.push(tab.id);
    }
  }

  // Close old tabs
  if (tabsToClose.length > 0) {
    console.log(`[Zen Tab Manager] Closing ${tabsToClose.length} old tabs:`, tabsToClose);
    await browser.tabs.remove(tabsToClose);
  } else {
    console.log('[Zen Tab Manager] No tabs to close');
  }
}

// Listen for alarm to check tabs
browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkTabs') {
    await archiveOldTabs();
  }
});

// Run check on browser startup
browser.runtime.onStartup.addListener(async () => {
  await archiveOldTabs();
});

// Message handler for manual actions from options page
browser.runtime.onMessage.addListener(async (message) => {
  if (message.action === 'archiveNow') {
    await archiveOldTabs();
    return { success: true };
  }

  if (message.action === 'toggleSyncStorage') {
    const currentSettings = await getSettings();
    const newUseSyncValue = message.enabled;

    console.log('[Zen Tab Manager] Toggling sync storage:', newUseSyncValue);

    if (newUseSyncValue) {
      // Moving from local to sync
      try {
        currentSettings.useSyncStorage = true;
        await browser.storage.sync.set({ settings: currentSettings });
        await browser.storage.local.set({ useSyncStorage: true });
        console.log('[Zen Tab Manager] Settings moved to sync storage');
        return { success: true };
      } catch (error) {
        console.error('[Zen Tab Manager] Failed to enable sync:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Moving from sync to local
      try {
        currentSettings.useSyncStorage = false;
        await browser.storage.local.set({ settings: currentSettings, useSyncStorage: false });
        // Clear sync storage
        await browser.storage.sync.remove('settings');
        console.log('[Zen Tab Manager] Settings moved to local storage');
        return { success: true };
      } catch (error) {
        console.error('[Zen Tab Manager] Failed to disable sync:', error);
        return { success: false, error: error.message };
      }
    }
  }

  if (message.action === 'getWorkspaces') {
    console.log('Getting workspaces...');

    // Try getting Zen workspaces via different APIs
    const workspaceAPIs = [
      // Try standard workspaces API
      { name: 'browser.workspaces.getAll', fn: () => browser.workspaces?.getAll?.() },
      { name: 'browser.workspaces.query', fn: () => browser.workspaces?.query?.({}) },
      // Try Zen-specific API
      { name: 'browser.zen?.workspaces?.getAll', fn: () => browser.zen?.workspaces?.getAll?.() },
      // Try contextualIdentities (Firefox containers) - Zen workspaces might use this
      { name: 'browser.contextualIdentities.query', fn: () => browser.contextualIdentities?.query?.({}) },
    ];

    for (const api of workspaceAPIs) {
      try {
        console.log(`Trying ${api.name}...`);
        const result = await api.fn();
        if (result && result.length > 0) {
          console.log(`Success with ${api.name}:`, result);
          // Normalize the result to have consistent structure
          const workspaces = result.map(item => ({
            id: item.id || item.cookieStoreId || item.uuid,
            name: item.name || item.title || item.id
          }));
          return { workspaces };
        }
      } catch (error) {
        console.log(`${api.name} failed:`, error.message);
      }
    }

    // If all attempts fail, return empty with explanation
    console.log('All workspace API attempts failed');
    console.log('Zen workspaces are not exposed to extensions - manual entry required');

    return {
      workspaces: [],
      error: 'Zen workspace API not available to extensions',
      suggestion: 'Use manual text entry for workspace IDs'
    };
  }

  return {};
});

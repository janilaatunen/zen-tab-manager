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
  try {
    console.log('[Zen Tab Manager] Installed/updated:', details.reason);

    if (details.reason === 'update') {
      await migrateToSync();
    }

    const settings = await getSettings();
    if (!settings || Object.keys(settings).length === 0) {
      await saveSettings(DEFAULT_SETTINGS);
    }

    // Backup check once an hour (primary archiving happens on workspace switch)
    browser.alarms.create('checkTabs', { periodInMinutes: 60 });

    await initializeTabAccessTimes();
    await archiveOldTabs();

    console.log('[Zen Tab Manager] Initialization complete');
  } catch (error) {
    console.error('[Zen Tab Manager] Initialization error:', error);
  }
});

// Track tab access times - preserve existing times, only add new tabs
async function initializeTabAccessTimes() {
  try {
    const tabs = await browser.tabs.query({});
    const stored = await browser.storage.local.get('tabAccessTimes');
    const accessTimes = stored.tabAccessTimes || {};

    // Add new tabs
    for (const tab of tabs) {
      if (!accessTimes[tab.id]) {
        accessTimes[tab.id] = Date.now();
      }
    }

    // Clean up old tab references
    const currentTabIds = new Set(tabs.map(t => t.id));
    for (const tabId in accessTimes) {
      if (!currentTabIds.has(parseInt(tabId))) {
        delete accessTimes[tabId];
      }
    }

    await browser.storage.local.set({ tabAccessTimes: accessTimes });
    console.log('[Zen Tab Manager] Initialized access times for', Object.keys(accessTimes).length, 'tabs');
  } catch (error) {
    console.error('[Zen Tab Manager] Error initializing access times:', error);
  }
}

// Track the currently active workspace to detect switches
let currentWorkspace = null;

// Detect workspace switches AND update tab access time
browser.tabs.onActivated.addListener(async (activeInfo) => {
  // Get tab info first to detect workspace switch
  const tab = await browser.tabs.get(activeInfo.tabId);
  const newWorkspace = tab.cookieStoreId || 'firefox-default';

  // Check for workspace switch BEFORE updating access times
  if (currentWorkspace && currentWorkspace !== newWorkspace) {
    console.log('[Zen Tab Manager] Workspace switch detected:', currentWorkspace, '→', newWorkspace);
    console.log('[Zen Tab Manager] Running immediate archive check...');

    // Run archive check BEFORE updating access time
    // This ensures the tab that triggered the switch can still be archived if old
    await archiveOldTabs();
  }

  currentWorkspace = newWorkspace;

  // Update access time AFTER archive check
  const stored = await browser.storage.local.get('tabAccessTimes');
  const accessTimes = stored.tabAccessTimes || {};
  accessTimes[activeInfo.tabId] = Date.now();
  await browser.storage.local.set({ tabAccessTimes: accessTimes });
});

// Track new tabs
browser.tabs.onCreated.addListener(async (tab) => {
  const stored = await browser.storage.local.get('tabAccessTimes');
  const accessTimes = stored.tabAccessTimes || {};
  accessTimes[tab.id] = Date.now();
  await browser.storage.local.set({ tabAccessTimes: accessTimes });

  await checkAndMoveTabToWorkspace(tab);
});

// Track tab updates (URL changes) - only for workspace assignment
// Note: We do NOT update access time here - only user clicks count as activity
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
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
  const settings = await getSettings();

  if (!tab.url || !settings.workspaceRules || settings.workspaceRules.length === 0) {
    return;
  }

  // Check each container rule
  for (const rule of settings.workspaceRules) {
    if (matchesPattern(tab.url, rule.pattern)) {
      if (tab.cookieStoreId === rule.workspaceId) {
        break;
      }

      try {
        await browser.tabs.create({
          url: tab.url,
          cookieStoreId: rule.workspaceId,
          active: tab.active,
          index: tab.index + 1
        });
        await browser.tabs.remove(tab.id);
        console.log('[Zen Tab Manager] Moved tab to container:', rule.pattern, '→', rule.workspaceId);
      } catch (error) {
        console.error('[Zen Tab Manager] Failed to move tab to container:', error);
      }
      break;
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

// Archive old tabs (in the currently active workspace only, due to Zen's API limitations)
async function archiveOldTabs() {
  const settings = await getSettings();
  const localData = await browser.storage.local.get('tabAccessTimes');
  const accessTimes = localData.tabAccessTimes || {};

  if (!settings.archiveEnabled) {
    return;
  }

  const now = Date.now();
  const archiveThreshold = settings.archiveAfterHours * 60 * 60 * 1000;

  // Query tabs (Zen only exposes tabs from active workspace)
  const tabsById = new Map();

  try {
    const allWindows = await browser.windows.getAll({ populate: false });
    for (const window of allWindows) {
      const windowTabs = await browser.tabs.query({ windowId: window.id });
      windowTabs.forEach(tab => tabsById.set(tab.id, tab));
    }

    const allContainers = await browser.contextualIdentities.query({});
    for (const container of allContainers) {
      const containerTabs = await browser.tabs.query({ cookieStoreId: container.cookieStoreId });
      containerTabs.forEach(tab => tabsById.set(tab.id, tab));
    }

    const defaultTabs = await browser.tabs.query({ cookieStoreId: 'firefox-default' });
    defaultTabs.forEach(tab => tabsById.set(tab.id, tab));
  } catch (error) {
    console.error('[Zen Tab Manager] Error querying tabs:', error);
  }

  const tabs = Array.from(tabsById.values());
  const tabsToClose = [];

  for (const tab of tabs) {
    if (settings.excludePinnedTabs && tab.pinned) {
      continue;
    }

    if (tab.url && isExcludedDomain(tab.url, settings.excludedDomains || [])) {
      continue;
    }

    const lastAccess = accessTimes[tab.id] || now;
    const timeSinceAccess = now - lastAccess;

    if (timeSinceAccess > archiveThreshold) {
      tabsToClose.push(tab.id);
    }
  }

  if (tabsToClose.length > 0) {
    console.log(`[Zen Tab Manager] Closing ${tabsToClose.length} old tabs`);
    await browser.tabs.remove(tabsToClose);
  }
}

// Listen for alarm to check tabs
browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkTabs') {
    await archiveOldTabs();
  }
});

// Run check on browser startup and initialize current workspace
browser.runtime.onStartup.addListener(async () => {
  const activeTabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (activeTabs.length > 0) {
    currentWorkspace = activeTabs[0].cookieStoreId || 'firefox-default';
  }
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

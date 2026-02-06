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
  lastCheck: Date.now()
};

// Initialize settings on install
browser.runtime.onInstalled.addListener(async () => {
  const stored = await browser.storage.local.get('settings');
  if (!stored.settings) {
    await browser.storage.local.set({ settings: DEFAULT_SETTINGS });
  }

  // Create alarm for periodic tab checks (every hour)
  browser.alarms.create('checkTabs', { periodInMinutes: 60 });

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

  const stored = await browser.storage.local.get('settings');
  const settings = stored.settings || DEFAULT_SETTINGS;

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
  const stored = await browser.storage.local.get(['settings', 'tabAccessTimes']);
  const settings = stored.settings || DEFAULT_SETTINGS;
  const accessTimes = stored.tabAccessTimes || {};

  if (!settings.archiveEnabled) {
    return;
  }

  const now = Date.now();
  const archiveThreshold = settings.archiveAfterHours * 60 * 60 * 1000; // Convert hours to milliseconds

  const tabs = await browser.tabs.query({});
  const tabsToClose = [];

  for (const tab of tabs) {
    // Skip pinned tabs if setting is enabled
    if (settings.excludePinnedTabs && tab.pinned) {
      continue;
    }

    // Skip tabs with excluded domains
    if (tab.url && isExcludedDomain(tab.url, settings.excludedDomains || [])) {
      continue;
    }

    // Check if tab is old enough to archive
    const lastAccess = accessTimes[tab.id] || now;
    const timeSinceAccess = now - lastAccess;

    if (timeSinceAccess > archiveThreshold) {
      tabsToClose.push(tab.id);
    }
  }

  // Close old tabs
  if (tabsToClose.length > 0) {
    console.log(`Closing ${tabsToClose.length} old tabs`);
    await browser.tabs.remove(tabsToClose);
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

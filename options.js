// Zen Tab Manager - Options Page Script

const DEFAULT_SETTINGS = {
  archiveEnabled: true,
  archiveAfterHours: 48,
  excludePinnedTabs: true,
  excludedDomains: [],
  workspaceRules: [],
  useSyncStorage: true
};

// Storage helper functions
async function getSettingsStorage() {
  const localPrefs = await browser.storage.local.get('useSyncStorage');
  const useSyncStorage = localPrefs.useSyncStorage !== undefined ? localPrefs.useSyncStorage : true;
  return useSyncStorage ? browser.storage.sync : browser.storage.local;
}

async function getSettings() {
  const storage = await getSettingsStorage();
  const stored = await storage.get('settings');
  return stored.settings || DEFAULT_SETTINGS;
}

async function saveSettingsToStorage(settings) {
  const storage = await getSettingsStorage();
  await storage.set({ settings });
  await browser.storage.local.set({ useSyncStorage: settings.useSyncStorage });
}

// Load settings
async function loadSettings() {
  const settings = await getSettings();

  document.getElementById('archiveEnabled').checked = settings.archiveEnabled;
  document.getElementById('archiveAfterHours').value = settings.archiveAfterHours;
  document.getElementById('excludePinnedTabs').checked = settings.excludePinnedTabs;
  document.getElementById('useSyncStorage').checked = settings.useSyncStorage !== false;

  renderExcludedDomains(settings.excludedDomains || []);
  renderWorkspaceRules(settings.workspaceRules || []);
}

// Load containers and populate dropdown
async function loadContainers() {
  const select = document.getElementById('newRuleWorkspace');
  if (!select) {
    console.log('Container select element not found');
    return;
  }

  try {
    const containers = await browser.contextualIdentities.query({});
    console.log('Loaded containers:', containers);

    // Clear and populate dropdown
    select.innerHTML = '<option value="">Select container...</option>';

    if (containers.length === 0) {
      select.innerHTML = '<option value="">No containers found</option>';
      return;
    }

    containers.forEach(container => {
      const option = document.createElement('option');
      option.value = container.cookieStoreId;
      option.textContent = container.name;
      select.appendChild(option);
    });

    console.log(`Populated dropdown with ${containers.length} containers`);
  } catch (error) {
    console.error('Could not load containers:', error);
    select.innerHTML = '<option value="">Error loading containers</option>';
  }
}

// Save settings
async function saveSettings() {
  const settings = {
    archiveEnabled: document.getElementById('archiveEnabled').checked,
    archiveAfterHours: parseInt(document.getElementById('archiveAfterHours').value),
    excludePinnedTabs: document.getElementById('excludePinnedTabs').checked,
    excludedDomains: getCurrentExcludedDomains(),
    workspaceRules: getCurrentWorkspaceRules(),
    useSyncStorage: document.getElementById('useSyncStorage').checked
  };

  await saveSettingsToStorage(settings);
  showStatus('Settings saved successfully!', 'success');
}

// Reset settings to defaults
async function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    await saveSettingsToStorage(DEFAULT_SETTINGS);
    await loadSettings();
    showStatus('Settings reset to defaults', 'success');
  }
}

// Toggle sync storage
async function toggleSyncStorage() {
  const checkbox = document.getElementById('useSyncStorage');
  const enabled = checkbox.checked;

  // Show confirmation dialog
  const action = enabled ? 'enable' : 'disable';
  const message = enabled
    ? 'Enable settings sync? Your settings will sync across all browsers signed into Firefox Sync.'
    : 'Disable settings sync? Your settings will only be stored on this device.';

  if (!confirm(message)) {
    checkbox.checked = !enabled;
    return;
  }

  try {
    const response = await browser.runtime.sendMessage({
      action: 'toggleSyncStorage',
      enabled: enabled
    });

    if (response.success) {
      showStatus(`Settings sync ${enabled ? 'enabled' : 'disabled'}!`, 'success');
    } else {
      throw new Error(response.error || 'Unknown error');
    }
  } catch (error) {
    checkbox.checked = !enabled;
    showStatus(`Failed to ${action} sync: ${error.message}`, 'error');
  }
}

// Show status message
function showStatus(message, type = 'success') {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;

  setTimeout(() => {
    statusEl.className = 'status hidden';
  }, 3000);
}

// Render excluded domains list
function renderExcludedDomains(domains) {
  const container = document.getElementById('excludedDomainsList');
  container.innerHTML = '';

  if (domains.length === 0) {
    container.innerHTML = '<p class="help-text">No excluded domains yet.</p>';
    return;
  }

  domains.forEach((domain, index) => {
    const item = document.createElement('div');
    item.className = 'domain-item';
    item.innerHTML = `
      <code>${escapeHtml(domain)}</code>
      <button data-index="${index}">Remove</button>
    `;

    item.querySelector('button').addEventListener('click', () => {
      removeExcludedDomain(index);
    });

    container.appendChild(item);
  });
}

// Get current excluded domains from UI
function getCurrentExcludedDomains() {
  const domains = [];
  document.querySelectorAll('#excludedDomainsList .domain-item code').forEach(el => {
    domains.push(el.textContent);
  });
  return domains;
}

// Add excluded domain
function addExcludedDomain() {
  const input = document.getElementById('newExcludedDomain');
  const domain = input.value.trim();

  if (!domain) {
    showStatus('Please enter a domain', 'error');
    return;
  }

  const domains = getCurrentExcludedDomains();
  if (domains.includes(domain)) {
    showStatus('Domain already exists', 'error');
    return;
  }

  domains.push(domain);
  renderExcludedDomains(domains);
  input.value = '';
  showStatus('Domain added (remember to save)', 'success');
}

// Remove excluded domain
function removeExcludedDomain(index) {
  const domains = getCurrentExcludedDomains();
  domains.splice(index, 1);
  renderExcludedDomains(domains);
  showStatus('Domain removed (remember to save)', 'success');
}

// Render workspace rules list
function renderWorkspaceRules(rules) {
  const container = document.getElementById('workspaceRulesList');
  container.innerHTML = '';

  if (rules.length === 0) {
    container.innerHTML = '<p class="help-text">No workspace rules yet.</p>';
    return;
  }

  rules.forEach((rule, index) => {
    const item = document.createElement('div');
    item.className = 'rule-item';
    item.innerHTML = `
      <div class="rule-content">
        <div class="rule-pattern">
          <span class="rule-label">Pattern</span>
          <code>${escapeHtml(rule.pattern)}</code>
        </div>
        <div class="rule-workspace">
          <span class="rule-label">Container</span>
          <code>${escapeHtml(rule.workspaceId)}</code>
        </div>
      </div>
      <button data-index="${index}">Remove</button>
    `;

    item.querySelector('button').addEventListener('click', () => {
      removeWorkspaceRule(index);
    });

    container.appendChild(item);
  });
}

// Get current workspace rules from UI
function getCurrentWorkspaceRules() {
  const rules = [];
  document.querySelectorAll('#workspaceRulesList .rule-item').forEach(el => {
    const pattern = el.querySelector('.rule-pattern code').textContent;
    const workspaceId = el.querySelector('.rule-workspace code').textContent;
    rules.push({ pattern, workspaceId });
  });
  return rules;
}

// Add workspace rule
function addWorkspaceRule() {
  const patternInput = document.getElementById('newRulePattern');
  const workspaceInput = document.getElementById('newRuleWorkspace');

  const pattern = patternInput.value.trim();
  const workspaceId = workspaceInput.value.trim();

  if (!pattern || !workspaceId) {
    showStatus('Please select both pattern and container', 'error');
    return;
  }

  const rules = getCurrentWorkspaceRules();
  rules.push({ pattern, workspaceId });
  renderWorkspaceRules(rules);

  patternInput.value = '';
  workspaceInput.value = '';
  showStatus('Rule added (remember to save)', 'success');
}

// Remove workspace rule
function removeWorkspaceRule(index) {
  const rules = getCurrentWorkspaceRules();
  rules.splice(index, 1);
  renderWorkspaceRules(rules);
  showStatus('Rule removed (remember to save)', 'success');
}

// Archive tabs now
async function archiveNow() {
  const button = document.getElementById('archiveNow');
  button.disabled = true;
  button.textContent = 'Archiving...';

  try {
    await browser.runtime.sendMessage({ action: 'archiveNow' });
    showStatus('Old tabs archived successfully!', 'success');
  } catch (error) {
    showStatus('Error archiving tabs: ' + error.message, 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Archive Old Tabs Now';
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadContainers();
});
document.getElementById('saveSettings').addEventListener('click', saveSettings);
document.getElementById('resetSettings').addEventListener('click', resetSettings);
document.getElementById('addExcludedDomain').addEventListener('click', addExcludedDomain);
document.getElementById('addWorkspaceRule').addEventListener('click', addWorkspaceRule);
document.getElementById('archiveNow').addEventListener('click', archiveNow);
document.getElementById('useSyncStorage').addEventListener('change', toggleSyncStorage);

// Allow Enter key to add items
document.getElementById('newExcludedDomain').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addExcludedDomain();
});

document.getElementById('newRulePattern').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('newRuleWorkspace').focus();
  }
});

document.getElementById('newRuleWorkspace').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addWorkspaceRule();
});

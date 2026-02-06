# Zen Tab Manager

> **⚠️ Disclaimer:** This extension was vibe coded. Use at your own risk.

Automatically manage tabs in Zen Browser through workspace-triggered archiving and container-based organization.

## Features

- **Auto-Archive**: Automatically closes tabs that haven't been clicked in a configurable time (default: 48 hours)
- **Workspace-Triggered**: Archives tabs immediately when you switch workspaces
- **Smart Protection**: Protects pinned tabs and excluded domains
- **Container Organization**: Automatically assigns tabs to containers based on URL patterns
- **Cross-Device Sync**: Settings sync via Firefox Sync (tab access times stay local)

## Installation

**Prerequisites:**
1. Open Zen Browser
2. Go to `about:config`
3. Set `xpinstall.signatures.required` to `false` (one-time setup)

**Install:**
1. Download `zen-tab-manager.xpi` from [releases](https://github.com/janilaatunen/zen-tab-manager/releases)
2. Go to `about:addons` → Gear icon → Install Add-on From File
3. Select the downloaded XPI file
4. Click "Add" when prompted

**Verify:** Extension icon should appear in toolbar and in `about:addons`

## How It Works

**Archiving Logic:**
- Tracks when you last clicked each tab (not when it was last active in background)
- When you switch workspaces, immediately checks for old tabs and closes them
- Backup check runs once an hour if you stay in one workspace
- Only sees tabs in the currently active workspace (Zen Browser limitation)

**Activity Tracking:**
- ✅ Clicking a tab = active
- ❌ URL changes, background activity = still inactive

This means YouTube, Amazon, and other sites with background activity will get archived if you don't actually click on them.

## Configuration

Click the extension icon or go to `about:addons` → Zen Tab Manager → Options

**Settings:**
- Archive after: Time in hours (supports decimals: 0.5 = 30 min)
- Exclude pinned tabs: Protect pinned tabs from archiving
- Excluded domains: Domains that never get archived (supports wildcards)
- Container rules: Auto-assign tabs to containers by URL pattern

## Usage Examples

**Quick cleanup for testing:**
```
Archive after: 0.01 hours (~36 seconds)
Exclude pinned tabs: ON
```

**Aggressive daily cleanup:**
```
Archive after: 12 hours
Excluded domains: gmail.com, calendar.google.com
```

**Container organization:**
```
Pattern: *.github.com → Container: Work
Pattern: localhost:* → Container: Dev
```

Then map containers to workspaces in Zen's settings.

## Known Limitations

- **Zen Workspace Isolation**: Extension can only see tabs in the currently active workspace. This is why archiving happens when you switch workspaces - it cleans up each workspace as you enter it.
- **No Undo**: Tabs are closed, not bookmarked. Pin important tabs or add domains to exclusions.
- **Container Setup Required**: You must manually map containers to workspaces in Zen's settings for workspace organization to work.

## Troubleshooting

**Tabs not closing:**
- Archiving happens when you switch workspaces, not on a timer
- Check that the tab isn't pinned or in excluded domains
- Try switching away from the workspace and back

**YouTube/Amazon not closing:**
- Make sure you haven't clicked the tab recently
- The extension now ignores background activity (URL changes, etc.)

## Contributing

This is a personal project that was vibe coded. Feel free to fork and improve it, but don't expect production-grade code quality. Pull requests are welcome.

## License

MIT License

## Author

Jani Laatunen (jani@laatunen.fi)

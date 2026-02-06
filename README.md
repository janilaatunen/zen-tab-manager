# Zen Tab Manager

A productivity browser extension for Zen Browser that automatically manages tabs through archiving and container-based organization.

## Features

### 1. Auto-Archive Old Tabs
- Automatically closes tabs that haven't been accessed in a configurable time period (default: 48 hours)
- Customizable archive time (set in hours)
- Protects pinned tabs from being archived
- Exclude specific domains from auto-archiving
- Manual "Archive Now" button for immediate cleanup

### 2. Container-Based Organization
- Automatically assigns tabs to containers based on URL patterns
- Zen's built-in container → workspace mapping then moves them to the correct workspace
- Works seamlessly with Zen's auto-switching feature
- Supports flexible URL pattern matching:
  - Exact domain: `github.com`
  - Wildcard subdomains: `*.github.com`
  - Complex patterns: `*.google.*`

### 3. Smart Exclusions
- Excluded domains are never archived AND always assigned to correct container
- Perfect for important sites you want organized but never closed

## Installation

### Development Mode

1. Clone or download this repository
2. Open Zen Browser
3. Navigate to `about:debugging#/runtime/this-firefox`
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file from this directory

### Permanent Installation

1. Build the extension:
   ```bash
   # Create a ZIP file of all source files
   zip -r zen-tab-manager.xpi manifest.json background.js options.html options.js options.css icon.png
   ```

2. Install in Zen Browser:
   - Go to `about:addons`
   - Click the gear icon → "Install Add-on From File"
   - Select the `.xpi` file

## Configuration

Access settings through the Zen Browser add-ons manager:
1. Go to `about:addons`
2. Find "Zen Tab Manager"
3. Click "Options"

### Settings Options

**Auto-Archive Settings:**
- Enable/disable automatic archiving
- Set custom archive time (in hours)
- Toggle pinned tab protection

**Excluded Domains:**
- Add domains that should never be archived
- Use wildcards for flexible matching

**Container Rules:**
- Define URL patterns → Container mappings
- Select containers from dropdown (populated from your Firefox containers)
- Tabs matching patterns will auto-assign to containers
- Zen will then move them to their assigned workspace (via Zen's built-in auto-switching)

## Usage Examples

### Example 1: Keep Work and Personal Tabs Separate
```
Container Rules:
- Pattern: *.github.com → Container: Work
- Pattern: *.gmail.com → Container: Personal
- Pattern: *.reddit.com → Container: Personal

Then in Zen's settings, map:
- Work container → Work workspace
- Personal container → Personal workspace
```

### Example 2: Aggressive Tab Cleanup
```
Auto-Archive Settings:
- Archive after: 12 hours
- Exclude pinned tabs: ON

Excluded Domains:
- gmail.com (keep email tabs)
- calendar.google.com (keep calendar)
- localhost:* (keep development servers)
```

### Example 3: Development Setup
```
Excluded Domains:
- localhost:*
- *.dev
- github.com

Container Rules:
- localhost:* → Container: Development
- *.github.com → Container: Code Review
```

## How It Works

### Tab Tracking
- The extension tracks the last access time for each tab
- Access time updates when you switch to a tab or create a new tab
- Checks run every hour via browser alarms
- Also checks on browser startup

### Container Assignment
- Monitors tab creation and URL changes
- Immediately assigns tabs to containers matching rules
- Zen's built-in auto-switching then moves containers to workspaces
- Respects excluded domains (never archived, always in correct container)

### Pattern Matching
Supports flexible URL patterns:
- `example.com` - Matches exact domain
- `*.example.com` - Matches domain and all subdomains
- `*.google.*` - Matches all Google TLDs
- Wildcards (`*`) match any characters

## Notes

- **Container → Workspace Mapping**: This extension assigns tabs to containers. You must configure Zen's built-in container → workspace mapping in Zen's settings for tabs to end up in the correct workspace.
- **No Data Loss**: Tabs are simply closed, not bookmarked. Consider bookmarking important tabs before closing.
- **Performance**: Minimal performance impact - only checks once per hour and on tab events.
- **Container Setup**: Make sure to create containers in Firefox/Zen and map them to workspaces in Zen's settings.

## Troubleshooting

**Tabs not closing automatically:**
- Check that auto-archive is enabled in settings
- Verify the archive time threshold
- Ensure tabs aren't pinned (if that setting is enabled)
- Check if domains are in the excluded list

**Tabs not moving to workspaces:**
- Verify container rules are configured correctly
- Check that containers exist in Firefox/Zen
- Ensure Zen's container → workspace mapping is configured in Zen settings
- Enable Zen's auto-switching feature for containers

**Settings not saving:**
- Check browser console for errors (Cmd+Option+I)
- Try reinstalling the extension

## Development

### File Structure
```
zen-tab-manager/
├── manifest.json       # Extension manifest
├── background.js       # Background script (tab management logic)
├── options.html        # Settings page HTML
├── options.js          # Settings page logic
├── options.css         # Settings page styling
└── README.md          # This file
```

### Building
No build process required - this is a pure WebExtension. All files are source files.

### Testing
1. Load as temporary add-on in Zen Browser
2. Open multiple tabs
3. Check settings page for configuration
4. Use browser console to see logs: `Closing X old tabs`

## License

MIT License - Feel free to modify and distribute

## Author

Jani Laatunen (jani@laatunen.fi)

## Version History

- **1.0.0** - Initial release
  - Auto-archive old tabs
  - Workspace organization
  - Configurable exclusions

# TODO & Next Steps

## Current Limitations

### Workspace API Not Available
Zen Browser does not currently expose a workspace/space API to extensions. This extension works around this by:
1. Assigning tabs to Firefox containers based on URL patterns
2. Relying on Zen's built-in container → workspace auto-switching feature

**Limitation:** This requires manual configuration in Zen's settings to map containers to workspaces.

## Potential Improvements

### High Priority
- [ ] **File feature request with Zen Browser** - Request a proper workspace API for extensions
  - Issue URL: https://github.com/zen-browser/desktop/issues
  - Requested features:
    - `browser.zenWorkspaces.query()` - List available workspaces
    - `browser.zenWorkspaces.move(tabId, workspaceId)` - Move tab to workspace
    - `browser.tabs` extension to include `workspaceId` property
  - Benefits:
    - Direct workspace assignment without container workaround
    - Better user experience
    - Simpler configuration

### Medium Priority
- [ ] Add option to bookmark tabs before archiving
- [ ] Add statistics/dashboard showing archived tab counts
- [ ] Export/import settings functionality
- [ ] Add whitelist mode (only archive specific domains instead of excluding)
- [ ] Support for regex patterns in addition to wildcards

### Low Priority
- [ ] Dark mode for options page (respect browser theme)
- [ ] Keyboard shortcuts for manual archive action
- [ ] Notification when tabs are archived
- [ ] Option to move archived tabs to a "Archive" container instead of closing

## Feature Request Template

When filing the Zen Browser feature request, use this template:

```markdown
**Feature Request: Extension API for Workspace Management**

**Problem:**
Extensions cannot programmatically interact with Zen's workspace feature. This limits automation and productivity tools.

**Proposed Solution:**
Add a `browser.zenWorkspaces` API (or extend existing Firefox APIs) to allow extensions to:

1. Query available workspaces: `browser.zenWorkspaces.query({})`
2. Move tabs to workspaces: `browser.zenWorkspaces.move(tabId, workspaceId)`
3. Get/set tab's workspace: Extend `browser.tabs` objects with `workspaceId` property

**Use Cases:**
- Auto-organize tabs by URL pattern
- Productivity extensions (tab management, focus modes)
- Session management tools
- Workflow automation

**Current Workaround:**
Extensions can assign tabs to containers, then rely on Zen's container → workspace auto-switching. This requires extra manual configuration and is less intuitive.

**Examples:**
- Arc Browser: Exposes workspace APIs to extensions
- Vivaldi: Tab stacking/grouping APIs

**Related:**
- #500 (profiles per workspace)
- #2337 (workspace features)
- #7079 (workspace behavior)
```

## Known Issues

- None currently

## Ideas for Future Mods

- **Zen Focus Mode** - Automatically archive distracting tabs during focus sessions
- **Zen Session Manager** - Save and restore workspace sessions
- **Zen Tab Limiter** - Set max tabs per workspace, auto-archive oldest

## Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Submit a pull request

## Questions or Feedback?

Open an issue on GitHub or contact: jani@laatunen.fi

# Manual Release Guide

Since GitHub Actions requires the `workflow` token scope, here's how to create releases manually.

## Creating a Release on GitHub

### Step 1: Build the XPI

```bash
cd /Users/jani.laatunen/Projects/zen-tab-manager

# Build the XPI
zip -r zen-tab-manager.xpi \
  manifest.json \
  background.js \
  options.html \
  options.js \
  options.css \
  icon.png \
  icon.svg \
  LICENSE \
  README.md \
  -x "*.DS_Store" "*/.git/*"

# Verify it was created
ls -lh zen-tab-manager.xpi
```

### Step 2: Create Release on GitHub

1. **Go to releases page:**
   ```
   https://github.com/janilaatunen/zen-tab-manager/releases/new
   ```

2. **Fill in the form:**

   **Choose a tag:** `v1.0.0`
   - Type: `v1.0.0`
   - Target: `main`
   - Click "Create new tag: v1.0.0 on publish"

   **Release title:** `Zen Tab Manager v1.0.0`

   **Description:** (Copy/paste this)
   ```markdown
   ## Zen Tab Manager v1.0.0

   First release! 🎉

   ### Features

   ✨ **Auto-Archive Old Tabs**
   - Automatically closes tabs that haven't been accessed in a configurable time
   - Supports decimal hours (0.5 = 30 minutes, 0.25 = 15 minutes)
   - Protects pinned tabs from archiving
   - Exclude specific domains from auto-archiving

   🗂️ **Container-Based Workspace Organization**
   - Automatically assigns tabs to containers based on URL patterns
   - Works seamlessly with Zen's container → workspace mapping
   - Flexible pattern matching (exact domain, wildcards, subdomains)

   ☁️ **Cross-Browser Settings Sync**
   - Automatically syncs settings across all browsers via Firefox Sync
   - Toggle to enable/disable sync per device
   - Tab access times remain device-specific

   ### Installation

   1. Download `zen-tab-manager.xpi` below
   2. Open Zen Browser
   3. Set `xpinstall.signatures.required` to `false` in `about:config` (one-time setup)
   4. Go to `about:addons` → Gear icon → Install Add-on From File
   5. Select the downloaded XPI file

   See [INSTALL.md](https://github.com/janilaatunen/zen-tab-manager/blob/main/INSTALL.md) for detailed instructions.

   ### What's New in v1.0.0

   - Initial release
   - Auto-archive functionality with decimal hour precision
   - Container-based workspace organization
   - Cross-browser settings synchronization
   - Comprehensive documentation

   ### Documentation

   - [README.md](https://github.com/janilaatunen/zen-tab-manager/blob/main/README.md) - Overview and features
   - [INSTALL.md](https://github.com/janilaatunen/zen-tab-manager/blob/main/INSTALL.md) - Installation instructions
   - [SYNC_STORAGE_UPDATE.md](https://github.com/janilaatunen/zen-tab-manager/blob/main/SYNC_STORAGE_UPDATE.md) - Sync implementation details
   - [CLEAR_DATA_GUIDE.md](https://github.com/janilaatunen/zen-tab-manager/blob/main/CLEAR_DATA_GUIDE.md) - How to clear synced data

   ### Requirements

   - Zen Browser (or Firefox 91.0+)
   - Unsigned extension installation enabled

   ### Known Issues

   - Zen Browser doesn't expose a workspace API to extensions
   - Extension uses containers as a workaround
   - You must manually map containers → workspaces in Zen's settings

   ### Support

   - **Issues:** https://github.com/janilaatunen/zen-tab-manager/issues
   - **Email:** jani@laatunen.fi

   ### License

   MIT License - See [LICENSE](https://github.com/janilaatunen/zen-tab-manager/blob/main/LICENSE)
   ```

3. **Attach the XPI file:**
   - Drag and drop `zen-tab-manager.xpi` into the attachments area
   - Or click "Attach binaries" and select the file

4. **Publish:**
   - ☐ Set as pre-release (leave unchecked)
   - ☐ Set as latest release (check this)
   - Click "Publish release"

### Step 3: Verify Release

After publishing:

1. Visit: `https://github.com/janilaatunen/zen-tab-manager/releases`
2. You should see v1.0.0 listed
3. The XPI file should be downloadable
4. The release notes should be formatted nicely

## Download Link for Users

Direct download link will be:
```
https://github.com/janilaatunen/zen-tab-manager/releases/download/v1.0.0/zen-tab-manager.xpi
```

## Future Releases

For subsequent releases:

1. Make your changes and commit
2. Build XPI
3. Create new release with incremented version (v1.0.1, v1.1.0, etc.)
4. Upload new XPI
5. Update release notes with changelog

## Enabling GitHub Actions Later

When you update your token with `workflow` scope:

```bash
# Push the workflow file
git push origin main

# Future releases will be automatic:
git tag v1.1.0
git push origin v1.1.0
# GitHub Actions will build and attach the XPI automatically
```

## Version Numbering

Follow Semantic Versioning:

- **Major (1.0.0 → 2.0.0)**: Breaking changes
- **Minor (1.0.0 → 1.1.0)**: New features, backward compatible
- **Patch (1.0.0 → 1.0.1)**: Bug fixes, backward compatible

## Quick Reference Commands

```bash
# Build XPI
cd /Users/jani.laatunen/Projects/zen-tab-manager
zip -r zen-tab-manager.xpi manifest.json background.js options.html options.js options.css icon.png icon.svg LICENSE README.md -x "*.DS_Store" "*/.git/*"

# Create release on GitHub
# Go to: https://github.com/janilaatunen/zen-tab-manager/releases/new

# For next version
git tag v1.0.1
# Don't push tag yet, just create manual release
```

## Notes

- Manual releases work perfectly fine
- GitHub Actions is optional (just convenient)
- Users get the same XPI either way
- You can switch to automated releases anytime

# Release Process

This document describes how to create and publish new releases of Zen Tab Manager.

## Automatic Release via GitHub Actions

The repository is configured to automatically build and publish releases when you push a version tag.

### Steps to Create a Release

1. **Update the version** (if needed)
   ```bash
   # Edit manifest.json and update the version field
   # Current version: 1.0.0
   ```

2. **Commit your changes**
   ```bash
   git add .
   git commit -m "Prepare release v1.0.1"
   git push
   ```

3. **Create and push a version tag**
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

4. **GitHub Actions will automatically:**
   - Build the XPI file
   - Create a GitHub release
   - Attach the XPI to the release
   - Generate release notes

5. **Visit the release page:**
   - Go to: https://github.com/janilaatunen/zen-tab-manager/releases
   - Your new release will be there with the XPI file attached

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **Major (1.0.0 → 2.0.0)**: Breaking changes
- **Minor (1.0.0 → 1.1.0)**: New features, backward compatible
- **Patch (1.0.0 → 1.0.1)**: Bug fixes, backward compatible

### Adding Release Notes

After the automatic release is created:

1. Go to the release on GitHub
2. Click "Edit release"
3. Add detailed changelog under "### Changelog"
4. Save the changes

## Manual Release (Without GitHub Actions)

If you need to create a release manually:

1. **Build the XPI locally:**
   ```bash
   cd /Users/jani.laatunen/Projects/zen-tab-manager
   zip -r zen-tab-manager.xpi manifest.json background.js options.html options.js options.css icon.png icon.svg LICENSE README.md -x "*.DS_Store" "*/.git/*"
   ```

2. **Create a GitHub release:**
   - Go to: https://github.com/janilaatunen/zen-tab-manager/releases/new
   - Create a new tag (e.g., `v1.0.1`)
   - Set release title: `Zen Tab Manager v1.0.1`
   - Add release notes
   - Upload the XPI file
   - Publish release

3. **Share the download link:**
   ```
   https://github.com/janilaatunen/zen-tab-manager/releases/download/v1.0.1/zen-tab-manager.xpi
   ```

## Testing Before Release

Always test the extension before releasing:

1. Build the XPI locally
2. Install in Zen Browser (`about:addons` → Install from file)
3. Test all features:
   - Auto-archive functionality
   - Container assignment rules
   - Settings persistence
   - Options page UI
4. Check browser console for errors
5. Test on a fresh profile if possible

## Checklist

Before creating a release:

- [ ] All changes committed and pushed
- [ ] Version number updated in `manifest.json` (if needed)
- [ ] Extension tested locally
- [ ] No console errors
- [ ] README updated with new features (if applicable)
- [ ] CHANGELOG drafted (optional)

## Distribution

Once released, share the download link:

**Direct download:**
```
https://github.com/janilaatunen/zen-tab-manager/releases/latest/download/zen-tab-manager.xpi
```

**Release page:**
```
https://github.com/janilaatunen/zen-tab-manager/releases
```

Users should follow the instructions in [INSTALL.md](INSTALL.md) to install.

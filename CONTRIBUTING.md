# Contributing

This is a vibe coded project. Feel free to fork and improve it, but don't expect production-grade code quality.

## Development

### Setup

```bash
git clone https://github.com/janilaatunen/zen-tab-manager.git
cd zen-tab-manager
```

### Testing Locally

1. Open Zen Browser
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select `manifest.json` from this directory

### Making Changes

The extension auto-rebuilds on commit via git pre-commit hook:
- Edit files
- Commit changes
- `zen-tab-manager.xpi` is automatically rebuilt

## Releasing

### Build XPI

```bash
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
```

### Create Release on GitHub

1. Go to https://github.com/janilaatunen/zen-tab-manager/releases/new
2. Create new tag: `v1.0.x`
3. Set as latest release
4. Upload `zen-tab-manager.xpi`
5. Add release notes

## Pull Requests

PRs are welcome! Please:
- Keep changes focused
- Test in Zen Browser
- Update README if adding features

## Questions?

Open an issue or email jani@laatunen.fi

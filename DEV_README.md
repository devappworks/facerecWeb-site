# Development Setup Complete ✅

## What's Installed

- **Node.js**: v24.11.1 (LTS)
- **npm**: v11.6.2
- **NVM**: v0.39.0 (Node Version Manager)

## Quick Commands

### Building the Training UI

```bash
# Option 1: Use the build script (easiest)
./build.sh

# Option 2: Manual build
cd training-ui
npm run build
```

### Development Server (for testing)

```bash
cd training-ui
npm run dev
# Opens at http://localhost:5173
```

### Running Tests

```bash
cd training-ui
npm test                 # Run all tests
npm test -- --watch      # Watch mode
npm test:coverage        # Coverage report
```

## How it Works

### Source Code Location
- **Source**: `training-ui/` - React source code
- **Output**: `training-dist/` - Built static files
- **Live Site**: Served via symlink `training → training-dist`

### Build Process

1. **Make changes** in `training-ui/src/`
2. **Build**: Run `./build.sh` or `npm run build`
3. **Deploy**: Files automatically appear in `training-dist/`
4. **Live**: Changes are live immediately (nginx serves static files)

### File Locations

```
/home/photolytics/public_html/
├── build.sh              # Quick build script
├── training/             # Symlink → training-dist
├── training-dist/        # Built files (served by nginx)
│   ├── index.html
│   └── assets/
│       ├── index-*.js    # React bundle
│       └── index-*.css   # Styles
└── training-ui/          # Source code
    ├── src/              # React components
    ├── package.json
    └── vite.config.js
```

## NVM Usage (if needed)

NVM is automatically loaded in your bash profile. To use it manually:

```bash
# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# List installed versions
nvm list

# Switch versions
nvm use 24

# Install another version
nvm install 20
```

## Recent Changes Deployed

✅ **Expandable Generated Names Card**
- After generating names, an expandable card now appears
- Shows list of generated celebrities with occupation tags
- Click to expand/collapse
- Displays total and remaining counts

## URLs

- **Live Site**: https://photolytics.mpanel.app/training/
- **Main App**: https://photolytics.mpanel.app/
- **Dev Server**: http://localhost:5173 (when running `npm run dev`)

## Notes

- No server restart needed after building (static files)
- The `training-dist/` folder IS committed to git (pre-built files)
- Always build before committing if you changed source code
- Build time: ~1-2 seconds

## Troubleshooting

**If build fails:**
```bash
cd training-ui
rm -rf node_modules package-lock.json
npm install
npm run build
```

**If node/npm not found:**
```bash
# Reload bash profile
source ~/.bashrc

# Or manually load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

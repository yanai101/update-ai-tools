# update-ai-tools

A simple CLI tool to update AI npm tools (Claude, Gemini, Copilot, Codex) with a single command. **No installation required** - just use `npx`!

## Usage

Run directly with `npx` - no global installation needed:

### Update all AI tools

```bash
npx update-ai-tools
# or
npx update-ai-tools all
```

### Update specific tools

```bash
npx update-ai-tools claude
npx update-ai-tools gemini
npx update-ai-tools copilot
npx update-ai-tools codex
```

### Check installed versions

```bash
npx update-ai-tools check
```

## Supported Tools

- **Claude** - `@anthropic-ai/claude-code`
- **Gemini** - `@google/gemini-cli`
- **Copilot** - `@github/copilot`
- **Codex** - `@openai/codex`

## Features

- ✅ **No installation required** - run with `npx`
- ✅ **Smart version checking** - only updates packages when newer versions are available
- ✅ **Version comparison** - shows local vs remote versions before updating
- ✅ **User confirmation** - asks permission before installing new packages
- ✅ **Smart detection** - distinguishes between updates and new installations
- ✅ Update all AI tools at once
- ✅ Update individual tools
- ✅ Check installed versions with update availability
- ✅ **Smart error handling** - retries failed installations and falls back to individual installs
- ✅ **Detailed feedback** - shows installation summary and failed packages
- ✅ Simple and intuitive CLI interface

## Examples

```bash
# Update everything (with smart version checking)
$ npx update-ai-tools
� Checking package versions...
�📦 claude: 1.2.0 → 1.2.3 (update available)
✅ copilot: 3.4.5 (up to date)
📦 gemini: not installed (latest: 2.1.0)

✅ Already up to date (1 packages):
   - copilot

🔄 Packages with updates available (1 packages):
   - claude (@anthropic-ai/claude-code)

📦 New packages to install (1 packages):
   - gemini (@google/gemini-cli)

❓ Do you want to install the new packages? (y/N): y

🚀 Processing 2 package(s)...
✅ All packages installed successfully!

# If everything is up to date
$ npx update-ai-tools
� Checking package versions...
✅ claude: 1.2.3 (up to date)
✅ copilot: 3.4.5 (up to date)
✅ gemini: 2.1.0 (up to date)

✅ Already up to date (3 packages):
   - claude
   - copilot
   - gemini

🎉 All packages are up to date! No updates needed.

# Check versions with update availability
$ npx update-ai-tools check
🔎 Checking installed versions and updates...

claude: 1.2.0 → 1.2.3 available ⬆️
gemini: 2.0.5 → 2.1.0 available ⬆️
copilot: 3.4.5 ✅
codex: not installed (latest: 1.0.0) ❌

# Update just Claude (will check if update is needed)
$ npx update-ai-tools claude
📦 Updating claude...
� Checking package versions...
📦 claude: 1.2.0 → 1.2.3 (update available)

🔄 Packages with updates available (1 packages):
   - claude (@anthropic-ai/claude-code)

🚀 Processing 1 package(s)...
✅ claude installed successfully
```

## Requirements

- Node.js (ES modules support)
- npm (comes with Node.js)

## License

MIT © Yanai Edri

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 🤖 Automated Publishing

This repository uses GitHub Actions for automated publishing:

- **Auto-versioning**: When PRs are merged, versions are bumped automatically based on commit messages
- **Auto-publishing**: New versions are automatically published to npm
- **Auto-releases**: GitHub releases are created automatically

See [`.github/ACTIONS_SETUP.md`](.github/ACTIONS_SETUP.md) for setup details.

### Version Bump Guidelines

Use these keywords in your PR title for automatic version bumping:

- `feat:` or `feature:` → **minor** version bump
- `fix:` or `patch:` → **patch** version bump  
- `BREAKING:` or `major:` → **major** version bump

## Issues

If you encounter any issues or have suggestions, please [open an issue](https://github.com/yanai101/update-ai-tools/issues).

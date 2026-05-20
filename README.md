# update-ai-tools

A simple CLI tool to update AI npm tools (Claude, Copilot, Codex, Kilo Code) with a single command. **No installation required** - just use `npx`!

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
npx update-ai-tools copilot
npx update-ai-tools codex
npx update-ai-tools kilocode
```

### Check installed versions

```bash
npx update-ai-tools check
```

## Supported Tools

- **Claude** - `@anthropic-ai/claude-code`
- **Copilot** - `@github/copilot`
- **Codex** - `@openai/codex`
- **Kilo Code** - `@kilocode/cli`

Gemini CLI is no longer supported because Google removed `@google/gemini-cli` and changed the tool. The new Google tool is not supported yet. If `update-ai-tools check` detects `gemini`, it recommends uninstalling `@google/gemini-cli`.

## Features

- ✅ **No installation required** - run with `npx`
- ✅ **Smart version checking** - only updates packages when newer versions are available
- ✅ **Version comparison** - shows local vs remote versions before updating
- ✅ **User confirmation** - asks permission before installing new packages
- ✅ **Smart detection** - distinguishes between updates and new installations
- ✅ Update all AI tools at once
- ✅ Update individual tools
- ✅ Check installed versions with update availability
- ✅ **Intelligent error handling** - detects and fixes npm cache issues automatically
- ✅ **Automatic cache cleaning** - clears npm cache when corruption is detected
- ✅ **Detailed feedback** - shows installation summary and troubleshooting tips
- ✅ Simple and intuitive CLI interface

## Examples

```bash
# Update everything (with smart version checking)
$ npx update-ai-tools
� Checking package versions...
�📦 claude: 1.2.0 → 1.2.3 (update available)
✅ copilot: 3.4.5 (up to date)
✅ codex: 1.0.0 (up to date)

✅ Already up to date (2 packages):
   - copilot
   - codex

🔄 Packages with updates available (1 packages):
   - claude (@anthropic-ai/claude-code)

🚀 Processing 1 package(s)...
✅ All packages installed successfully!

# If everything is up to date
$ npx update-ai-tools
� Checking package versions...
✅ claude: 1.2.3 (up to date)
✅ copilot: 3.4.5 (up to date)
✅ codex: 1.0.0 (up to date)

✅ Already up to date (3 packages):
   - claude
   - copilot
   - codex

🎉 All packages are up to date! No updates needed.

# Check versions with update availability
$ npx update-ai-tools check
🔎 Checking installed versions and updates...

claude: 1.2.0 → 1.2.3 available ⬆️
copilot: 3.4.5 ✅
codex: not installed (latest: 1.0.0) ❌
⚠️  gemini: 2.0.5 detected. Gemini CLI is no longer supported because Google removed @google/gemini-cli and changed the tool. The new Google tool is not supported yet. Recommended: uninstall @google/gemini-cli.
   npm uninstall -g @google/gemini-cli

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

## Issues

If you encounter any issues or have suggestions, please [open an issue](https://github.com/yanai101/update-ai-tools/issues).

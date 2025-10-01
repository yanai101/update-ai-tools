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
- ✅ **User confirmation** - asks permission before installing new packages
- ✅ **Smart detection** - distinguishes between updates and new installations
- ✅ Update all AI tools at once
- ✅ Update individual tools
- ✅ Check installed versions
- ✅ **Smart error handling** - retries failed installations and falls back to individual installs
- ✅ **Detailed feedback** - shows installation summary and failed packages
- ✅ Simple and intuitive CLI interface

## Examples

```bash
# Update everything (with user confirmation for new packages)
$ npx update-ai-tools
📦 Updating all AI tools...
✅ Already installed packages (will be updated):
   - claude (@anthropic-ai/claude-code)
   - copilot (@github/copilot)

📦 New packages to install:
   - gemini (@google/gemini-cli)
   - codex (@openai/codex)

❓ Do you want to install the new packages? (y/N): y
✅ All packages installed successfully!

# If user declines new installations
$ npx update-ai-tools
📦 Updating all AI tools...
✅ Already installed packages (will be updated):
   - claude (@anthropic-ai/claude-code)

📦 New packages to install:
   - gemini (@google/gemini-cli)

❓ Do you want to install the new packages? (y/N): n
❌ Installation cancelled by user.
💡 Only updating already installed packages...
✅ claude (@anthropic-ai/claude-code) installed successfully

# Check what's installed
$ npx update-ai-tools check
🔎 Installed versions:
claude: 1.2.3
gemini: not installed
copilot: 3.4.5
codex: not installed

# Update just Claude (will ask for confirmation if not installed)
$ npx update-ai-tools claude
📦 Updating claude...
📦 New packages to install:
   - claude (@anthropic-ai/claude-code)

❓ Do you want to install the new packages? (y/N): y
📦 Installing claude (@anthropic-ai/claude-code)...
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

# update-ai-tools

A simple CLI tool to update AI npm tools (Claude, Gemini, Copilot, Codex) with a single command.

## Installation

Install globally via npm:

```bash
npm install -g update-ai-tools
```

## Usage

### Update all AI tools

```bash
update-ai-tools
# or
update-ai-tools all
```

### Update specific tools

```bash
update-ai-tools claude
update-ai-tools gemini
update-ai-tools copilot
update-ai-tools codex
```

### Check installed versions

```bash
update-ai-tools check
```

## Supported Tools

- **Claude** - `@anthropic-ai/claude-code`
- **Gemini** - `@google/gemini-cli`
- **Copilot** - `@github/copilot`
- **Codex** - `@openai/codex`

## Features

- ✅ Update all AI tools at once
- ✅ Update individual tools
- ✅ Check installed versions
- ✅ Simple and intuitive CLI interface
- ✅ Error handling with clear feedback

## Examples

```bash
# Update everything
$ update-ai-tools
📦 Updating all AI tools...
➡️  npm install -g @anthropic-ai/claude-code @google/gemini-cli @github/copilot @openai/codex

# Check what's installed
$ update-ai-tools check
🔎 Installed versions:
claude: 1.2.3
gemini: 2.1.0
copilot: 3.4.5
codex: not installed

# Update just Claude
$ update-ai-tools claude
📦 Updating claude...
➡️  npm install -g @anthropic-ai/claude-code
```

## Requirements

- Node.js (ES modules support)
- npm

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

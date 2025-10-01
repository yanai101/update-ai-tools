#!/usr/bin/env node
import { execSync } from "node:child_process";

const packages = {
  claude: "@anthropic-ai/claude-code",
  gemini: "@google/gemini-cli",
  copilot: "@github/copilot",
  codex: "@openai/codex",
};

function run(cmd) {
  try {
    console.log(`➡️  ${cmd}`);
    execSync(cmd, { stdio: "inherit" });
  } catch (err) {
    console.error("❌ Error running:", cmd);
    process.exit(1);
  }
}

const arg = process.argv[2] || "all";

if (arg === "all") {
  console.log("📦 Updating all AI tools...");
  run(`npm install -g ${Object.values(packages).join(" ")}`);
} else if (arg === "check") {
  console.log("🔎 Installed versions:");
  for (const [name, bin] of Object.entries({
    claude: "claude",
    gemini: "gemini",
    copilot: "github-copilot",
    codex: "codex",
  })) {
    try {
      const version = execSync(`${bin} --version`, { encoding: "utf8" }).trim();
      console.log(`${name}: ${version}`);
    } catch {
      console.log(`${name}: not installed`);
    }
  }
} else if (packages[arg]) {
  console.log(`📦 Updating ${arg}...`);
  run(`npm install -g ${packages[arg]}`);
} else {
  console.log("Usage: update-ai-tools [all|claude|gemini|copilot|codex|check]");
  process.exit(1);
}

#!/usr/bin/env node
/**
 * Update AI Tools
 * A robust CLI tool to manage and update AI-related npm tools.
 *
 * @license MIT
 */

import { exec, spawn } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";

const execAsync = promisify(exec);

// --- Type Definitions ---

/**
 * @typedef {Object} PackageConfig
 * @property {string} name - The display name key
 * @property {string} packageName - The npm package name
 * @property {string} binary - The binary command name
 */

// --- Constants & Configuration ---

const PACKAGES = {
  claude: "@anthropic-ai/claude-code",
  gemini: "@google/gemini-cli",
  copilot: "@github/copilot",
  codex: "@openai/codex",
  kilocode: "@kilocode/cli",
};

const BINARIES = {
  claude: "claude",
  gemini: "gemini",
  copilot: "copilot",
  codex: "codex",
  kilocode: "kilocode",
};

const BANNER = `
 _     ____  ____  ____ _____ _____      ____  _      _____ ____  ____  _     ____
/ \\ /\\/  __\\/  _ \\/  _ Y__ __Y  __/     /  _ \\/ \\    /__ __Y  _ \\/  _ \\/ \\   / ___\\
| | |||  \\/|| | \\|| / \\| / \\ |  \\ _____ | / \\|| |_____ / \\ | / \\|| / \\|| |   |    \\
| \\_/||  __/| |_/|| |-|| | | |  /_\\____\\| |-||| |\\____\\| | | \\_/|| \\_/|| |_/\\\\___ |
\\____/\\_/   \\____/\\_/ \\| \\_/ \\____\\     \\_/ \\|\\_/      \\_/ \\____/\\____/\\____/\\____/
`;

// --- Utilities ---

const Logger = {
  log: (msg) => console.log(msg),
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  step: (msg) => console.log(`➡️  ${msg}`),
  header: (msg) => console.log(`\n${msg}\n`),
};

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a command and streams output to stdio
 * @param {string} cmd
 * @returns {Promise<void>}
 */
function spawnAsync(cmd) {
  return new Promise((resolve, reject) => {
    // shell: true allows passing the full command string
    const child = spawn(cmd, { shell: true, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with exit code ${code}`));
    });
  });
}

/**
 * Compare two semantic version strings.
 * @param {string} v1
 * @param {string} v2
 * @returns {-1|0|1} -1 if v1 < v2, 1 if v1 > v2, 0 if equal
 */
function compareVersions(v1, v2) {
  if (!v1 || !v2) return 0;
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }
  return 0;
}

/**
 * Ask the user a question via stdin
 * @param {string} question
 * @returns {Promise<string>}
 */
function askUser(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

// --- Managers ---

/**
 * Manages npm interactions and package installation
 */
class NpmManager {
  constructor() {
    this.globalModulesDir = null;
  }

  /**
   * Executes a shell command with retries
   * @param {string} cmd - Command to execute
   * @param {Object} options - Retry options
   * @returns {Promise<boolean>}
   */
  async runWithRetry(cmd, options = {}) {
    const retries = options.retries ?? 2;
    let cacheCleared = false;

    for (let i = 0; i <= retries; i++) {
      try {
        Logger.step(`${cmd}${i > 0 ? ` (retry ${i})` : ""}`);
        // Use spawnAsync to show output to user
        await spawnAsync(cmd);
        return true;
      } catch (err) {
        const errorType = this.getErrorType(err);

        // Run custom error hook if provided
        if (options.onError) {
            const hookResult = await options.onError(err, i);
            if (hookResult?.retryImmediately) continue;
        }

        if (i === retries) {
          Logger.error(`Failed after ${retries + 1} attempts: ${cmd}`);
          this.provideErrorGuidance(errorType);
          return false;
        }

        Logger.warn(`Attempt ${i + 1} failed (${errorType} error)`);

        if (errorType === "cache" && !cacheCleared) {
          Logger.log("🧹 Detected npm cache error, clearing cache...");
          await this.clearCache();
          cacheCleared = true;
          continue;
        }

        const delay = errorType === "network" ? 5000 : 2000;
        Logger.log(`⏳ Waiting ${delay}ms before retry...`);
        await sleep(delay);
      }
    }
    return false;
  }

  getErrorType(error) {
    const msg = error.toString();
    if (msg.includes("ENOENT") || msg.includes("ENOTEMPTY") || msg.includes("_cacache") || (msg.includes("package.json") && msg.includes("tmp"))) {
      return "cache";
    }
    if (msg.includes("ENOTFOUND") || msg.includes("ECONNRESET") || msg.includes("ETIMEDOUT") || msg.includes("network")) {
      return "network";
    }
    return "unknown";
  }

  provideErrorGuidance(type) {
    if (type === "cache") {
      Logger.log("💡 Try: npm cache clean --force");
    } else if (type === "network") {
      Logger.log("💡 Check your internet connection.");
    }
  }

  async clearCache() {
    try {
      await execAsync("npm cache clean --force");
      Logger.success("npm cache cleared");
    } catch {
      Logger.warn("Failed to clear npm cache manually.");
    }
  }

  async getGlobalRoot() {
    if (this.globalModulesDir) return this.globalModulesDir;
    try {
      const { stdout } = await execAsync("npm root -g");
      this.globalModulesDir = stdout.trim();
      return this.globalModulesDir;
    } catch {
      return null;
    }
  }

  /**
   * Get the version of an installed global package
   * @param {string} packageName
   */
  async getLocalVersion(packageName) {
    try {
      const { stdout } = await execAsync(`npm list -g ${packageName} --depth=0 --json`);
      const data = JSON.parse(stdout);
      return data.dependencies?.[packageName]?.version || null;
    } catch {
      return null;
    }
  }

  /**
   * Get the latest version from npm registry
   * @param {string} packageName
   */
  async getRemoteVersion(packageName) {
    try {
      const { stdout } = await execAsync(`npm view ${packageName} version`);
      return stdout.trim();
    } catch {
      return null;
    }
  }

  /**
   * Get version from the binary executable
   * @param {string} binary
   */
  async getBinaryVersion(binary) {
    try {
      const { stdout } = await execAsync(`${binary} --version`);
      const output = stdout.trim();
      // Handle multi-line outputs (like copilot)
      return output.split("\n")[0];
    } catch {
      return null;
    }
  }

  async isInstalled(packageName, binaryName) {
    // 1. Try binary check (faster usually)
    if (binaryName) {
        try {
            await execAsync(`${binaryName} --version`);
            return true;
        } catch { /* ignore */ }
    }

    // 2. Fallback to npm list
    const version = await this.getLocalVersion(packageName);
    return !!version;
  }

  /**
   * Specific cleanup logic for Gemini CLI which often has directory conflicts
   */
  async cleanGeminiDir() {
    const baseDir = await this.getGlobalRoot();
    if (!baseDir) return false;

    const geminiDir = join(baseDir, "@google", "gemini-cli");
    const geminiNamespaceDir = join(baseDir, "@google");
    let cleaned = false;

    // Helper to clean stale .gemini-cli dirs
    const cleanStale = () => {
      if (existsSync(geminiNamespaceDir)) {
        try {
          const entries = readdirSync(geminiNamespaceDir);
          entries.filter(e => e.startsWith(".gemini-cli")).forEach(e => {
            rmSync(join(geminiNamespaceDir, e), { recursive: true, force: true });
          });
        } catch (e) {
          Logger.warn(`Failed to clean stale dirs: ${e.message}`);
        }
      }
    };

    if (existsSync(geminiDir)) {
        try {
            rmSync(geminiDir, { recursive: true, force: true });
            cleaned = true;
        } catch { /* fail silently */ }
    }

    cleanStale();
    return cleaned;
  }
}

/**
 * Main application controller
 */
class App {
    constructor() {
        this.npm = new NpmManager();
    }

    async run() {
        console.log(BANNER);
        const args = process.argv.slice(2);
        const cmd = args[0] || "all";

        if (cmd === "check") {
            await this.checkVersions();
        } else if (PACKAGES[cmd]) {
            await this.updatePackages([cmd], true);
        } else if (cmd === "all") {
            await this.updatePackages(Object.keys(PACKAGES), false);
        } else {
            this.showHelp();
        }
    }

    showHelp() {
        console.log("Usage: update-ai-tools [all|claude|gemini|copilot|codex|kilocode|check]");
        console.log("\nOptions:");
        console.log("  all     - Update all AI tools");
        console.log("  check   - Check installed versions");
        console.log("  [name]  - Update specific tool");
        process.exit(1);
    }

    async checkVersions() {
        Logger.info("Checking installed versions...");
        console.log(""); // spacer

        // Run checks in parallel
        const checks = Object.entries(BINARIES).map(async ([key, bin]) => {
            const pkgName = PACKAGES[key];

            // Parallel fetch of local/binary and remote
            const [localVer, binVer, remoteVer] = await Promise.all([
                this.npm.getLocalVersion(pkgName),
                this.npm.getBinaryVersion(bin),
                this.npm.getRemoteVersion(pkgName)
            ]);

            const current = binVer || localVer;

            return { key, current, remote: remoteVer };
        });

        const results = await Promise.all(checks);

        results.forEach(({ key, current, remote }) => {
            if (current) {
                if (remote && compareVersions(current, remote) < 0) {
                    console.log(`${key}: ${current} → ${remote} available ⬆️`);
                } else {
                    console.log(`${key}: ${current} ✅`);
                }
            } else {
                console.log(`${key}: not installed (latest: ${remote || "unknown"}) ❌`);
            }
        });
    }

    async updatePackages(keys, individual) {
        Logger.info("Checking package status...");

        const updates = [];
        const installs = [];
        const upToDate = [];

        // Analyze what needs to be done
        for (const key of keys) {
            const pkgName = PACKAGES[key];
            const isInstalled = await this.npm.isInstalled(pkgName, BINARIES[key]);
            const remoteVer = await this.npm.getRemoteVersion(pkgName);

            if (isInstalled) {
                const localVer = await this.npm.getLocalVersion(pkgName);
                if (localVer && remoteVer && compareVersions(localVer, remoteVer) < 0) {
                    console.log(`📦 ${key}: ${localVer} → ${remoteVer} (update available)`);
                    updates.push(pkgName);
                } else {
                    console.log(`✅ ${key}: ${localVer || "installed"} (up to date)`);
                    upToDate.push(key);
                }
            } else {
                console.log(`📦 ${key}: not installed (latest: ${remoteVer || "unknown"})`);
                installs.push(pkgName);
            }
        }

        // Summary
        if (upToDate.length > 0) {
            Logger.log(`\n✅ Already up to date: ${upToDate.join(", ")}`);
        }

        const toProcess = [...updates, ...installs];

        if (toProcess.length === 0) {
            Logger.success("\nAll packages are up to date!");
            return;
        }

        // Ask for confirmation if there are new installs
        if (installs.length > 0) {
            Logger.log(`\n📦 New packages to install: ${installs.length}`);
            installs.forEach(p => Logger.log(`   - ${p}`));

            const answer = await askUser("\n❓ Install these packages? (y/N): ");
            if (answer !== 'y' && answer !== 'yes') {
                Logger.warn("Installation cancelled.");
                // Filter out installs if user declined, but proceed with updates?
                // The original logic stopped completely for new packages, but proceeded for updates.
                // Let's assume if they say no, they mean no to the new stuff.
                // For simplicity, we'll return if they say no to new installs,
                // unless we want to separate "updates" from "installs" strictly.
                // The original logic combined them after confirmation.
                return;
            }
        }

        Logger.header(`Processing ${toProcess.length} package(s)...`);

        // Try bulk install first if not individual mode
        if (!individual && toProcess.length > 1) {
            const bulkCmd = `npm install -g ${toProcess.join(" ")}`;
            const success = await this.npm.runWithRetry(bulkCmd, { retries: 1 });
            if (success) {
                Logger.success("All packages installed successfully!");
                return;
            }
            Logger.warn("Bulk installation failed, switching to individual mode...");
        }

        // Individual install
        let successCount = 0;
        const failed = [];

        for (const pkg of toProcess) {
            const key = Object.keys(PACKAGES).find(k => PACKAGES[k] === pkg) || pkg;
            Logger.log(`\n📦 Installing ${key}...`);

            // Specific Gemini error handler
            const errorHandler = async (err) => {
                const msg = err.toString();
                if (key === 'gemini' && msg.includes("ENOTEMPTY")) {
                    Logger.log("🧹 Cleaning Gemini directory conflict...");
                    if (await this.npm.cleanGeminiDir()) {
                        return { retryImmediately: true };
                    }
                }
                return null;
            };

            const success = await this.npm.runWithRetry(`npm install -g ${pkg}`, {
                onError: errorHandler
            });

            if (success) {
                Logger.success(`${key} installed`);
                successCount++;
            } else {
                Logger.error(`${key} failed`);
                failed.push(key);
            }
        }

        // Final Report
        Logger.header("Installation Summary");
        Logger.success(`Successful: ${successCount}`);
        if (failed.length > 0) {
            Logger.error(`Failed: ${failed.join(", ")}`);
            Logger.log("\n💡 Try installing failed packages manually with 'npm install -g <package>'");
        }
    }
}

// --- Bootstrap ---

const app = new App();
app.run().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});

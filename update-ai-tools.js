#!/usr/bin/env node
import { execSync } from "node:child_process";
import { createInterface } from "node:readline";

const packages = {
  claude: "@anthropic-ai/claude-code",
  gemini: "@google/gemini-cli",
  copilot: "@github/copilot",
  codex: "@openai/codex",
  kilocode: "@kilocode/cli",
};

const binaries = {
  claude: "claude",
  gemini: "gemini",
  copilot: "copilot",
  codex: "codex",
  kilocode: "kilocode",
};

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

function getLocalPackageVersion(packageName) {
  try {
    const result = execSync(`npm list -g ${packageName} --depth=0 --json`, {
      encoding: "utf8",
      stdio: "pipe",
    });
    const data = JSON.parse(result);
    return data.dependencies?.[packageName]?.version || null;
  } catch {
    return null;
  }
}

function getRemotePackageVersion(packageName) {
  try {
    const result = execSync(`npm view ${packageName} version`, {
      encoding: "utf8",
      stdio: "pipe",
    });
    return result.trim();
  } catch {
    return null;
  }
}

function compareVersions(v1, v2) {
  if (!v1 || !v2) return false;

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

function getBinaryVersion(binaryName) {
  try {
    const output = execSync(`${binaryName} --version`, { encoding: "utf8" }).trim();

    // Handle copilot which returns multiple lines
    if (binaryName === "copilot") {
      return output.split("\n")[0]; // Return only the first line (version number)
    }

    return output;
  } catch {
    return null;
  }
}

function isPackageInstalled(packageName) {
  const nameKey = Object.keys(packages).find((key) => packages[key] === packageName);
  const binaryName = binaries[nameKey];

  if (binaryName) {
    try {
      execSync(`${binaryName} --version`, { encoding: "utf8", stdio: "ignore" });
      return true;
    } catch {
      // Fall back to npm list check below
    }
  }

  try {
    const result = execSync(`npm list -g ${packageName} --depth=0 --json`, {
      encoding: "utf8",
      stdio: "pipe",
    });
    const data = JSON.parse(result);
    return Boolean(data.dependencies?.[packageName]);
  } catch {
    return false;
  }
}

function run(cmd, allowFailure = false) {
  try {
    console.log(`➡️  ${cmd}`);
    execSync(cmd, { stdio: "inherit" });
    return true;
  } catch (err) {
    if (allowFailure) {
      console.error(`⚠️  Failed: ${cmd}`);
      return false;
    } else {
      console.error("❌ Error running:", cmd);
      process.exit(1);
    }
  }
}

function isCacheError(error) {
  const errorString = error.toString();
  return (
    errorString.includes("ENOENT") ||
    errorString.includes("ENOTEMPTY") ||
    errorString.includes("_cacache") ||
    errorString.includes("git-clone") ||
    (errorString.includes("package.json") && errorString.includes("tmp"))
  );
}

function isNetworkError(error) {
  const errorString = error.toString();
  return errorString.includes("ENOTFOUND") || errorString.includes("ECONNRESET") || errorString.includes("ETIMEDOUT") || errorString.includes("network");
}

function getErrorType(error) {
  if (isCacheError(error)) return "cache";
  if (isNetworkError(error)) return "network";
  return "unknown";
}

function clearNpmCache() {
  try {
    console.log("🧹 Clearing npm cache...");
    execSync("npm cache clean --force", { stdio: "pipe" });
    console.log("✅ npm cache cleared");
    return true;
  } catch (err) {
    console.log("⚠️  Failed to clear npm cache, continuing anyway...");
    return false;
  }
}

function runWithRetry(cmd, retries = 2) {
  let cacheCleared = false;

  for (let i = 0; i <= retries; i++) {
    try {
      console.log(`➡️  ${cmd}${i > 0 ? ` (retry ${i})` : ""}`);
      execSync(cmd, { stdio: "inherit" });
      return true;
    } catch (err) {
      const errorType = getErrorType(err);

      if (i === retries) {
        console.error(`❌ Failed after ${retries + 1} attempts: ${cmd}`);

        // Provide specific error guidance
        if (errorType === "cache") {
          console.log("💡 This appears to be an npm cache issue. You can try:");
          console.log("   npm cache clean --force");
          console.log("   Then run the command again");
        } else if (errorType === "network") {
          console.log("💡 This appears to be a network issue. You can try:");
          console.log("   Check your internet connection");
          console.log("   Try again later");
        }
        return false;
      } else {
        console.log(`⚠️  Attempt ${i + 1} failed (${errorType} error)`);

        // Handle different error types
        if (errorType === "cache" && !cacheCleared) {
          console.log("🧹 Detected npm cache error, clearing cache before retry...");
          if (clearNpmCache()) {
            cacheCleared = true;
            // Don't wait after cache clear, retry immediately
            continue;
          }
        } else if (errorType === "network") {
          console.log("🌐 Network error detected, waiting longer before retry...");
          execSync("sleep 5", { stdio: "ignore" });
        } else {
          console.log("⏳ Waiting before retry...");
          execSync("sleep 2", { stdio: "ignore" });
        }
      }
    }
  }
}

async function installPackagesWithConfirmation(packageList, individual = false) {
  console.log("🔍 Checking package versions...");

  // Check which packages are already installed and need updates
  const installedPackages = [];
  const newPackages = [];
  const upToDatePackages = [];

  for (const pkg of packageList) {
    const name = Object.keys(packages).find((key) => packages[key] === pkg);

    if (isPackageInstalled(pkg)) {
      const localVersion = getLocalPackageVersion(pkg);
      const remoteVersion = getRemotePackageVersion(pkg);

      if (localVersion && remoteVersion) {
        const comparison = compareVersions(localVersion, remoteVersion);
        if (comparison < 0) {
          console.log(`📦 ${name}: ${localVersion} → ${remoteVersion} (update available)`);
          installedPackages.push(pkg);
        } else {
          console.log(`✅ ${name}: ${localVersion} (up to date)`);
          upToDatePackages.push(pkg);
        }
      } else {
        console.log(`⚠️  ${name}: Could not check version, will update`);
        installedPackages.push(pkg);
      }
    } else {
      const remoteVersion = getRemotePackageVersion(pkg);
      console.log(`📦 ${name}: not installed (latest: ${remoteVersion || "unknown"})`);
      newPackages.push(pkg);
    }
  }

  // Show summary
  if (upToDatePackages.length > 0) {
    console.log(`\n✅ Already up to date (${upToDatePackages.length} packages):`);
    upToDatePackages.forEach((pkg) => {
      const name = Object.keys(packages).find((key) => packages[key] === pkg);
      console.log(`   - ${name}`);
    });
  }

  if (installedPackages.length > 0) {
    console.log(`\n🔄 Packages with updates available (${installedPackages.length} packages):`);
    installedPackages.forEach((pkg) => {
      const name = Object.keys(packages).find((key) => packages[key] === pkg);
      console.log(`   - ${name} (${pkg})`);
    });
  }

  if (newPackages.length > 0) {
    console.log(`\n📦 New packages to install (${newPackages.length} packages):`);
    newPackages.forEach((pkg) => {
      const name = Object.keys(packages).find((key) => packages[key] === pkg);
      console.log(`   - ${name} (${pkg})`);
    });

    const answer = await askUser("\n❓ Do you want to install the new packages? (y/N): ");

    if (answer !== "y" && answer !== "yes") {
      console.log("❌ Installation of new packages cancelled by user.");
      newPackages.length = 0; // Clear new packages array
    }
  }

  // Determine what to install
  const packagesToInstall = [...installedPackages, ...newPackages];

  if (packagesToInstall.length === 0) {
    if (upToDatePackages.length > 0) {
      console.log("\n🎉 All packages are up to date! No updates needed.");
    } else {
      console.log("\nℹ️  No packages to install or update.");
    }
    return;
  }

  // Show what will be updated/installed
  if (installedPackages.length > 0 || newPackages.length > 0) {
    console.log(`\n🚀 Processing ${packagesToInstall.length} package(s)...`);
    await installPackages(packagesToInstall, individual);
  }
}

async function installPackages(packageList, individual = false) {
  if (!individual && packageList.length > 1) {
    // Try installing all at once first
    const bulkCmd = `npm install -g ${packageList.join(" ")}`;
    if (runWithRetry(bulkCmd, 1)) {
      console.log("✅ All packages installed successfully!");
      return;
    }
    console.log("⚠️  Bulk installation failed, trying individual installations...");
  }

  // Install packages individually
  let successCount = 0;
  let failedPackages = [];
  let cacheErrorsFound = false;

  for (const pkg of packageList) {
    const name = Object.keys(packages).find((key) => packages[key] === pkg) || pkg;
    console.log(`\n📦 Installing ${name} (${pkg})...`);

    if (runWithRetry(`npm install -g ${pkg}`, 2)) {
      console.log(`✅ ${name} installed successfully`);
      successCount++;
    } else {
      console.log(`❌ ${name} failed to install`);
      failedPackages.push({ pkg, name });

      // Check if we encountered cache errors
      if (!cacheErrorsFound) {
        cacheErrorsFound = true;
      }
    }
  }

  console.log(`\n📊 Installation Summary:`);
  console.log(`✅ Successfully installed: ${successCount}/${packageList.length} packages`);

  if (failedPackages.length > 0) {
    console.log(`❌ Failed packages: ${failedPackages.map((f) => f.name).join(", ")}`);

    if (cacheErrorsFound) {
      console.log(`\n🔧 Troubleshooting failed installations:`);
      console.log(`   1. Clear npm cache: npm cache clean --force`);
      console.log(`   2. Clear npm global cache: rm -rf ~/.npm`);
      console.log(`   3. Try installing manually:`);
    } else {
      console.log(`\n💡 Try running these manually:`);
    }

    failedPackages.forEach(({ pkg, name }) => {
      console.log(`   npm install -g ${pkg}  # ${name}`);
    });

    if (successCount > 0) {
      console.log(`\n✨ Good news: ${successCount} package(s) were installed successfully!`);
    }
  }
}

const arg = process.argv[2] || "all";

async function main() {
  console.log(`
 _     ____  ____  ____ _____ _____      ____  _      _____ ____  ____  _     ____ 
/ \\ /\\/  __\\/  _ \\/  _ Y__ __Y  __/     /  _ \\/ \\    /__ __Y  _ \\/  _ \\/ \\   / ___\\
| | |||  \\/|| | \\|| / \\| / \\ |  \\ _____ | / \\|| |_____ / \\ | / \\|| / \\|| |   |    \\
| \\_/||  __/| |_/|| |-|| | | |  /_\\____\\| |-||| |\\____\\| | | \\_/|| \\_/|| |_/\\\\___ |
\\____/\\_/   \\____/\\_/ \\| \\_/ \\____\\     \\_/ \\|\\_/      \\_/ \\____/\\____/\\____/\\____/
`);
  console.log();

  if (arg === "all") {
    console.log("📦 Updating all AI tools...");
    await installPackagesWithConfirmation(Object.values(packages));
  } else if (arg === "check") {
    console.log("🔎 Checking installed versions and updates...");
    console.log();

    for (const [name, bin] of Object.entries(binaries)) {
      const pkg = packages[name];
      const binaryVersion = getBinaryVersion(bin);
      const localVersion = getLocalPackageVersion(pkg);
      const displayVersion = binaryVersion || localVersion;

      if (displayVersion) {
        const remoteVersion = getRemotePackageVersion(pkg);

        if (localVersion && remoteVersion) {
          const comparison = compareVersions(localVersion, remoteVersion);
          if (comparison < 0) {
            console.log(`${name}: ${displayVersion} → ${remoteVersion} available ⬆️`);
          } else {
            console.log(`${name}: ${displayVersion} ✅`);
          }
        } else {
          console.log(`${name}: ${displayVersion} (unable to check for updates)`);
        }
      } else {
        const remoteVersion = getRemotePackageVersion(pkg);
        console.log(`${name}: not installed (latest: ${remoteVersion || "unknown"}) ❌`);
      }
    }
  } else if (packages[arg]) {
    console.log(`📦 Updating ${arg}...`);
    await installPackagesWithConfirmation([packages[arg]], true);
  } else {
    console.log("Usage: update-ai-tools [all|claude|gemini|copilot|codex|kilocode|check]");
    console.log("\nOptions:");
    console.log("  all     - Update all AI tools (with confirmation for new installs)");
    console.log("  claude  - Update Claude CLI only");
    console.log("  gemini  - Update Gemini CLI only");
    console.log("  copilot - Update GitHub Copilot CLI only");
    console.log("  codex   - Update Codex CLI only");
    console.log("  kilocode - Update Kilo Code CLI only");
    console.log("  check   - Check installed versions");
    process.exit(1);
  }
}

main().catch(console.error);

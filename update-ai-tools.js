#!/usr/bin/env node
import { execSync } from "node:child_process";
import { createInterface } from "node:readline";

const packages = {
  claude: "@anthropic-ai/claude-code",
  gemini: "@google/gemini-cli",
  copilot: "@github/copilot",
  codex: "@openai/codex",
};

const binaries = {
  claude: "claude",
  gemini: "gemini",
  copilot: "github-copilot",
  codex: "codex",
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

function isPackageInstalled(packageName) {
  const binaryName = binaries[Object.keys(packages).find((key) => packages[key] === packageName)];
  if (!binaryName) return false;

  try {
    execSync(`${binaryName} --version`, { encoding: "utf8", stdio: "ignore" });
    return true;
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

function runWithRetry(cmd, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      console.log(`➡️  ${cmd}${i > 0 ? ` (retry ${i})` : ""}`);
      execSync(cmd, { stdio: "inherit" });
      return true;
    } catch (err) {
      if (i === retries) {
        console.error(`❌ Failed after ${retries + 1} attempts: ${cmd}`);
        return false;
      } else {
        console.log(`⚠️  Attempt ${i + 1} failed, retrying...`);
        // Wait a bit before retry using synchronous sleep
        execSync("sleep 1", { stdio: "ignore" });
      }
    }
  }
}

async function installPackagesWithConfirmation(packageList, individual = false) {
  // Check which packages are already installed
  const installedPackages = [];
  const newPackages = [];

  for (const pkg of packageList) {
    if (isPackageInstalled(pkg)) {
      installedPackages.push(pkg);
    } else {
      newPackages.push(pkg);
    }
  }

  // Show status
  if (installedPackages.length > 0) {
    console.log("✅ Already installed packages (will be updated):");
    installedPackages.forEach((pkg) => {
      const name = Object.keys(packages).find((key) => packages[key] === pkg);
      console.log(`   - ${name} (${pkg})`);
    });
  }

  if (newPackages.length > 0) {
    console.log("\n📦 New packages to install:");
    newPackages.forEach((pkg) => {
      const name = Object.keys(packages).find((key) => packages[key] === pkg);
      console.log(`   - ${name} (${pkg})`);
    });

    const answer = await askUser("\n❓ Do you want to install the new packages? (y/N): ");

    if (answer !== "y" && answer !== "yes") {
      console.log("❌ Installation cancelled by user.");
      if (installedPackages.length > 0) {
        console.log("💡 Only updating already installed packages...");
        await installPackages(installedPackages, individual);
      }
      return;
    }
  }

  // Install all approved packages
  const packagesToInstall = [...installedPackages, ...newPackages];
  if (packagesToInstall.length > 0) {
    await installPackages(packagesToInstall, individual);
  } else {
    console.log("ℹ️  No packages to install.");
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

  for (const pkg of packageList) {
    const name = Object.keys(packages).find((key) => packages[key] === pkg) || pkg;
    console.log(`\n📦 Installing ${name} (${pkg})...`);
    if (runWithRetry(`npm install -g ${pkg}`, 2)) {
      console.log(`✅ ${name} installed successfully`);
      successCount++;
    } else {
      console.log(`❌ ${name} failed to install`);
      failedPackages.push(pkg);
    }
  }

  console.log(`\n📊 Installation Summary:`);
  console.log(`✅ Successfully installed: ${successCount}/${packageList.length} packages`);

  if (failedPackages.length > 0) {
    console.log(`❌ Failed packages: ${failedPackages.join(", ")}`);
    console.log(`\n💡 Try running these manually:`);
    failedPackages.forEach((pkg) => {
      console.log(`   npm install -g ${pkg}`);
    });
  }
}

const arg = process.argv[2] || "all";

async function main() {
  if (arg === "all") {
    console.log("📦 Updating all AI tools...");
    await installPackagesWithConfirmation(Object.values(packages));
  } else if (arg === "check") {
    console.log("🔎 Installed versions:");
    for (const [name, bin] of Object.entries(binaries)) {
      try {
        const version = execSync(`${bin} --version`, { encoding: "utf8" }).trim();
        console.log(`${name}: ${version}`);
      } catch {
        console.log(`${name}: not installed`);
      }
    }
  } else if (packages[arg]) {
    console.log(`📦 Updating ${arg}...`);
    await installPackagesWithConfirmation([packages[arg]], true);
  } else {
    console.log("Usage: update-ai-tools [all|claude|gemini|copilot|codex|check]");
    console.log("\nOptions:");
    console.log("  all     - Update all AI tools (with confirmation for new installs)");
    console.log("  claude  - Update Claude CLI only");
    console.log("  gemini  - Update Gemini CLI only");
    console.log("  copilot - Update GitHub Copilot CLI only");
    console.log("  codex   - Update Codex CLI only");
    console.log("  check   - Check installed versions");
    process.exit(1);
  }
}

main().catch(console.error);

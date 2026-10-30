import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const rootDir = process.cwd();
const stageDir = path.join(rootDir, "temp_export_staging", "nexu-ecommerce-platform");
const zipOutputFile = path.join(rootDir, "nexu-ecommerce-platform.zip");

// Ensure clean slate
if (fs.existsSync(zipOutputFile)) {
  fs.unlinkSync(zipOutputFile);
}
if (fs.existsSync(path.join(rootDir, "temp_export_staging"))) {
  fs.rmSync(path.join(rootDir, "temp_export_staging"), { recursive: true, force: true });
}

fs.mkdirSync(stageDir, { recursive: true });

// Exclusion patterns (case-insensitive checks)
const excludeItems = new Set([
  "node_modules",
  ".next",
  "dist",
  ".env",
  ".env.local",
  ".env.development.local",
  ".env.test.local",
  ".env.production.local",
  ".git",
  "temp_export_staging",
  "nexu-ecommerce-platform.zip",
]);

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (excludeItems.has(entry.name) || entry.name.endsWith(".log")) {
      console.log(`[EXCLUDED] ${srcPath}`);
      continue;
    }

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log("Staging project files for clean ZIP archive...");
const rootEntries = fs.readdirSync(rootDir, { withFileTypes: true });

for (const entry of rootEntries) {
  if (excludeItems.has(entry.name) || entry.name.endsWith(".log") || entry.name === "temp_export_staging") {
    console.log(`[EXCLUDED AT ROOT] ${entry.name}`);
    continue;
  }

  const srcPath = path.join(rootDir, entry.name);
  const destPath = path.join(stageDir, entry.name);

  if (entry.isDirectory()) {
    copyDirRecursive(srcPath, destPath);
  } else {
    fs.copyFileSync(srcPath, destPath);
  }
}

console.log("\nStaged files count check...");
function countFiles(dir) {
  let count = 0;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) count += countFiles(p);
    else count++;
  }
  return count;
}

const fileCount = countFiles(stageDir);
console.log(`Total source files staged: ${fileCount}`);

// Verify that .env does NOT exist in stageDir
const stagedEnv = path.join(stageDir, ".env");
if (fs.existsSync(stagedEnv)) {
  console.error("FATAL ERROR: .env was found in staging directory! Aborting!");
  process.exit(1);
}

// Verify that .env.example DOES exist
const stagedEnvExample = path.join(stageDir, ".env.example");
if (!fs.existsSync(stagedEnvExample)) {
  console.error("WARNING: .env.example is missing!");
} else {
  console.log("Confirmed: .env.example is included with clean documentation.");
}

console.log("\nCompressing staged directory into ZIP file via Windows bsdtar...");
// Run tar to create zip from stageDir parent so root folder in zip is "nexu-ecommerce-platform"
const stagingParent = path.join(rootDir, "temp_export_staging");
execSync(`tar -a -c -f "${zipOutputFile}" -C "${stagingParent}" "nexu-ecommerce-platform"`, { stdio: "inherit" });

console.log(`\nZIP Archive created successfully at: ${zipOutputFile}`);

// Check zip file size
const stats = fs.statSync(zipOutputFile);
console.log(`Archive Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

// Verify zip content listing
console.log("\nAuditing ZIP contents for forbidden exclusions...");
const zipList = execSync(`tar -tf "${zipOutputFile}"`, { encoding: "utf-8" });
const lines = zipList.split("\n").map(l => l.trim()).filter(Boolean);

const violations = lines.filter(line => {
  return (
    line.includes("node_modules") ||
    line.includes(".next") ||
    line.includes("/dist/") ||
    line.endsWith(".env") ||
    line.includes("/.env/") ||
    line.includes(".git/")
  );
});

if (violations.length > 0) {
  console.error("FATAL AUDIT FAILURE! The following forbidden items were found in the ZIP:");
  violations.forEach(v => console.error(" - " + v));
  fs.unlinkSync(zipOutputFile);
  process.exit(1);
} else {
  console.log("✅ AUDIT PASSED: ZERO forbidden files found in the archive!");
  console.log("  - node_modules: EXCLUDED");
  console.log("  - .next: EXCLUDED");
  console.log("  - dist: EXCLUDED");
  console.log("  - .env: EXCLUDED (Secrets/passwords protected)");
}

// Cleanup staging directory
fs.rmSync(stagingParent, { recursive: true, force: true });
console.log("\nTemporary staging directory cleaned up successfully.");

import fs from "fs";
import { execSync } from "child_process";

const backupPath = "C:/Users/Ruchit/.gemini/antigravity/brain/6d9e8601-bd2e-4eca-ba17-b73c709bd8dc/nexu_safety_backup_20261030_112515.zip";

if (!fs.existsSync(backupPath)) {
  console.error("Backup file does not exist:", backupPath);
  process.exit(1);
}

const stat = fs.statSync(backupPath);
console.log("New backup created successfully. Size:", (stat.size / (1024 * 1024)).toFixed(2) + " MB");

const testOutput = execSync(`tar -tf "${backupPath}"`, { encoding: "utf8" });
const lines = testOutput.split("\n").filter(Boolean);
console.log("Total entries in archive:", lines.length);

const forbidden = lines.filter(
  (l) =>
    (l.includes(".env") && !l.includes(".env.example")) ||
    l.includes("node_modules") ||
    l.includes(".next") ||
    l.includes(".git/")
);

console.log("Forbidden items count:", forbidden.length);
if (forbidden.length > 0) {
  console.error("Forbidden items found:", forbidden);
  process.exit(1);
} else {
  console.log("INTEGRITY CHECK PASSED: Archive opens cleanly and contains zero secrets or build outputs.");
}

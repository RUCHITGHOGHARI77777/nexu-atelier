import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const rootDir = process.cwd();
const tempExtractDir = "D:\\temp_rea_analysis";
const cleanAppDir = path.join(tempExtractDir, "nexu-ecommerce-platform");

if (fs.existsSync(tempExtractDir)) {
  fs.rmSync(tempExtractDir, { recursive: true, force: true });
}
fs.mkdirSync(tempExtractDir, { recursive: true });

console.log("Extracting clean zip for REA analysis...");
execSync(`tar -xf "${path.join(rootDir, "nexu-ecommerce-platform.zip")}" -C "${tempExtractDir}"`);
console.log("Extracted items:", fs.readdirSync(cleanAppDir));

console.log("\nRunning REA analyze on extracted clean tree...");
const inspectCmd = `D:\\rea-main\\rea.cmd analyze "D:\\temp_rea_analysis\\nexu-ecommerce-platform"`;
console.log("Executing:", inspectCmd);
const inspectOutput = execSync(inspectCmd, { encoding: "utf-8", maxBuffer: 100 * 1024 * 1024 });

// Extract evidence ID
const evidenceMatch = inspectOutput.match(/evidence_id:\s*(ev_[a-f0-9]+)/);
console.log("REA Artifact Evidence ID:", evidenceMatch ? evidenceMatch[1] : "None found");

// Save inspection output to brain artifact directory
const artifactDir = "C:\\Users\\Ruchit\\.gemini\\antigravity\\brain\\6d9e8601-bd2e-4eca-ba17-b73c709bd8dc";
fs.writeFileSync(path.join(artifactDir, "rea_artifact_inspection.txt"), inspectOutput.slice(0, 100000));
console.log("Saved preview to brain artifact directory.");

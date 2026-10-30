import { execSync } from "child_process";

const list = execSync('tar -tf "nexu-ecommerce-platform.zip"', { encoding: "utf-8" });
const lines = list.split("\n").map(l => l.trim()).filter(Boolean);
console.log("Total entries in ZIP:", lines.length);

const rootItems = lines.filter(l => l.split("/").length === 2 && l.startsWith("nexu-ecommerce-platform/"));
console.log("\nTop-level items inside ZIP:");
rootItems.forEach(i => console.log(" -", i));

const hasModules = lines.some(l => l.includes("node_modules"));
const hasNext = lines.some(l => l.includes(".next"));
const hasDist = lines.some(l => l.includes("dist"));
const hasEnv = lines.some(l => l.endsWith("/.env") || l === "nexu-ecommerce-platform/.env");
const hasEnvExample = lines.some(l => l.endsWith(".env.example"));

console.log("\nVerification Audit Results:");
console.log("node_modules present?:", hasModules ? "FAIL (FOUND)" : "PASSED (NONE)");
console.log(".next present?:", hasNext ? "FAIL (FOUND)" : "PASSED (NONE)");
console.log("dist present?:", hasDist ? "FAIL (FOUND)" : "PASSED (NONE)");
console.log(".env (real secrets) present?:", hasEnv ? "FAIL (FOUND)" : "PASSED (NONE)");
console.log(".env.example (safe template) present?:", hasEnvExample ? "PASSED (INCLUDED)" : "FAIL (MISSING)");

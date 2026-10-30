import fs from "fs";
import path from "path";

const raw = fs.readFileSync("D:\\temp_rea_analysis\\rea_analysis_full.txt");
let text = "";
if (raw[0] === 0xff && raw[1] === 0xfe) {
  text = raw.toString("utf16le");
} else {
  text = raw.toString("utf8");
}

console.log("Analyzing decoded REA Evidence (length:", text.length, ")...");

// Extract key fields
const lines = text.split("\n");
const routes = new Set();
const apiRoutes = new Set();
const components = new Set();
const serverServices = new Set();
const models = new Set();

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.includes("src/app/") && trimmed.includes("page.tsx")) {
    const match = trimmed.match(/src\/app\/([^"]+)\/page\.tsx/);
    if (match) routes.add("/" + match[1]);
    else if (trimmed.includes("src/app/page.tsx")) routes.add("/");
  }
  if (trimmed.includes("src/app/api/") && trimmed.includes("route.ts")) {
    const match = trimmed.match(/src\/app\/api\/([^"]+)\/route\.ts/);
    if (match) apiRoutes.add("/api/" + match[1]);
  }
  if (trimmed.includes("src/components/")) {
    const match = trimmed.match(/src\/components\/([^"]+\.tsx)/);
    if (match) components.add(match[1]);
  }
  if (trimmed.includes("src/lib/server/")) {
    const match = trimmed.match(/src\/lib\/server\/([^"]+\.ts)/);
    if (match) serverServices.add(match[1]);
  }
}

console.log("Found Public/App Routes:", routes.size);
console.log("Found API Endpoints:", apiRoutes.size);
console.log("Found React Components:", components.size);
console.log("Found Server Services:", serverServices.size);

const summary = {
  evidence_id: "ev_c4f03ef7e8bf65902a9dd7563de17d7b6008c6c7042bf0576c11786ff5dba782",
  provider: "rea-javascript-application",
  total_lines_analyzed: lines.length,
  routes: Array.from(routes).sort(),
  api_endpoints: Array.from(apiRoutes).sort(),
  components: Array.from(components).sort(),
  server_services: Array.from(serverServices).sort(),
};

const artifactDir = "C:\\Users\\Ruchit\\.gemini\\antigravity\\brain\\6d9e8601-bd2e-4eca-ba17-b73c709bd8dc";
fs.writeFileSync(path.join(artifactDir, "rea_extracted_architecture.json"), JSON.stringify(summary, null, 2));
console.log("Wrote architecture summary to brain artifact directory.");

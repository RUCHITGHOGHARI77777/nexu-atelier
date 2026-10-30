import fs from "fs";
import path from "path";

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  let insideLink = false;
  let insideButton = false;
  let linkLine = 0;
  let buttonLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];

    if (/<Link\b/.test(l)) {
      if (insideButton) {
        console.log(`NESTING: <Link> inside <Button> at ${filePath}:${i + 1} (Button at L${buttonLine})`);
      }
      insideLink = true;
      linkLine = i + 1;
    }

    if (/<(Button|button)\b/.test(l)) {
      if (insideLink) {
        console.log(`NESTING: <button/Button> inside <Link> at ${filePath}:${i + 1} (Link at L${linkLine})`);
      }
      insideButton = true;
      buttonLine = i + 1;
    }

    if (/<\/Link>/.test(l)) {
      insideLink = false;
    }
    if (/<\/(Button|button)>/.test(l)) {
      insideButton = false;
    }
  }
}

function scanDir(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    if (it.name === "node_modules" || it.name === ".next" || it.name === ".git") continue;
    const full = path.join(dir, it.name);
    if (it.isDirectory()) scanDir(full);
    else if (it.name.endsWith(".tsx") || it.name.endsWith(".jsx")) scanFile(full);
  }
}

console.log("Scanning src directory for nested interactive elements...");
scanDir("src");
console.log("Scan completed.");

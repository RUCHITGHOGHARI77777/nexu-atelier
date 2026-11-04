import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const env = fs.readFileSync(".env", "utf8");
const match = env.match(/DATABASE_URL=["']?postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^"?\s]+)/);

if (!match) {
  console.error("Could not parse DATABASE_URL");
  process.exit(1);
}

const [, user, password, host, port, dbname] = match;

const backupsDir = path.resolve("backups");
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupFile = path.join(backupsDir, `nexu_db_backup_${timestamp}.sql`);

console.log(`Creating database backup for database "${dbname}" on ${host}:${port}...`);

const pgDumpPath = "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe";

try {
  execSync(
    `"${pgDumpPath}" -h ${host} -p ${port} -U ${user} -d ${dbname} -F p -f "${backupFile}"`,
    {
      env: { ...process.env, PGPASSWORD: password },
      stdio: "inherit",
    }
  );

  const stats = fs.statSync(backupFile);
  console.log(`Backup completed successfully!`);
  console.log(`File: ${backupFile}`);
  console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size} bytes)`);
} catch (err) {
  console.error("Backup failed:", err.message);
  process.exit(1);
}

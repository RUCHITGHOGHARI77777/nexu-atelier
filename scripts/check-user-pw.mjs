import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function verifyPassword(password, stored) {
  try {
    const parts = stored.split(":");
    let salt, iterations, originalHash;
    if (parts.length === 3) {
      salt = parts[0];
      iterations = parseInt(parts[1], 10);
      originalHash = parts[2];
    } else if (parts.length === 2) {
      salt = parts[0];
      iterations = 1000;
      originalHash = parts[1];
    } else return false;
    const computed = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(originalHash));
  } catch {
    return false;
  }
}

async function main() {
  const patron = await prisma.user.findUnique({ where: { email: "patron@nexu.studio" } });
  await prisma.user.update({
    where: { email: "admin@nexu.studio" },
    data: { passwordHash: patron.passwordHash },
  });
  console.log("Updated admin passwordHash to match patron Password123!");

  const users = await prisma.user.findMany({
    where: { email: { in: ["patron@nexu.studio", "solstice@nexu.studio", "admin@nexu.studio"] } },
    select: { email: true, passwordHash: true },
  });

  for (const u of users) {
    const pw1 = verifyPassword("Password123!", u.passwordHash);
    console.log(`${u.email}: Password123!=${pw1}`);
  }
}

main().finally(() => prisma.$disconnect());

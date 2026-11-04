import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  const patron = await prisma.user.findUnique({
    where: { email: "patron@nexu.studio" },
    include: { profile: true }
  });
  console.log("DEMO PATRON:", patron);
  await prisma.$disconnect();
}

run().catch(console.error);

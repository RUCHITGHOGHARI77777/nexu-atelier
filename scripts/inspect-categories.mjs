import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany();
  console.log("Categories in DB:");
  for (const c of cats) {
    console.log(`- ID: ${c.id} | Slug: ${c.slug} | Name: ${c.name}`);
  }
  await prisma.$disconnect();
}

main().catch(console.error);

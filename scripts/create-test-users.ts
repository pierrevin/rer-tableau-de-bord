import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

async function main() {
  const password = "rer2025";
  const passwordHash = await bcrypt.hash(password, 10);

  const users = [
    { email: "admin@rer.local", role: "admin" },
    { email: "relecteur@rer.local", role: "relecteur" },
    { email: "auteur@rer.local", role: "auteur" },
  ] as const;

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash, role: u.role },
      create: {
        email: u.email,
        passwordHash,
        role: u.role,
      },
    });
    // eslint-disable-next-line no-console
    console.log(`User ready: ${user.email} (${user.role})`);
  }
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


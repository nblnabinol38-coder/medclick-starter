import { PrismaClient, UserRole } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function hashPassword(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function main() {
  const email = "medico.teste@medclick.local";

  const doctor = await prisma.user.upsert({
    where: {
      email,
    },
    update: {
      name: "Dr. Flávia Nunes Maruyama",
      role: UserRole.DOCTOR,
      active: true,
      passwordHash: hashPassword("MedClick@123"),
      doctorProfile: {
        upsert: {
          update: {
            crm: "216997",
            crmState: "RJ",
            specialty: "Clínica Médica",
            phone: "21999999999",
            authorizedToSign: true,
            active: true,
          },
          create: {
            crm: "216997",
            crmState: "RJ",
            specialty: "Clínica Médica",
            phone: "21999999999",
            authorizedToSign: true,
            active: true,
          },
        },
      },
    },
    create: {
      name: "Dr. Flávia Nunes Maruyama",
      email,
      passwordHash: hashPassword("MedClick@123"),
      role: UserRole.DOCTOR,
      active: true,
      doctorProfile: {
        create: {
          crm: "216997",
          crmState: "RJ",
          specialty: "Clínica Médica",
          phone: "21999999999",
          authorizedToSign: true,
          active: true,
        },
      },
    },
    include: {
      doctorProfile: true,
    },
  });

  console.log("Médico de teste pronto:");
  console.log({
    id: doctor.id,
    name: doctor.name,
    email: doctor.email,
    crm: doctor.doctorProfile?.crm,
    crmState: doctor.doctorProfile?.crmState,
    specialty: doctor.doctorProfile?.specialty,
    authorizedToSign: doctor.doctorProfile?.authorizedToSign,
    active: doctor.active,
  });
}

main()
  .catch((error) => {
    console.error("Erro ao criar médico de teste:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
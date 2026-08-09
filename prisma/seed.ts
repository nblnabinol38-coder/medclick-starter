import {
  AccountApprovalStatus,
  PrismaClient,
  UserRole,
} from "@prisma/client";

import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@medclick.local";
  const adminPassword = "MedClick@123";
  const adminPasswordHash = await hashPassword(adminPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Administrador MedClick",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      active: true,
      approvalStatus: AccountApprovalStatus.APPROVED,
      approvedAt: new Date(),
      rejectedAt: null,
    },
    create: {
      name: "Administrador MedClick",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      active: true,
      approvalStatus: AccountApprovalStatus.APPROVED,
      approvedAt: new Date(),
      rejectedAt: null,
    },
  });

  const doctorEmail = "medico.teste@medclick.local";
  const doctorPasswordHash = await hashPassword("MedClick@123");

  const doctor = await prisma.user.upsert({
    where: { email: doctorEmail },
    update: {
      name: "Dra. Flávia Nunes Maruyama",
      passwordHash: doctorPasswordHash,
      role: UserRole.DOCTOR,
      active: true,
      approvalStatus: AccountApprovalStatus.APPROVED,
      approvedAt: new Date(),
      rejectedAt: null,
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
      name: "Dra. Flávia Nunes Maruyama",
      email: doctorEmail,
      passwordHash: doctorPasswordHash,
      role: UserRole.DOCTOR,
      active: true,
      approvalStatus: AccountApprovalStatus.APPROVED,
      approvedAt: new Date(),
      rejectedAt: null,
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
    include: { doctorProfile: true },
  });

  console.log("ADMINISTRADOR MEDCLICK PRONTO", {
    email: admin.email,
    role: admin.role,
    active: admin.active,
    approvalStatus: admin.approvalStatus,
  });
  console.log("MÉDICO DE TESTE PRONTO", {
    email: doctor.email,
    role: doctor.role,
    active: doctor.active,
    approvalStatus: doctor.approvalStatus,
  });
  console.log("Seed do MedClick concluído com sucesso.");
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed do MedClick:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

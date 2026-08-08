import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const doctors = await prisma.user.findMany({
      where: {
        role: UserRole.DOCTOR,
        active: true,
        doctorProfile: {
          is: {
            active: true,
            authorizedToSign: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        doctorProfile: {
          select: {
            crm: true,
            crmState: true,
            specialty: true,
            authorizedToSign: true,
            active: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      doctors,
    });
  } catch (error) {
    console.error("Erro ao consultar médicos:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Não foi possível carregar os médicos disponíveis.",
      },
      {
        status: 500,
      },
    );
  }
}
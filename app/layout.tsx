import type { Metadata } from "next";
import type { ReactNode } from "react";

import WhatsAppUltraButton from "@/components/WhatsAppUltraButton";
import MedClickAtmosphere from "@/components/MedClickAtmosphere";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedClick — Atendimento médico digital",
  description:
    "Plataforma MedClick para solicitação e acompanhamento de atendimento e documentos médicos.",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body>
        <MedClickAtmosphere />
        {children}
        <WhatsAppUltraButton />
      </body>
    </html>
  );
}

import type { ReactNode } from "react";

import AdminSoundAlerts from "@/components/admin/AdminSoundAlerts";

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <AdminSoundAlerts />
      {children}
    </>
  );
}

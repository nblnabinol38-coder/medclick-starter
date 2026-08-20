import type { ReactNode } from "react";

import AdminAccessGate from "./AdminAccessGate";

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <AdminAccessGate>{children}</AdminAccessGate>;
}

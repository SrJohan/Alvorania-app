import type { ReactNode } from "react";
import { StaffShell } from "@/components/asesor/staff-shell";

export default function AsesorLayout({ children }: { children: ReactNode }) {
  return <StaffShell>{children}</StaffShell>;
}

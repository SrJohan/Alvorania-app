import { Suspense, type ReactNode } from "react";
import { StaffShell } from "@/components/asesor/staff-shell";

// StaffShell lee la ruta (usePathname); bajo /asesor/[id] el id no se conoce al compilar y sin <Suspense> la compilación falla.
export default function AsesorLayout({ children }: { children: ReactNode }) {
  return <Suspense><StaffShell>{children}</StaffShell></Suspense>;
}

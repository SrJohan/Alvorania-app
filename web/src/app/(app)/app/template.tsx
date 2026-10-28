import type { ReactNode } from "react";
import { DirectionalTransition } from "@/components/site/directional-transition";

// Una plantilla se vuelve a montar en cada paso del área privada, así que su transición sí entra y sale (un layout no).
// Con tipo (nav-forward / nav-back) la página desliza; sin tipo, fundido.
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <DirectionalTransition lateral>{children}</DirectionalTransition>;
}

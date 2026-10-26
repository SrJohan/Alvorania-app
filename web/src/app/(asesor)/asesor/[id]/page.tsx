import { Suspense } from "react";
import { CaseDetail } from "@/components/asesor/case-detail";
import { Skeleton } from "@/components/ui/display";

// El detalle lee el id de la URL en el cliente; con Cache Components eso tiene que ir dentro de <Suspense>.
export default function AsesorCasoPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl space-y-4 p-4 md:p-8" aria-busy="true"><Skeleton className="h-10 w-64" /><Skeleton className="h-48 w-full" /></div>}>
      <CaseDetail />
    </Suspense>
  );
}

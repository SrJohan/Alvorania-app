import type { Answers, Calculation } from "@/lib/tax/engine";

export type CaseStatus =
  | "borrador" | "calculado" | "pagado" | "en_revision"
  | "pendiente_aprobacion" | "presentado" | "cerrado" | "cancelado";

export type PlanCode = "PRO" | "LIVE" | "FULL";

export type Plan = {
  code: PlanCode;
  name: string;
  priceCents: number;
  period: "year";
  blurb: string;
  features: string[];
  recommended?: boolean;
  chat: boolean;
};

export type Message = {
  id: string;
  from: "user" | "advisor" | "system";
  body: string;
  at: string; // ISO UTC
};

export type DocumentRow = { id: string; kind: "carta_hacienda" | "justificante" | "otro"; name: string; sizeBytes: number; at: string };

export type Review = {
  advisorName: string;
  advisorApprovedAt: string | null;
  userApprovedAt: string | null;
  notes: string;
};

export type Subscription = { planCode: PlanCode; renewsAt: string; autoRenew: boolean; canceledAt: string | null };

export type CaseRow = {
  id: string;
  status: CaseStatus;
  taxYear: number;
  answers: Answers;
  questionnaireStep: number;
  dataSource: "manual" | "documento" | null;
  calculation: Calculation | null;
  review: Review | null;
  aeatReference: string | null;
  submittedAt: string | null;
  createdAt: string;
};

export type DemoState = {
  user: { email: string; fullName: string } | null;
  consents: { terms: boolean; privacy: boolean; aeatDataAccess: boolean; mandate: boolean };
  case: CaseRow | null;
  planCode: PlanCode | null;
  messages: Message[];
  documents: DocumentRow[];
  subscription: Subscription | null;
  requerimientoStatus: "ninguno" | "analizado" | "borrador_listo" | "aprobado";
};

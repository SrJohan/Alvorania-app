"use client";
// Punto único de acceso a datos para las pantallas. NEXT_PUBLIC_DATA_MODE decide si hablan con la demo local o con el backend real.
import { isLive } from "@/lib/env";
import { isForal } from "@/lib/tax/rules";
import * as demo from "./demo-api";
import * as live from "./live-api";

export { isForal };

const impl = isLive ? live : demo;

export const signIn = impl.signIn;
export const signOut = impl.signOut;
export const recordConsent = impl.recordConsent;
export const createCase = impl.createCase;
export const setDataSource = impl.setDataSource;
export const saveAnswers = impl.saveAnswers;
export const runCalculation = impl.runCalculation;
export const checkout = impl.checkout;
export const sendMessage = impl.sendMessage;
export const userApprove = impl.userApprove;
export const cancelRenewal = impl.cancelRenewal;
export const uploadLetter = impl.uploadLetter;
export const clientResubmit = impl.clientResubmit;
export const downloadDocument = impl.downloadDocument;

/** Carga el estado del servidor (modo live). En demo no hace nada: el estado vive en el navegador. */
export const refreshState = isLive ? live.refreshState : async () => undefined;

// Solo demostración: simulan al asesor. En live el asesor usa /asesor y estas funciones no deben llamarse.
export const demoAdvisorApprove = demo.demoAdvisorApprove;
export const demoAdvisorSubmit = demo.demoAdvisorSubmit;
export const demoAdvisorRequestChanges = demo.demoAdvisorRequestChanges;

// Solo live.
export const openBillingPortal = live.openBillingPortal;
export const exportMyData = live.exportMyData;
export const deleteMyAccount = live.deleteMyAccount;

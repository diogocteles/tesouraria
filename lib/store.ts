import type { Invoice } from "./supabase";

// In-memory store used when Supabase is not configured (local dev / demo)
declare global {
  // eslint-disable-next-line no-var
  var __invoiceStore: Map<string, Invoice> | undefined;
}

function getStore(): Map<string, Invoice> {
  if (!global.__invoiceStore) global.__invoiceStore = new Map();
  return global.__invoiceStore;
}

export function storeInvoice(invoice: Invoice): void {
  getStore().set(invoice.id, invoice);
}

export function getAllInvoices(): Invoice[] {
  return Array.from(getStore().values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getInvoice(id: string): Invoice | undefined {
  return getStore().get(id);
}

export function updateInvoice(id: string, patch: Partial<Invoice>): boolean {
  const existing = getStore().get(id);
  if (!existing) return false;
  getStore().set(id, { ...existing, ...patch });
  return true;
}

import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type Invoice = {
  id: string;
  created_at: string;
  submitter_name: string;
  context: string | null;
  image_url: string;
  vendor_name: string | null;
  nif: string | null;
  invoice_date: string | null;
  total_amount: number | null;
  values_breakdown: { description: string; amount: number }[] | null;
  status: "pending" | "paid";
  paid_at: string | null;
  notes: string | null;
};

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

let _adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_adminClient) {
    _adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _adminClient;
}

// Named export for backwards compat — resolves lazily at call time
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as never)[prop as keyof SupabaseClient];
  },
});

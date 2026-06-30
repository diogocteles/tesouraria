-- Create invoices table
create table if not exists invoices (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now() not null,

  -- Submitted by user
  submitter_name   text not null,
  context          text,
  image_url        text not null,

  -- Extracted by Claude Vision
  vendor_name      text,
  nif              text,
  invoice_date     date,
  total_amount     numeric(10,2),
  values_breakdown jsonb,

  -- Admin status
  status           text default 'pending' not null
                     check (status in ('pending', 'paid')),
  paid_at          timestamptz,
  notes            text
);

-- RLS: enable row-level security
alter table invoices enable row level security;

-- Allow anyone to insert (invoice submission is public)
create policy "Public can insert invoices"
  on invoices for insert
  with check (true);

-- Only service role can select/update (enforced via SUPABASE_SERVICE_ROLE_KEY in API routes)
-- No public select or update policies — all admin reads/writes go through the service role key

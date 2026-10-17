CREATE TABLE public.maintenance_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  service_provider_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  visit_date date NOT NULL,
  service_performed text NOT NULL CHECK (length(btrim(service_performed)) > 0),
  amount_paid numeric(12,2) CHECK (amount_paid IS NULL OR amount_paid >= 0),
  notes text,
  next_service_date date,
  receipt_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX maintenance_visits_provider_idx ON public.maintenance_visits(service_provider_id, visit_date DESC);
CREATE INDEX maintenance_visits_user_idx ON public.maintenance_visits(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_visits TO authenticated;
GRANT ALL ON public.maintenance_visits TO service_role;
ALTER TABLE public.maintenance_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own visits select" ON public.maintenance_visits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own visits insert" ON public.maintenance_visits FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.service_providers sp WHERE sp.id = service_provider_id AND sp.user_id = auth.uid()));
CREATE POLICY "Own visits update" ON public.maintenance_visits FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.service_providers sp WHERE sp.id = service_provider_id AND sp.user_id = auth.uid()));
CREATE POLICY "Own visits delete" ON public.maintenance_visits FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Own receipts select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own receipts insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own receipts update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own receipts delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
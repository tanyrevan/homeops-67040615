CREATE TABLE public.service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  service_type text NOT NULL CHECK (length(btrim(service_type)) > 0),
  phone_or_contact text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX service_providers_user_id_idx ON public.service_providers(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_providers TO authenticated;
GRANT ALL ON public.service_providers TO service_role;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own providers select" ON public.service_providers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own providers insert" ON public.service_providers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own providers update" ON public.service_providers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own providers delete" ON public.service_providers FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TABLE public.stars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  service_provider_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stars_user_provider_unique UNIQUE (user_id, service_provider_id)
);
GRANT SELECT, INSERT, DELETE ON public.stars TO authenticated;
GRANT ALL ON public.stars TO service_role;
ALTER TABLE public.stars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own stars select" ON public.stars FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own stars insert" ON public.stars FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.service_providers sp WHERE sp.id = service_provider_id AND sp.user_id = auth.uid()));
CREATE POLICY "Own stars delete" ON public.stars FOR DELETE TO authenticated USING (auth.uid() = user_id);
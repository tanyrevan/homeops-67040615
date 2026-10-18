CREATE TABLE public.expense_stars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  visit_id uuid REFERENCES public.maintenance_visits(id) ON DELETE CASCADE,
  grocery_id uuid REFERENCES public.grocery_expenses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT expense_stars_one_expense CHECK (num_nonnulls(visit_id, grocery_id) = 1),
  UNIQUE (user_id, visit_id),
  UNIQUE (user_id, grocery_id)
);
GRANT SELECT, INSERT, DELETE ON public.expense_stars TO authenticated;
GRANT ALL ON public.expense_stars TO service_role;
ALTER TABLE public.expense_stars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own expense stars select" ON public.expense_stars FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own expense stars delete" ON public.expense_stars FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own expense stars insert" ON public.expense_stars FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND (
    (visit_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.maintenance_visits v WHERE v.id = visit_id AND v.user_id = auth.uid()))
    OR (grocery_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.grocery_expenses g WHERE g.id = grocery_id AND g.user_id = auth.uid()))
  )
);
COMMENT ON TABLE public.stars IS 'DEPRECATED in Expenses UI: legacy provider-level stars retained; individual transaction stars use public.expense_stars.';
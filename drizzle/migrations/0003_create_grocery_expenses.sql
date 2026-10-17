CREATE TABLE public.grocery_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  purchase_date date NOT NULL,
  store text NOT NULL CHECK (length(btrim(store)) > 0),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  category text,
  notes text,
  receipt_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX grocery_expenses_user_date_idx ON public.grocery_expenses(user_id, purchase_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grocery_expenses TO authenticated;
GRANT ALL ON public.grocery_expenses TO service_role;
ALTER TABLE public.grocery_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own groceries select" ON public.grocery_expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own groceries insert" ON public.grocery_expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own groceries update" ON public.grocery_expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own groceries delete" ON public.grocery_expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);
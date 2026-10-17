ALTER TABLE public.maintenance_visits ADD COLUMN paid boolean NOT NULL DEFAULT false;
ALTER TABLE public.grocery_expenses ADD COLUMN reimbursed boolean NOT NULL DEFAULT false;
CREATE INDEX maintenance_visits_unpaid_idx ON public.maintenance_visits(user_id) WHERE paid = false;
CREATE INDEX grocery_expenses_unreimbursed_idx ON public.grocery_expenses(user_id) WHERE reimbursed = false;
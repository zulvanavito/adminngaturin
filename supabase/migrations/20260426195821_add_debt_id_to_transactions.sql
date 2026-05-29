ALTER TABLE public.transactions 
ADD COLUMN debt_id uuid REFERENCES public.debts(id) ON DELETE SET NULL;;

DO $$
 DECLARE
     table_name_var text;
 BEGIN
     FOR table_name_var IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
     LOOP
            -- Ini adalah perintah umum, namun lebih aman jika kita target tabel yang spesifik
        END LOOP;
    END $$;
   
    -- Perbaikan manual untuk tabel-tabel yang kemungkinan besar menjadi penyebab:
    ALTER TABLE IF EXISTS public.wallets DROP CONSTRAINT IF EXISTS wallets_user_id_fkey,
    ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
   
    ALTER TABLE IF EXISTS public.categories DROP CONSTRAINT IF EXISTS categories_user_id_fkey,
    ADD CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
   
    ALTER TABLE IF EXISTS public.budgets DROP CONSTRAINT IF EXISTS budgets_user_id_fkey,
    ADD CONSTRAINT budgets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
   
    ALTER TABLE IF EXISTS public.recurring_bills DROP CONSTRAINT IF EXISTS recurring_bills_user_id_fkey,
    ADD CONSTRAINT recurring_bills_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
   
    ALTER TABLE IF EXISTS public.debts DROP CONSTRAINT IF EXISTS debts_user_id_fkey,
    ADD CONSTRAINT debts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
   
    ALTER TABLE IF EXISTS public.investments DROP CONSTRAINT IF EXISTS investments_user_id_fkey,
    ADD CONSTRAINT investments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
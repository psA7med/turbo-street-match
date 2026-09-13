ALTER TABLE public.orders DROP CONSTRAINT orders_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_customer_identity_check CHECK (user_id IS NOT NULL OR guest_phone IS NOT NULL);
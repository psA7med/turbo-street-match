ALTER FUNCTION public.place_retail_order(text,text,text,text,text,text,text,jsonb) SET SCHEMA private;

CREATE OR REPLACE FUNCTION public.place_retail_order(
  p_customer_name text,
  p_phone text,
  p_email text,
  p_governorate text,
  p_city text,
  p_street_address text,
  p_landmark text,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private, pg_temp
AS $$
  SELECT private.place_retail_order(p_customer_name, p_phone, p_email, p_governorate, p_city, p_street_address, p_landmark, p_items)
$$;

REVOKE ALL ON FUNCTION private.place_retail_order(text,text,text,text,text,text,text,jsonb) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.place_retail_order(text,text,text,text,text,text,text,jsonb) TO anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.place_retail_order(text,text,text,text,text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_retail_order(text,text,text,text,text,text,text,jsonb) TO anon, authenticated, service_role;
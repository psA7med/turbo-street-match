CREATE UNIQUE INDEX IF NOT EXISTS wholesale_applications_user_unique ON public.wholesale_applications(user_id);

CREATE OR REPLACE FUNCTION private.place_wholesale_order(
  p_customer_name text, p_phone text, p_email text, p_governorate text,
  p_city text, p_street_address text, p_landmark text, p_items jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_order_id uuid := gen_random_uuid();
  v_order_number text := 'TRB-W' || to_char(clock_timestamp(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2);
  v_total numeric(12,2);
  v_user_id uuid := auth.uid();
  v_item jsonb;
  v_variant record;
  v_qty integer;
  v_total_qty integer := 0;
  v_price numeric(12,2);
BEGIN
  IF v_user_id IS NULL OR NOT private.is_approved_wholesale(v_user_id) THEN RAISE EXCEPTION 'not_wholesale'; END IF;
  IF length(trim(coalesce(p_customer_name, ''))) < 3 THEN RAISE EXCEPTION 'customer_name_required'; END IF;
  IF coalesce(p_phone, '') !~ '^01[0125][0-9]{8}$' THEN RAISE EXCEPTION 'invalid_phone'; END IF;
  IF length(trim(coalesce(p_governorate, ''))) < 2 OR length(trim(coalesce(p_city, ''))) < 2 OR length(trim(coalesce(p_street_address, ''))) < 5 THEN RAISE EXCEPTION 'address_required'; END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'cart_empty'; END IF;

  SELECT sum((value->>'quantity')::integer) INTO v_total_qty FROM jsonb_array_elements(p_items) AS value;
  IF coalesce(v_total_qty, 0) < 7 THEN RAISE EXCEPTION 'wholesale_minimum_quantity'; END IF;

  SELECT fee INTO v_shipping FROM public.shipping_zones
  WHERE active = true AND p_governorate = ANY(governorates) ORDER BY fee ASC LIMIT 1;
  IF v_shipping IS NULL THEN RAISE EXCEPTION 'shipping_unavailable'; END IF;

  INSERT INTO public.orders (id, order_number, user_id, guest_email, guest_phone, kind, fulfillment_status, currency, subtotal, discount_total, shipping_total, grand_total, shipping_address)
  VALUES (v_order_id, v_order_number, v_user_id, nullif(trim(p_email), ''), p_phone, 'wholesale', 'pending', 'EGP', 0, 0, 0, 0,
    jsonb_build_object('recipient_name', trim(p_customer_name), 'phone', p_phone, 'governorate', p_governorate, 'city', trim(p_city), 'street_address', trim(p_street_address), 'landmark', nullif(trim(p_landmark), '')));

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::integer;
    IF v_qty < 1 OR v_qty > 500 THEN RAISE EXCEPTION 'invalid_quantity'; END IF;

    SELECT v.id, v.sku, v.color_name_ar, v.size_label, v.retail_price, p.name_ar
    INTO v_variant
    FROM public.product_variants v JOIN public.products p ON p.id = v.product_id
    WHERE v.id = (v_item->>'variant_id')::uuid AND v.active = true AND p.status = 'published';
    IF NOT FOUND THEN RAISE EXCEPTION 'variant_unavailable'; END IF;

    PERFORM 1 FROM public.inventory i
    WHERE i.variant_id = v_variant.id AND (i.quantity - i.reserved_quantity) >= v_qty FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'insufficient_stock'; END IF;

    SELECT wp.unit_price INTO v_price FROM public.wholesale_prices wp
    WHERE wp.variant_id = v_variant.id AND wp.minimum_quantity <= v_qty
    ORDER BY wp.minimum_quantity DESC, wp.unit_price ASC LIMIT 1;
    v_price := coalesce(v_price, v_variant.retail_price);
    v_subtotal := v_subtotal + (v_price * v_qty);

    INSERT INTO public.order_items (order_id, variant_id, product_name_ar, sku, color_name_ar, size_label, quantity, unit_price, line_total)
    VALUES (v_order_id, v_variant.id, v_variant.name_ar, v_variant.sku, v_variant.color_name_ar, v_variant.size_label, v_qty, v_price, v_price * v_qty);
    UPDATE public.inventory SET quantity = quantity - v_qty WHERE variant_id = v_variant.id;
  END LOOP;

  SELECT CASE WHEN free_shipping_threshold IS NOT NULL AND v_subtotal >= free_shipping_threshold THEN 0 ELSE v_shipping END
  INTO v_shipping FROM public.shipping_zones
  WHERE active = true AND p_governorate = ANY(governorates) ORDER BY fee ASC LIMIT 1;
  v_total := v_subtotal + v_shipping;

  UPDATE public.orders SET subtotal = v_subtotal, shipping_total = v_shipping, grand_total = v_total WHERE id = v_order_id;

  INSERT INTO public.payments (order_id, provider, status, amount)
  VALUES (v_order_id, 'cash_on_delivery', 'cod', v_total);

  RETURN jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number, 'subtotal', v_subtotal, 'shipping', v_shipping, 'total', v_total);
END;
$$;

CREATE OR REPLACE FUNCTION public.place_wholesale_order(
  p_customer_name text, p_phone text, p_email text, p_governorate text,
  p_city text, p_street_address text, p_landmark text, p_items jsonb
) RETURNS jsonb
LANGUAGE sql
SET search_path = public, private, pg_temp
AS $$
  SELECT private.place_wholesale_order(p_customer_name, p_phone, p_email, p_governorate, p_city, p_street_address, p_landmark, p_items)
$$;

REVOKE ALL ON FUNCTION public.place_wholesale_order(text, text, text, text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_wholesale_order(text, text, text, text, text, text, text, jsonb) TO authenticated, service_role;
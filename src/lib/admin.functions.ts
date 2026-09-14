import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: any; userId: string };

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;

// Every admin function verifies the caller's role through the user-scoped
// client before touching the privileged client.
async function adminClient(context: Ctx): Promise<any> {
  const { data: isAdmin, error } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (error || !isAdmin) throw new Error("forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

const startOfDay = (offsetDays = 0) => {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - offsetDays);
  return date.toISOString();
};

const pageRange = (page: number, size: number) => [(page - 1) * size, page * size - 1] as const;
const clean = (value: unknown) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length ? text : null;
};

const fulfillmentText: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "تم التأكيد",
  processing: "تحت التجهيز",
  shipped: "تم الشحن — في الطريق",
  delivered: "تم التسليم",
  cancelled: "تم إلغاء الطلب",
};
const paymentText: Record<string, string> = {
  pending: "في انتظار الدفع",
  paid: "مدفوع",
  failed: "فشل الدفع",
  refunded: "تم الاسترجاع",
  cod: "الدفع عند الاستلام",
};

// Resolves the customer's email for an order (guest email or account email).
async function orderRecipient(db: any, order: any): Promise<string | null> {
  if (order?.guest_email) return order.guest_email as string;
  if (!order?.user_id) return null;
  const { data } = await db.auth.admin.getUserById(order.user_id);
  return data?.user?.email ?? null;
}

// Emails the customer whenever something they should see changes on an order.
async function notifyOrderUpdate(db: any, orderId: string, note?: string | null) {
  try {
    const { data: order } = await db
      .from("orders")
      .select("id,order_number,grand_total,fulfillment_status,guest_email,user_id,shipping_address,payments(status),fulfillments(carrier,tracking_number,estimated_delivery_date)")
      .eq("id", orderId)
      .maybeSingle();
    if (!order) return;
    const to = await orderRecipient(db, order);
    if (!to) return;
    let name = (order.shipping_address as any)?.recipient_name ?? undefined;
    if (!name && order.user_id) {
      const { data: profile } = await db.from("profiles").select("full_name").eq("id", order.user_id).maybeSingle();
      name = profile?.full_name ?? undefined;
    }
    const shipment = (order.fulfillments ?? [])[0] ?? {};
    const payment = (order.payments ?? [])[0] ?? {};
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    await sendTemplateEmail("order-status", to, {
      templateData: {
        orderNumber: order.order_number,
        customerName: name,
        statusLabel: fulfillmentText[order.fulfillment_status] ?? order.fulfillment_status,
        statusNote: note ?? undefined,
        paymentLabel: paymentText[payment.status] ?? undefined,
        carrier: shipment.carrier ?? undefined,
        trackingNumber: shipment.tracking_number ?? undefined,
        eta: shipment.estimated_delivery_date ?? undefined,
        total: Number(order.grand_total ?? 0),
      },
      idempotencyKey: `order-status-${orderId}-${order.fulfillment_status}-${payment.status ?? "none"}-${shipment.tracking_number ?? "none"}`,
    });
  } catch (error) {
    console.error("order status email failed", error);
  }
}

/* ------------------------------- dashboard ------------------------------- */

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await adminClient(context);
    const today = startOfDay();
    const week = startOfDay(7);

    const [todayOrders, weekOrders, pending, customers, wholesale, inventory, recentOrders, reviews] = await Promise.all([
      db.from("orders").select("grand_total").gte("created_at", today),
      db.from("orders").select("grand_total").gte("created_at", week),
      db.from("orders").select("id", { count: "exact", head: true }).eq("fulfillment_status", "pending"),
      db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", week),
      db.from("wholesale_applications").select("id,business_name,contact_name,governorate,created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(5),
      db.from("inventory").select("variant_id,quantity,reserved_quantity,low_stock_threshold,product_variants(sku,size_label,color_name_ar,products(name_ar))").order("quantity").limit(50),
      db.from("orders").select("id,order_number,grand_total,fulfillment_status,kind,created_at,shipping_address").order("created_at", { ascending: false }).limit(8),
      db.from("reviews").select("id,rating,title,status,created_at,products(name_ar)").order("created_at", { ascending: false }).limit(6),
    ]);

    const sum = (rows: { grand_total: number }[] | null) => (rows ?? []).reduce((total, row) => total + Number(row.grand_total), 0);
    const lowStock = (inventory.data ?? []).filter((row: any) => row.quantity - row.reserved_quantity <= row.low_stock_threshold);

    return {
      stats: {
        todayOrders: todayOrders.data?.length ?? 0,
        todayRevenue: sum(todayOrders.data),
        pendingOrders: pending.count ?? 0,
        lowStockCount: lowStock.length,
        weekOrders: weekOrders.data?.length ?? 0,
        weekRevenue: sum(weekOrders.data),
        newCustomers: customers.count ?? 0,
        pendingWholesale: wholesale.data?.length ?? 0,
      },
      recentOrders: recentOrders.data ?? [],
      lowStock: lowStock.slice(0, 8),
      wholesale: wholesale.data ?? [],
      reviews: reviews.data ?? [],
    };
  });

export const adminGlobalSearch = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { term: string }) => ({ term: String(input.term ?? "").trim().slice(0, 80) }))
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    if (data.term.length < 2) return { orders: [], products: [], customers: [], applications: [] };
    const like = `%${data.term}%`;
    const [orders, products, customers, applications] = await Promise.all([
      db.from("orders").select("id,order_number,grand_total,created_at").or(`order_number.ilike.${like},guest_email.ilike.${like},guest_phone.ilike.${like}`).limit(5),
      db.from("products").select("id,name_ar,slug").or(`name_ar.ilike.${like},name_en.ilike.${like},slug.ilike.${like}`).limit(5),
      db.from("profiles").select("id,full_name,phone").or(`full_name.ilike.${like},phone.ilike.${like}`).limit(5),
      db.from("wholesale_applications").select("id,business_name,status").or(`business_name.ilike.${like},contact_name.ilike.${like},phone.ilike.${like}`).limit(5),
    ]);
    return {
      orders: orders.data ?? [],
      products: products.data ?? [],
      customers: customers.data ?? [],
      applications: applications.data ?? [],
    };
  });

/* --------------------------------- orders -------------------------------- */

type OrderQuery = {
  term?: string; fulfillment?: string; payment?: string; kind?: string;
  from?: string; to?: string; sort?: string; page?: number;
};

export const listAdminOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: OrderQuery) => input ?? {})
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const size = 20;
    const page = Math.max(1, Number(data.page ?? 1));
    const [start, end] = pageRange(page, size);
    let query = db
      .from("orders")
      .select("id,order_number,kind,fulfillment_status,grand_total,created_at,shipping_address,guest_email,guest_phone,user_id,order_items(id),payments(status)", { count: "exact" });

    if (data.term) query = query.or(`order_number.ilike.%${data.term}%,guest_email.ilike.%${data.term}%,guest_phone.ilike.%${data.term}%`);
    if (data.fulfillment) query = query.eq("fulfillment_status", data.fulfillment);
    if (data.kind) query = query.eq("kind", data.kind);
    if (data.from) query = query.gte("created_at", new Date(data.from).toISOString());
    if (data.to) query = query.lte("created_at", `${data.to}T23:59:59.999Z`);

    const ascending = data.sort === "oldest";
    const column = data.sort === "total" ? "grand_total" : "created_at";
    const { data: rows, error, count } = await query.order(column, { ascending }).range(start, end);
    if (error) throw error;
    const filtered = data.payment
      ? (rows ?? []).filter((row: any) => (row.payments ?? []).some((payment: any) => payment.status === data.payment))
      : rows ?? [];
    return { rows: filtered, total: count ?? 0, page, size };
  });

export const getAdminOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const { data: order, error } = await db
      .from("orders")
      .select("*,order_items(*),payments(*),fulfillments(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!order) throw new Error("not_found");
    let profile = null;
    if (order.user_id) {
      const { data: row } = await db.from("profiles").select("id,full_name,phone").eq("id", order.user_id).maybeSingle();
      profile = row;
    }
    return { order, profile };
  });

export const updateAdminOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; fulfillmentStatus?: string; paymentStatus?: string; note?: string }) => {
    if (!input.id) throw new Error("invalid_input");
    return input;
  })
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    if (data.fulfillmentStatus) {
      const { error } = await db.from("orders").update({ fulfillment_status: data.fulfillmentStatus }).eq("id", data.id);
      if (error) throw error;
    }
    if (typeof data.note === "string") {
      const { error } = await db.from("orders").update({ customer_note: clean(data.note) }).eq("id", data.id);
      if (error) throw error;
    }
    if (data.paymentStatus) {
      const { data: payment } = await db.from("payments").select("id").eq("order_id", data.id).limit(1).maybeSingle();
      const patch = { status: data.paymentStatus, paid_at: data.paymentStatus === "paid" ? new Date().toISOString() : null };
      if (payment) {
        const { error } = await db.from("payments").update(patch).eq("id", payment.id);
        if (error) throw error;
      } else {
        const { data: order } = await db.from("orders").select("grand_total").eq("id", data.id).maybeSingle();
        const { error } = await db.from("payments").insert({ order_id: data.id, provider: "manual", amount: order?.grand_total ?? 0, ...patch });
        if (error) throw error;
      }
    }
    if (data.fulfillmentStatus || data.paymentStatus) {
      await notifyOrderUpdate(db, data.id, clean(data.note));
    }
    return { ok: true };
  });

export const saveAdminFulfillment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string; carrier?: string; trackingNumber?: string; status?: string; eta?: string }) => {
    if (!input.orderId) throw new Error("invalid_input");
    return input;
  })
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const patch = {
      carrier: clean(data.carrier),
      tracking_number: clean(data.trackingNumber),
      status: data.status || "processing",
      estimated_delivery_date: clean(data.eta),
      shipped_at: data.status === "shipped" ? new Date().toISOString() : undefined,
      delivered_at: data.status === "delivered" ? new Date().toISOString() : undefined,
    };
    const { data: existing } = await db.from("fulfillments").select("id").eq("order_id", data.orderId).limit(1).maybeSingle();
    const response = existing
      ? await db.from("fulfillments").update(patch).eq("id", existing.id)
      : await db.from("fulfillments").insert({ order_id: data.orderId, ...patch });
    if (response.error) throw response.error;
    if (data.status) {
      const { error } = await db.from("orders").update({ fulfillment_status: data.status }).eq("id", data.orderId);
      if (error) throw error;
    }
    await notifyOrderUpdate(db, data.orderId, null);
    return { ok: true };
  });

/* -------------------------------- products ------------------------------- */

export const listAdminProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { term?: string; category?: string; status?: string; flag?: string; page?: number }) => input ?? {})
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const size = 20;
    const page = Math.max(1, Number(data.page ?? 1));
    const [start, end] = pageRange(page, size);
    let query = db
      .from("products")
      .select("id,name_ar,name_en,slug,status,is_new,is_bestseller,updated_at,categories(name_ar),product_variants(id,sku,retail_price,active,inventory(quantity,reserved_quantity,low_stock_threshold))", { count: "exact" });
    if (data.term) query = query.or(`name_ar.ilike.%${data.term}%,name_en.ilike.%${data.term}%,slug.ilike.%${data.term}%`);
    if (data.category) query = query.eq("category_id", data.category);
    if (data.status) query = query.eq("status", data.status);
    if (data.flag === "new") query = query.eq("is_new", true);
    if (data.flag === "bestseller") query = query.eq("is_bestseller", true);
    const { data: rows, error, count } = await query.order("updated_at", { ascending: false }).range(start, end);
    if (error) throw error;
    return { rows: rows ?? [], total: count ?? 0, page, size };
  });

export const getAdminProduct = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const [{ data: product, error }, { data: categories }, { data: guides }] = await Promise.all([
      db.from("products").select("*,product_images(*),product_variants(*,inventory(*),wholesale_prices(*))").eq("id", data.id).maybeSingle(),
      db.from("categories").select("id,name_ar").order("sort_order"),
      db.from("size_guides").select("id,name_ar").order("created_at"),
    ]);
    if (error) throw error;
    if (!product) throw new Error("not_found");
    return { product, categories: categories ?? [], guides: guides ?? [] };
  });

export const getAdminProductFormData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await adminClient(context);
    const [{ data: categories }, { data: guides }] = await Promise.all([
      db.from("categories").select("id,name_ar").order("sort_order"),
      db.from("size_guides").select("id,name_ar").order("created_at"),
    ]);
    return { categories: categories ?? [], guides: guides ?? [] };
  });

type ProductInput = {
  id?: string; name_ar: string; name_en?: string; slug: string; description_ar?: string;
  fit_ar?: string; materials_ar?: string; category_id?: string; size_guide_id?: string;
  status: string; is_new: boolean; is_bestseller: boolean;
};

export const saveAdminProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ProductInput) => {
    if (!input.name_ar?.trim() || !input.slug?.trim()) throw new Error("invalid_input");
    return input;
  })
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const payload = {
      name_ar: data.name_ar.trim(),
      name_en: clean(data.name_en),
      slug: data.slug.trim().toLowerCase(),
      description_ar: clean(data.description_ar),
      fit_ar: clean(data.fit_ar),
      materials_ar: clean(data.materials_ar),
      category_id: clean(data.category_id),
      size_guide_id: clean(data.size_guide_id),
      status: data.status,
      is_new: Boolean(data.is_new),
      is_bestseller: Boolean(data.is_bestseller),
    };
    const response = data.id
      ? await db.from("products").update(payload).eq("id", data.id).select("id").maybeSingle()
      : await db.from("products").insert(payload).select("id").maybeSingle();
    if (response.error) throw response.error;
    return { id: response.data?.id as string };
  });

export const setAdminProductStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: string }) => input)
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const { error } = await db.from("products").update({ status: data.status }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const saveAdminVariant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    id?: string; product_id: string; sku: string; color_name_ar: string; color_value?: string;
    size_label: string; retail_price: number; compare_at_price?: number | null; active: boolean;
    quantity?: number; reserved_quantity?: number; low_stock_threshold?: number;
  }) => {
    if (!input.product_id || !input.sku?.trim() || !input.size_label?.trim() || !input.color_name_ar?.trim()) throw new Error("invalid_input");
    return input;
  })
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const payload = {
      product_id: data.product_id,
      sku: data.sku.trim(),
      color_name_ar: data.color_name_ar.trim(),
      color_value: clean(data.color_value),
      size_label: data.size_label.trim(),
      retail_price: Number(data.retail_price) || 0,
      compare_at_price: data.compare_at_price ? Number(data.compare_at_price) : null,
      active: Boolean(data.active),
    };
    const response = data.id
      ? await db.from("product_variants").update(payload).eq("id", data.id).select("id").maybeSingle()
      : await db.from("product_variants").insert(payload).select("id").maybeSingle();
    if (response.error) throw response.error;
    const variantId = response.data?.id as string;
    const { error: inventoryError } = await db.from("inventory").upsert({
      variant_id: variantId,
      quantity: Math.max(0, Number(data.quantity ?? 0)),
      reserved_quantity: Math.max(0, Number(data.reserved_quantity ?? 0)),
      low_stock_threshold: Math.max(0, Number(data.low_stock_threshold ?? 3)),
    });
    if (inventoryError) throw inventoryError;
    return { id: variantId };
  });

export const setAdminVariantActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; active: boolean }) => input)
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const { error } = await db.from("product_variants").update({ active: data.active }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const saveAdminProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id?: string; product_id: string; url?: string; alt_ar: string; sort_order: number; fileBase64?: string; fileName?: string; contentType?: string }) => {
    if (!input.product_id || !input.alt_ar?.trim()) throw new Error("invalid_input");
    return input;
  })
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    let url = clean(data.url);
    if (data.fileBase64) {
      const binary = Buffer.from(data.fileBase64, "base64");
      const path = `${data.product_id}/${Date.now()}-${(data.fileName ?? "image").replace(/[^\w.-]+/g, "-")}`;
      const { error: uploadError } = await db.storage.from("product-media").upload(path, binary, {
        contentType: data.contentType || "image/jpeg",
        upsert: true,
      });
      if (uploadError) throw uploadError;
      const { data: signed, error: signedError } = await db.storage.from("product-media").createSignedUrl(path, SIGNED_URL_TTL);
      if (signedError) throw signedError;
      url = signed?.signedUrl ?? null;
    }
    if (!url) throw new Error("missing_image");
    const payload = { product_id: data.product_id, url, alt_ar: data.alt_ar.trim(), sort_order: Number(data.sort_order) || 0 };
    const response = data.id
      ? await db.from("product_images").update(payload).eq("id", data.id)
      : await db.from("product_images").insert(payload);
    if (response.error) throw response.error;
    return { ok: true };
  });

export const deleteAdminProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const { error } = await db.from("product_images").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/* ------------------------------- inventory ------------------------------- */

export const listAdminInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { filter?: string; term?: string; page?: number }) => input ?? {})
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const size = 30;
    const page = Math.max(1, Number(data.page ?? 1));
    const [start, end] = pageRange(page, size);
    const { data: rows, error, count } = await db
      .from("inventory")
      .select("variant_id,quantity,reserved_quantity,low_stock_threshold,updated_at,product_variants!inner(sku,size_label,color_name_ar,products!inner(name_ar))", { count: "exact" })
      .order("quantity")
      .range(start, end);
    if (error) throw error;
    let list = rows ?? [];
    if (data.term) {
      const term = data.term.toLowerCase();
      list = list.filter((row: any) =>
        row.product_variants?.sku?.toLowerCase().includes(term) ||
        row.product_variants?.products?.name_ar?.includes(data.term!));
    }
    if (data.filter === "low") list = list.filter((row: any) => row.quantity - row.reserved_quantity <= row.low_stock_threshold && row.quantity - row.reserved_quantity > 0);
    if (data.filter === "out") list = list.filter((row: any) => row.quantity - row.reserved_quantity <= 0);
    return { rows: list, total: count ?? 0, page, size };
  });

export const updateAdminInventory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { variantId: string; quantity: number; reserved_quantity: number; low_stock_threshold: number }) => {
    if (!input.variantId) throw new Error("invalid_input");
    return input;
  })
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const { error } = await db.from("inventory").upsert({
      variant_id: data.variantId,
      quantity: Math.max(0, Number(data.quantity) || 0),
      reserved_quantity: Math.max(0, Number(data.reserved_quantity) || 0),
      low_stock_threshold: Math.max(0, Number(data.low_stock_threshold) || 0),
    });
    if (error) throw error;
    return { ok: true };
  });

/* ------------------------------- categories ------------------------------ */

export const listAdminCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await adminClient(context);
    const { data, error } = await db.from("categories").select("*").order("sort_order");
    if (error) throw error;
    return data ?? [];
  });

export const saveAdminCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id?: string; name_ar: string; name_en?: string; slug: string; description_ar?: string; image_url?: string; parent_id?: string; sort_order: number; status: string }) => {
    if (!input.name_ar?.trim() || !input.slug?.trim()) throw new Error("invalid_input");
    return input;
  })
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const payload = {
      name_ar: data.name_ar.trim(),
      name_en: clean(data.name_en),
      slug: data.slug.trim().toLowerCase(),
      description_ar: clean(data.description_ar),
      image_url: clean(data.image_url),
      parent_id: clean(data.parent_id),
      sort_order: Number(data.sort_order) || 0,
      status: data.status,
    };
    const response = data.id
      ? await db.from("categories").update(payload).eq("id", data.id)
      : await db.from("categories").insert(payload);
    if (response.error) throw response.error;
    return { ok: true };
  });

/* ------------------------------- customers ------------------------------- */

export const listAdminCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { term?: string; page?: number }) => input ?? {})
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const size = 20;
    const page = Math.max(1, Number(data.page ?? 1));
    const [start, end] = pageRange(page, size);
    let query = db.from("profiles").select("id,full_name,phone,created_at", { count: "exact" });
    if (data.term) query = query.or(`full_name.ilike.%${data.term}%,phone.ilike.%${data.term}%`);
    const { data: rows, error, count } = await query.order("created_at", { ascending: false }).range(start, end);
    if (error) throw error;
    const ids = (rows ?? []).map((row: any) => row.id);
    const [{ data: orders }, { data: roles }, users] = await Promise.all([
      ids.length ? db.from("orders").select("user_id,grand_total,created_at").in("user_id", ids) : { data: [] },
      ids.length ? db.from("user_roles").select("user_id,role").in("user_id", ids) : { data: [] },
      db.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);
    const emails = new Map((users.data?.users ?? []).map((user: any) => [user.id, user.email]));
    return {
      rows: (rows ?? []).map((row: any) => {
        const mine = (orders ?? []).filter((order: any) => order.user_id === row.id);
        return {
          ...row,
          email: emails.get(row.id) ?? null,
          orders: mine.length,
          spent: mine.reduce((total: number, order: any) => total + Number(order.grand_total), 0),
          lastOrder: mine.map((order: any) => order.created_at).sort().at(-1) ?? null,
          roles: (roles ?? []).filter((role: any) => role.user_id === row.id).map((role: any) => role.role),
        };
      }),
      total: count ?? 0,
      page,
      size,
    };
  });

export const getAdminCustomer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const [{ data: profile }, { data: addresses }, { data: orders }, { data: roles }, { data: application }, user] = await Promise.all([
      db.from("profiles").select("*").eq("id", data.id).maybeSingle(),
      db.from("addresses").select("*").eq("user_id", data.id).order("is_default", { ascending: false }),
      db.from("orders").select("id,order_number,grand_total,fulfillment_status,kind,created_at").eq("user_id", data.id).order("created_at", { ascending: false }),
      db.from("user_roles").select("role").eq("user_id", data.id),
      db.from("wholesale_applications").select("id,business_name,status,created_at").eq("user_id", data.id).maybeSingle(),
      db.auth.admin.getUserById(data.id),
    ]);
    if (!profile) throw new Error("not_found");
    return {
      profile,
      email: user.data?.user?.email ?? null,
      addresses: addresses ?? [],
      orders: orders ?? [],
      roles: (roles ?? []).map((row: any) => row.role),
      application: application ?? null,
    };
  });

/* -------------------------------- reviews -------------------------------- */

export const listAdminReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { status?: string; rating?: number; productId?: string; page?: number }) => input ?? {})
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const size = 20;
    const page = Math.max(1, Number(data.page ?? 1));
    const [start, end] = pageRange(page, size);
    let query = db.from("reviews").select("*,products(id,name_ar)", { count: "exact" });
    if (data.status) query = query.eq("status", data.status);
    if (data.rating) query = query.eq("rating", Number(data.rating));
    if (data.productId) query = query.eq("product_id", data.productId);
    const { data: rows, error, count } = await query.order("created_at", { ascending: false }).range(start, end);
    if (error) throw error;
    const ids = [...new Set((rows ?? []).map((row: any) => row.user_id))];
    const { data: profiles } = ids.length ? await db.from("profiles").select("id,full_name").in("id", ids) : { data: [] };
    const names = new Map((profiles ?? []).map((profile: any) => [profile.id, profile.full_name]));
    return {
      rows: (rows ?? []).map((row: any) => ({ ...row, customer: names.get(row.user_id) ?? null })),
      total: count ?? 0,
      page,
      size,
    };
  });

export const setAdminReviewStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: string }) => input)
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const { error } = await db.from("reviews").update({ status: data.status }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/* --------------------------- wholesale pricing --------------------------- */

export const listAdminWholesalePrices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await adminClient(context);
    const [{ data: prices }, { data: variants }] = await Promise.all([
      db.from("wholesale_prices").select("*,product_variants(sku,size_label,color_name_ar,retail_price,products(name_ar))").order("created_at", { ascending: false }),
      db.from("product_variants").select("id,sku,size_label,color_name_ar,retail_price,products(name_ar)").eq("active", true).order("sku"),
    ]);
    return { prices: prices ?? [], variants: variants ?? [] };
  });

export const saveAdminWholesalePrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id?: string; variant_id: string; tier: string; unit_price: number; minimum_quantity: number }) => {
    if (!input.variant_id || !input.tier?.trim()) throw new Error("invalid_input");
    return input;
  })
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const payload = {
      variant_id: data.variant_id,
      tier: data.tier.trim(),
      unit_price: Number(data.unit_price) || 0,
      minimum_quantity: Math.max(1, Number(data.minimum_quantity) || 1),
    };
    const response = data.id
      ? await db.from("wholesale_prices").update(payload).eq("id", data.id)
      : await db.from("wholesale_prices").insert(payload);
    if (response.error) throw response.error;
    return { ok: true };
  });

export const deleteAdminWholesalePrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const { error } = await db.from("wholesale_prices").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/* --------------------------------- content ------------------------------- */

export const listAdminSections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await adminClient(context);
    const { data, error } = await db.from("homepage_sections").select("*").order("sort_order");
    if (error) throw error;
    return data ?? [];
  });

export const saveAdminSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id?: string; section_key: string; eyebrow_ar?: string; title_ar?: string; body_ar?: string; cta_label_ar?: string; cta_url?: string; image_url?: string; sort_order: number; status: string }) => {
    if (!input.section_key?.trim()) throw new Error("invalid_input");
    return input;
  })
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const payload = {
      section_key: data.section_key.trim(),
      eyebrow_ar: clean(data.eyebrow_ar),
      title_ar: clean(data.title_ar),
      body_ar: clean(data.body_ar),
      cta_label_ar: clean(data.cta_label_ar),
      cta_url: clean(data.cta_url),
      image_url: clean(data.image_url),
      sort_order: Number(data.sort_order) || 0,
      status: data.status,
    };
    const response = data.id
      ? await db.from("homepage_sections").update(payload).eq("id", data.id)
      : await db.from("homepage_sections").insert(payload);
    if (response.error) throw response.error;
    return { ok: true };
  });

/* -------------------------------- shipping ------------------------------- */

export const listAdminShippingZones = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await adminClient(context);
    const { data, error } = await db.from("shipping_zones").select("*").order("name_ar");
    if (error) throw error;
    return data ?? [];
  });

export const saveAdminShippingZone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id?: string; name_ar: string; governorates: string[]; fee: number; free_shipping_threshold?: number | null; eta_min_days: number; eta_max_days: number; cod_available: boolean; active: boolean }) => {
    if (!input.name_ar?.trim()) throw new Error("invalid_input");
    return input;
  })
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    const payload = {
      name_ar: data.name_ar.trim(),
      governorates: (data.governorates ?? []).map((item) => item.trim()).filter(Boolean),
      fee: Number(data.fee) || 0,
      free_shipping_threshold: data.free_shipping_threshold ? Number(data.free_shipping_threshold) : null,
      eta_min_days: Math.max(1, Number(data.eta_min_days) || 1),
      eta_max_days: Math.max(1, Number(data.eta_max_days) || 1),
      cod_available: Boolean(data.cod_available),
      active: Boolean(data.active),
    };
    const response = data.id
      ? await db.from("shipping_zones").update(payload).eq("id", data.id)
      : await db.from("shipping_zones").insert(payload);
    if (response.error) throw response.error;
    return { ok: true };
  });

/* ------------------------------ size guides ------------------------------ */

export const listAdminSizeGuides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await adminClient(context);
    const [{ data: guides, error }, { data: categories }] = await Promise.all([
      db.from("size_guides").select("*").order("created_at"),
      db.from("categories").select("id,name_ar").order("sort_order"),
    ]);
    if (error) throw error;
    return { guides: guides ?? [], categories: categories ?? [] };
  });

export const saveAdminSizeGuide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id?: string; name_ar: string; category_id?: string; instructions_ar?: string; measurements: string; status: string }) => {
    if (!input.name_ar?.trim()) throw new Error("invalid_input");
    return input;
  })
  .handler(async ({ data, context }) => {
    const db = await adminClient(context);
    let measurements: unknown = [];
    try {
      measurements = data.measurements?.trim() ? JSON.parse(data.measurements) : [];
    } catch {
      throw new Error("invalid_measurements");
    }
    const payload = {
      name_ar: data.name_ar.trim(),
      category_id: clean(data.category_id),
      instructions_ar: clean(data.instructions_ar),
      measurements,
      status: data.status,
    };
    const response = data.id
      ? await db.from("size_guides").update(payload).eq("id", data.id)
      : await db.from("size_guides").insert(payload);
    if (response.error) throw response.error;
    return { ok: true };
  });

/* -------------------------------- settings ------------------------------- */

export const getAdminSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await adminClient(context);
    const [{ data: roles }, { count: products }, { count: orders }, { count: customers }, { data: zones }] = await Promise.all([
      db.from("user_roles").select("user_id,role").in("role", ["admin", "super_admin"]),
      db.from("products").select("id", { count: "exact", head: true }),
      db.from("orders").select("id", { count: "exact", head: true }),
      db.from("profiles").select("id", { count: "exact", head: true }),
      db.from("shipping_zones").select("id").eq("active", true),
    ]);
    const users = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
    const emails = new Map((users.data?.users ?? []).map((user: any) => [user.id, user.email]));
    return {
      admins: (roles ?? []).map((row: any) => ({ role: row.role, email: emails.get(row.user_id) ?? row.user_id })),
      counts: { products: products ?? 0, orders: orders ?? 0, customers: customers ?? 0, activeZones: (zones ?? []).length },
    };
  });

export const ensureAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adminClient(context);
    const db = await adminClient(context);
    const [{ count: pendingOrders }, { count: pendingWholesale }, { count: pendingReviews }] = await Promise.all([
      db.from("orders").select("id", { count: "exact", head: true }).eq("fulfillment_status", "pending"),
      db.from("wholesale_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
      db.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    return {
      ok: true as const,
      alerts: { pendingOrders: pendingOrders ?? 0, pendingWholesale: pendingWholesale ?? 0, pendingReviews: pendingReviews ?? 0 },
    };
  });

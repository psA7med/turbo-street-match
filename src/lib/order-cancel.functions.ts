import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STORE_INBOX = "turpoclothes@gmail.com";
// الحالات اللي العميل يقدر يلغي فيها — بعد الشحن الإلغاء بيبقى مقفول.
const CANCELLABLE = ["pending", "confirmed", "processing"];

export const cancelMyOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ orderId: z.string().uuid(), reason: z.string().trim().min(3).max(500) }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    const { data: order } = await db
      .from("orders")
      .select("id,order_number,grand_total,fulfillment_status,guest_email,user_id,customer_note,shipping_address")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order || order.user_id !== context.userId) throw new Error("order_not_found");
    if (order.fulfillment_status === "cancelled") return { ok: true, alreadyCancelled: true as const };
    if (!CANCELLABLE.includes(order.fulfillment_status)) throw new Error("not_cancellable");

    const note = `${order.customer_note ? `${order.customer_note}\n` : ""}سبب الإلغاء (من العميل): ${data.reason}`;
    const { error } = await db
      .from("orders")
      .update({ fulfillment_status: "cancelled", customer_note: note })
      .eq("id", data.orderId)
      .in("fulfillment_status", CANCELLABLE);
    if (error) throw error;

    const address = (order.shipping_address ?? {}) as { recipient_name?: string };
    let name = address.recipient_name as string | undefined;
    if (!name) {
      const { data: profile } = await db.from("profiles").select("full_name").eq("id", context.userId).maybeSingle();
      name = profile?.full_name ?? undefined;
    }
    const { data: authUser } = await db.auth.admin.getUserById(context.userId);
    const customerEmail = order.guest_email || authUser?.user?.email || null;

    const templateData = {
      orderNumber: order.order_number,
      customerName: name,
      statusLabel: "تم إلغاء الطلب",
      statusNote: `سبب الإلغاء: ${data.reason}`,
      total: Number(order.grand_total ?? 0),
    };

    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const sends: Promise<unknown>[] = [
      sendTemplateEmail("order-status", STORE_INBOX, {
        templateData: { ...templateData, statusNote: `${templateData.statusNote} — إلغاء من العميل${customerEmail ? ` (${customerEmail})` : ""}` },
        idempotencyKey: `order-cancel-store-${data.orderId}`,
      }),
    ];
    if (customerEmail) {
      sends.push(
        sendTemplateEmail("order-status", customerEmail, {
          templateData,
          idempotencyKey: `order-cancel-customer-${data.orderId}`,
        })
      );
    }
    await Promise.allSettled(sends);

    return { ok: true, alreadyCancelled: false as const };
  });

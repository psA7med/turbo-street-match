import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

interface ShippingAddress {
  recipient_name?: string;
  phone?: string;
  governorate?: string;
  city?: string;
  street_address?: string;
  landmark?: string | null;
}

// Sends the new-order notification to the store inbox after an order is
// placed. Recipient is fixed in the template; never taken from the client.
export const notifyOrderPlaced = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ orderId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("order_number, guest_email, guest_phone, subtotal, shipping_total, grand_total, shipping_address, order_items(product_name_ar, color_name_ar, size_label, quantity, line_total)")
      .eq("id", data.orderId)
      .single();
    if (error || !order) throw new Error("order_not_found");

    const address = (order.shipping_address ?? {}) as ShippingAddress;

    const result = await sendTemplateEmail("order-notification", "turpoclothes@gmail.com", {
      templateData: {
        orderNumber: order.order_number,
        customerName: address.recipient_name,
        phone: order.guest_phone ?? address.phone,
        email: order.guest_email,
        governorate: address.governorate,
        city: address.city,
        streetAddress: address.street_address,
        landmark: address.landmark ?? undefined,
        items: (order.order_items ?? []).map((item) => ({
          name: item.product_name_ar,
          color: item.color_name_ar,
          size: item.size_label,
          quantity: item.quantity,
          total: item.line_total,
        })),
        subtotal: order.subtotal,
        shipping: order.shipping_total,
        total: order.grand_total,
      },
      idempotencyKey: `order-notification-${data.orderId}`,
    });
    return result;
  });

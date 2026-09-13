import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Sends the new-order notification to the store inbox after an order is
// placed. Recipient is fixed in the template; never taken from the client.
export const notifyOrderPlaced = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ orderId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("order_number, customer_name, phone, email, governorate, city, street_address, landmark, subtotal, shipping, total, order_items(product_name, color, size, quantity, line_total)")
      .eq("id", data.orderId)
      .single();
    if (error || !order) throw new Error("order_not_found");

    const result = await sendTemplateEmail("order-notification", "turpoclothes@gmail.com", {
      templateData: {
        orderNumber: order.order_number,
        customerName: order.customer_name,
        phone: order.phone,
        email: order.email,
        governorate: order.governorate,
        city: order.city,
        streetAddress: order.street_address,
        landmark: order.landmark,
        items: (order.order_items ?? []).map((item) => ({
          name: item.product_name,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          total: item.line_total,
        })),
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
      },
      idempotencyKey: `order-notification-${data.orderId}`,
    });
    return result;
  });

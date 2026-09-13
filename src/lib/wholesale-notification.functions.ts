import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const arabicDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }) : undefined;

// Emails the store inbox with the submitted dealer form plus the applicant's
// account details. Recipient is fixed in the template.
export const notifyWholesaleApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { applicationId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");

    const [{ data: application }, { data: profile }, { data: account }] = await Promise.all([
      supabaseAdmin
        .from("wholesale_applications")
        .select("id,business_name,contact_name,phone,governorate,address,business_type,tax_registration,notes,created_at")
        .eq("id", data.applicationId)
        .eq("user_id", context.userId)
        .maybeSingle(),
      supabaseAdmin.from("profiles").select("full_name,phone").eq("id", context.userId).maybeSingle(),
      supabaseAdmin.auth.admin.getUserById(context.userId),
    ]);
    if (!application) throw new Error("application_not_found");

    const accountEmail = account?.user?.email?.trim().toLowerCase();
    const templateData = {
      businessName: application.business_name,
      contactName: application.contact_name,
      phone: application.phone,
      governorate: application.governorate,
      address: application.address,
      businessType: application.business_type ?? undefined,
      taxRegistration: application.tax_registration ?? undefined,
      notes: application.notes ?? undefined,
      accountEmail,
      accountName: profile?.full_name ?? undefined,
      customerName: profile?.full_name ?? application.contact_name,
      accountPhone: profile?.phone ?? undefined,
      accountCreatedAt: arabicDate(account?.user?.created_at),
      submittedAt: arabicDate(application.created_at),
    };
    const [store, customer] = await Promise.allSettled([
      sendTemplateEmail("wholesale-application", "turpoclothes@gmail.com", {
        templateData,
        idempotencyKey: `wholesale-application-${application.id}`,
      }),
      accountEmail
        ? sendTemplateEmail("wholesale-application-confirmation", accountEmail, {
            templateData,
            idempotencyKey: `wholesale-application-confirmation-${application.id}`,
          })
        : Promise.resolve({ sent: false as const, reason: "missing_email" }),
    ]);
    return {
      store: store.status === "fulfilled" ? store.value : { sent: false, reason: "send_failed" },
      customer: customer.status === "fulfilled" ? customer.value : { sent: false, reason: "send_failed" },
    };
  });

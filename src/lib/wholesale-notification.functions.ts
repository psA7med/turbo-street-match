import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const arabicDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }) : undefined;

// Emails the store inbox with the submitted dealer form plus the applicant's
// account details. Recipient is fixed in the template.
export const notifyWholesaleApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");

    const [{ data: application }, { data: profile }, { data: account }] = await Promise.all([
      supabaseAdmin
        .from("wholesale_applications")
        .select("id,business_name,contact_name,phone,governorate,address,business_type,tax_registration,notes,created_at")
        .eq("user_id", context.userId)
        .maybeSingle(),
      supabaseAdmin.from("profiles").select("full_name,phone").eq("id", context.userId).maybeSingle(),
      supabaseAdmin.auth.admin.getUserById(context.userId),
    ]);
    if (!application) throw new Error("application_not_found");

    const result = await sendTemplateEmail("wholesale-application", "turpoclothes@gmail.com", {
      templateData: {
        businessName: application.business_name,
        contactName: application.contact_name,
        phone: application.phone,
        governorate: application.governorate,
        address: application.address,
        businessType: application.business_type ?? undefined,
        taxRegistration: application.tax_registration ?? undefined,
        notes: application.notes ?? undefined,
        accountEmail: account?.user?.email ?? undefined,
        accountName: profile?.full_name ?? undefined,
        accountPhone: profile?.phone ?? undefined,
        accountCreatedAt: arabicDate(account?.user?.created_at),
        submittedAt: arabicDate(application.created_at),
      },
      idempotencyKey: `wholesale-application-${application.id}`,
    });
    return result;
  });

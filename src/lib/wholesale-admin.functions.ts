import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ApplicationStatus = "pending" | "approved" | "rejected";

async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin, error } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (error || !isAdmin) throw new Error("forbidden");
}

export const listWholesaleApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data: applications, error } = await context.supabase
      .from("wholesale_applications")
      .select("id,user_id,business_name,contact_name,phone,governorate,address,business_type,tax_registration,notes,status,created_at,updated_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const userIds = [...new Set((applications ?? []).map((item: { user_id: string }) => item.user_id))];
    const { data: profiles, error: profileError } = userIds.length
      ? await context.supabase.from("profiles").select("id,full_name,phone").in("id", userIds)
      : { data: [], error: null };
    if (profileError) throw profileError;
    const profileMap = new Map((profiles ?? []).map((profile: { id: string; full_name: string | null; phone: string | null }) => [profile.id, profile]));
    return (applications ?? []).map((application: any) => ({ ...application, profile: profileMap.get(application.user_id) ?? null }));
  });

export const updateWholesaleApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { applicationId: string; status: ApplicationStatus }) => {
    if (!input.applicationId || !["pending", "approved", "rejected"].includes(input.status)) throw new Error("invalid_input");
    return input;
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { data: application, error } = await context.supabase
      .from("wholesale_applications")
      .update({ status: data.status, reviewed_by: context.userId, reviewed_at: new Date().toISOString() })
      .eq("id", data.applicationId)
      .select("id,user_id,status")
      .single();
    if (error) throw error;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", application.user_id).in("role", ["wholesale_pending", "wholesale"]);
    if (data.status !== "rejected") {
      const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
        user_id: application.user_id,
        role: data.status === "approved" ? "wholesale" : "wholesale_pending",
      });
      if (roleError) throw roleError;
    }

    if (data.status !== "pending") {
      try {
        const [{ data: authUser }, { data: profile }, { data: details }] = await Promise.all([
          supabaseAdmin.auth.admin.getUserById(application.user_id),
          supabaseAdmin.from("profiles").select("full_name").eq("id", application.user_id).maybeSingle(),
          supabaseAdmin.from("wholesale_applications").select("business_name,contact_name").eq("id", data.applicationId).maybeSingle(),
        ]);
        const to = authUser?.user?.email;
        if (to) {
          const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
          await sendTemplateEmail("wholesale-decision", to, {
            templateData: {
              customerName: profile?.full_name ?? details?.contact_name ?? undefined,
              businessName: details?.business_name ?? undefined,
              approved: data.status === "approved",
            },
            idempotencyKey: `wholesale-decision-${data.applicationId}-${data.status}`,
          });
        }
      } catch (error) {
        console.error("wholesale decision email failed", error);
      }
    }
    return application;
  });
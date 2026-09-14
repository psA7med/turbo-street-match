import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { notifyWholesaleApplication } from "@/lib/wholesale-notification.functions";

export const Route = createFileRoute("/_authenticated/wholesale-apply")({
  head: () => ({ meta: [
    { title: "طلب تاجر جملة — TURBO" },
    { name: "description", content: "أرسل بيانات نشاطك لمراجعة طلب الانضمام لتجار TURBO." },
    { property: "og:title", content: "الانضمام لتجار TURBO" },
    { property: "og:description", content: "طلب محمي لمراجعة بيانات نشاطك." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: Page,
});

const label = { pending: "قيد المراجعة", approved: "تمت الموافقة", rejected: "لم تتم الموافقة" } as const;

function Page() {
  const { user } = Route.useRouteContext();
  const [loading, setLoading] = useState(false);
  const sendNotification = useServerFn(notifyWholesaleApplication);
  const { data: application, refetch } = useQuery({
    queryKey: ["wholesale-application", user.id],
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase.from("wholesale_applications").select("id,status,business_name,created_at").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      user_id: user.id,
      business_name: String(form.get("business_name")),
      contact_name: String(form.get("contact_name")),
      phone: String(form.get("phone")),
      governorate: String(form.get("governorate")),
      address: String(form.get("address")),
      business_type: String(form.get("business_type") || "") || null,
      tax_registration: String(form.get("tax_registration") || "") || null,
      notes: String(form.get("notes") || "") || null,
    };
    const rejected = application?.status === "rejected";
    const { data, error } = rejected
      ? await supabase.from("wholesale_applications").update({ ...payload, status: "pending", reviewed_by: null, reviewed_at: null }).eq("id", application.id).select("id").single()
      : await supabase.from("wholesale_applications").insert(payload).select("id").single();
    if (error || !data) {
      setLoading(false);
      const duplicate = error?.code === "23505";
      toast.error(duplicate ? "عندك طلب جملة مسجّل بالفعل" : "تعذر إرسال الطلب", {
        description: duplicate ? "تابع حالة طلبك من حسابك." : "راجع البيانات وحاول تاني.",
      });
      if (duplicate) await refetch();
      return;
    }
    try {
      await sendNotification({ data: { applicationId: data.id } });
    } catch {
      toast.warning("طلبك اتسجل، لكن تعذر إرسال رسالة التأكيد حاليًا");
    }
    setLoading(false);
    toast.success("تم إرسال طلبك");
    await refetch();
  };

  if (application && application.status !== "rejected") return (
    <div className="turbo-container section-space min-h-[60vh] text-center">
      <CheckCircle2 className="mx-auto size-14 text-primary" />
      <h1 className="mt-5 text-4xl font-bold">طلبك وصل</h1>
      <p className="mt-3 text-muted-foreground">{application.business_name} · {label[application.status]}</p>
      <p className="mx-auto mt-5 max-w-lg leading-7 text-muted-foreground">الحالة بتتحدث تلقائيًا. أسعار الجملة والكتالوج التجاري يفضلوا محميين لحد موافقة الإدارة.</p>
      <Button asChild className="mt-7"><Link to="/account">حسابي</Link></Button>
    </div>
  );

  return (
    <div className="turbo-container section-space">
      <div className="max-w-2xl">
        <p className="font-bold text-primary">WHOLESALE APPLICATION</p>
        <h1 className="mt-2 text-4xl font-bold md:text-6xl">بيانات نشاطك</h1>
        <p className="mt-4 leading-7 text-muted-foreground">هنراجع البيانات قبل فتح أسعار وطلبات الجملة.</p>
        <form onSubmit={submit} className="mt-8 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold">اسم النشاط<Input name="business_name" required /></label>
          <label className="grid gap-2 text-sm font-bold">اسم المسؤول<Input name="contact_name" required /></label>
          <label className="grid gap-2 text-sm font-bold">رقم الموبايل<Input name="phone" required type="tel" dir="ltr" /></label>
          <label className="grid gap-2 text-sm font-bold">المحافظة<Input name="governorate" required /></label>
          <label className="grid gap-2 text-sm font-bold sm:col-span-2">عنوان النشاط<Input name="address" required /></label>
          <label className="grid gap-2 text-sm font-bold">نوع النشاط<Input name="business_type" placeholder="محل، موزع..." /></label>
          <label className="grid gap-2 text-sm font-bold">رقم التسجيل الضريبي <span className="font-normal text-muted-foreground">(اختياري)</span><Input name="tax_registration" dir="ltr" /></label>
          <label className="grid gap-2 text-sm font-bold sm:col-span-2">ملاحظات<textarea name="notes" className="min-h-28 rounded-lg border border-input bg-background p-3" /></label>
          <Button type="submit" size="lg" className="sm:col-span-2" disabled={loading}>{loading ? <LoaderCircle className="animate-spin" /> : "إرسال للمراجعة"}</Button>
        </form>
      </div>
    </div>
  );
}
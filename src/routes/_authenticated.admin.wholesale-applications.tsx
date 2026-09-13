import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, LoaderCircle, Store, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listWholesaleApplications, updateWholesaleApplicationStatus } from "@/lib/wholesale-admin.functions";

export const Route = createFileRoute("/_authenticated/admin/wholesale-applications")({
  head: () => ({ meta: [
    { title: "طلبات تجار الجملة — TURBO" },
    { name: "description", content: "إدارة ومراجعة طلبات تجار الجملة في TURBO." },
    { property: "og:title", content: "طلبات تجار الجملة — TURBO" },
    { property: "og:description", content: "صفحة الإدارة المحمية لطلبات الجملة." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: Page,
});

const statusLabel = { pending: "قيد المراجعة", approved: "مقبول", rejected: "مرفوض" } as const;
type Status = keyof typeof statusLabel;

function Page() {
  const queryClient = useQueryClient();
  const loadApplications = useServerFn(listWholesaleApplications);
  const saveStatus = useServerFn(updateWholesaleApplicationStatus);
  const [changingId, setChangingId] = useState<string | null>(null);
  const previousIds = useRef<Set<string> | null>(null);
  const query = useQuery({
    queryKey: ["admin-wholesale-applications"],
    queryFn: () => loadApplications(),
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!query.data) return;
    const currentIds = new Set(query.data.map((item) => item.id));
    if (previousIds.current && query.data.some((item) => !previousIds.current?.has(item.id))) toast.info("وصل طلب تاجر جملة جديد");
    previousIds.current = currentIds;
  }, [query.data]);

  const updateStatus = async (applicationId: string, status: Status) => {
    setChangingId(applicationId);
    try {
      await saveStatus({ data: { applicationId, status } });
      await queryClient.invalidateQueries({ queryKey: ["admin-wholesale-applications"] });
      toast.success(status === "approved" ? "تم قبول التاجر" : "تم رفض الطلب");
    } catch {
      toast.error("تعذر تحديث حالة الطلب");
    } finally {
      setChangingId(null);
    }
  };

  if (query.isLoading) return <div className="turbo-container section-space"><LoaderCircle className="mx-auto size-9 animate-spin text-primary" /></div>;
  if (query.isError) return <div className="turbo-container section-space"><h1 className="text-3xl font-bold">غير مسموح بالدخول</h1><p className="mt-3 text-muted-foreground">صفحة طلبات الجملة متاحة للإدارة فقط.</p></div>;
  const applications = query.data ?? [];

  return (
    <div className="turbo-container section-space">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div><p className="eyebrow">إدارة المتجر</p><h1 className="mt-2 text-4xl font-bold md:text-5xl">طلبات تجار الجملة</h1></div>
        <p className="text-sm text-muted-foreground">تحديث تلقائي كل 10 ثوانٍ · {applications.length} طلب</p>
      </div>
      {applications.length === 0 ? (
        <div className="grid min-h-80 place-items-center text-center"><div><Store className="mx-auto size-12 text-primary" /><h2 className="mt-4 text-2xl font-bold">مفيش طلبات حاليًا</h2></div></div>
      ) : (
        <div className="mt-8 grid gap-4">
          {applications.map((application) => (
            <article key={application.id} className="grid gap-5 rounded-[10px] border border-border bg-card p-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-bold">{application.business_name}</h2><Badge variant={application.status === "rejected" ? "destructive" : application.status === "approved" ? "default" : "outline"}>{statusLabel[application.status as Status]}</Badge></div>
                <p className="mt-2 text-sm text-muted-foreground">{application.contact_name} · <span dir="ltr">{application.phone}</span> · {application.governorate}</p>
                <p className="mt-3 text-sm">{application.address}</p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground"><span>نوع النشاط: {application.business_type || "غير محدد"}</span><span>الحساب: {application.profile?.full_name || "—"}</span><span>{new Date(application.created_at).toLocaleString("ar-EG")}</span></div>
                {application.notes && <p className="mt-3 border-s-2 border-primary ps-3 text-sm text-muted-foreground">{application.notes}</p>}
              </div>
              <div className="flex gap-2">
                <Button disabled={changingId === application.id || application.status === "approved"} onClick={() => updateStatus(application.id, "approved")}><Check /> قبول</Button>
                <Button variant="outline" disabled={changingId === application.id || application.status === "rejected"} onClick={() => updateStatus(application.id, "rejected")}><X /> رفض</Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
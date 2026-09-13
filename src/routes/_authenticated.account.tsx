import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, LogOut, MapPin, Package, Store, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { money } from "@/components/storefront/catalog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "حسابي — TURBO" },
      { name: "description", content: "تابع طلباتك وبيانات حساب TURBO." },
      { property: "og:title", content: "حسابي في TURBO" },
      { property: "og:description", content: "طلباتك وبياناتك في مكان واحد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

const statusLabel = { pending: "قيد المراجعة", confirmed: "تم التأكيد", processing: "قيد التجهيز", shipped: "خرج للتوصيل", delivered: "تم التوصيل", cancelled: "ملغي" } as const;

function Page() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["my-orders", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,order_number,grand_total,fulfillment_status,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: wholesale } = useQuery({
    queryKey: ["my-wholesale", user.id],
    queryFn: async () => {
      const [{ data: roles }, { data: application }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("wholesale_applications").select("status").eq("user_id", user.id).maybeSingle(),
      ]);
      const names = (roles ?? []).map((r) => r.role);
      if (names.includes("wholesale")) return "approved" as const;
      return application?.status ?? null;
    },
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    navigate({ to: "/" });
  };

  const wholesaleCard = wholesale === "approved"
    ? { to: "/wholesale" as const, title: "بوابة تجار الجملة", desc: "أسعار الجملة وطلبات الكمية" }
    : wholesale === "pending"
      ? { to: "/wholesale-apply" as const, title: "طلب الجملة قيد المراجعة", desc: "هنوافيك بالنتيجة قريبًا" }
      : { to: "/wholesale-apply" as const, title: "قدّم كتاجر جملة", desc: "افتح أسعار الجملة لمحلك" };

  const cards = [
    { to: undefined, icon: UserRound, title: "بيانات الحساب", desc: user.email ?? "" },
    { to: wholesaleCard.to, icon: Store, title: wholesaleCard.title, desc: wholesaleCard.desc },
    { to: undefined, icon: MapPin, title: "عناوين التوصيل", desc: "تُحفظ تلقائيًا عند إتمام الطلب" },
  ];

  return (
    <div className="turbo-container section-space min-h-[60vh]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">MY TURBO</p>
          <h1 className="mt-2 text-4xl font-bold md:text-6xl">حسابي</h1>
          <p dir="ltr" className="mt-3 text-start text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Button variant="outline" onClick={signOut}><LogOut /> تسجيل الخروج</Button>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {cards.map(({ to, icon: Icon, title, desc }) => {
          const body = (
            <>
              <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></span>
              <h2 className="mt-4 font-bold">{title}</h2>
              <p dir={title === "بيانات الحساب" ? "ltr" : undefined} className="mt-1 truncate text-start text-sm text-muted-foreground">{desc}</p>
            </>
          );
          return to
            ? <Link key={title} to={to} className="rounded-[10px] border bg-card p-5 transition-colors hover:border-primary/60">{body}</Link>
            : <div key={title} className="rounded-[10px] border bg-card p-5">{body}</div>;
        })}
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">الطلبات</h2>
          <span className="text-sm text-muted-foreground">{orders.length} طلب</span>
        </div>
        {ordersLoading ? (
          <div className="mt-5 grid gap-3">{[0, 1].map((i) => <Skeleton key={i} className="h-24 rounded-[10px]" />)}</div>
        ) : orders.length ? (
          <div className="mt-5 grid gap-3">
            {orders.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] border bg-card p-5">
                <div className="flex items-center gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Package className="size-5" /></span>
                  <div>
                    <strong dir="ltr">#{o.order_number}</strong>
                    <p className="mt-1 text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-end">
                    <strong>{money(o.grand_total)}</strong>
                    <p className="mt-1 text-sm font-semibold text-primary">{statusLabel[o.fulfillment_status] ?? o.fulfillment_status}</p>
                  </div>
                  <ChevronLeft className="size-4 text-muted-foreground" aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 grid place-items-center gap-4 rounded-[10px] border border-dashed p-10 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary"><Package className="size-6" /></span>
            <div>
              <p className="font-bold">مفيش طلبات لسه</p>
              <p className="mt-1 text-sm text-muted-foreground">ابدأ التسوق وأول طلب هيظهر هنا.</p>
            </div>
            <Button asChild><Link to="/shop">تسوق الآن</Link></Button>
          </div>
        )}
      </section>
    </div>
  );
}

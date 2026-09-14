import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Clock, PackageCheck, ShieldCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWholesale } from "@/hooks/use-wholesale";

export const Route = createFileRoute("/wholesale")({
  head: () => ({ meta: [
    { title: "تجار الجملة — TURBO" },
    { name: "description", content: "قدّم لتصبح تاجر TURBO مع وصول محمي للأسعار والطلبات التجارية." },
    { property: "og:title", content: "تجار الجملة — TURBO" },
    { property: "og:description", content: "بوابة تجار TURBO المحمية." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

function Page() {
  const { approved, status, minQuantity } = useWholesale();

  if (approved) return (
    <div className="turbo-container section-space">
      <div className="max-w-3xl">
        <p className="eyebrow">بوابة تجار الجملة</p>
        <h1 className="mt-4 flex flex-wrap items-center gap-4 text-4xl font-semibold leading-tight md:text-6xl">
          أهلاً بيك يا تاجر
          <span className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground">مقبول</span>
        </h1>
        <p className="mt-6 leading-8 text-muted-foreground">
          تم تطبيق أسعار الجملة على حسابك تلقائيًا في كل صفحات المتجر والسلة. أقل كمية لإتمام طلب الجملة {minQuantity} منتجات — مختلفة أو من نفس الموديل.
        </p>
      </div>
      <div className="mt-10 grid gap-3 md:grid-cols-3">
        {[[BadgeCheck, "أسعار الجملة مطبقة على حسابك"], [PackageCheck, `أقل كمية للطلب ${minQuantity} قطع`], [ShieldCheck, "الدفع عند الاستلام ومتابعة الطلب من حسابك"]].map(([Icon, text]) => {
          const I = Icon as typeof Store;
          return (
            <div key={String(text)} className="flex items-center gap-4 rounded-[10px] border border-border bg-card p-5">
              <I className="size-6 shrink-0 text-primary" />
              <strong className="text-sm">{String(text)}</strong>
            </div>
          );
        })}
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild size="lg"><Link to="/shop">ابدأ طلب الجملة</Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/cart">السلة</Link></Button>
      </div>
    </div>
  );

  if (status === "pending") return (
    <div className="turbo-container section-space min-h-[60vh] max-w-2xl text-center">
      <Clock className="mx-auto size-14 text-primary" />
      <h1 className="mt-5 text-4xl font-semibold">طلبك قيد المراجعة</h1>
      <p className="mt-4 leading-8 text-muted-foreground">هنبلغك بالنتيجة على بريدك وهتلاقيها كمان في حسابك. أسعار الجملة تفتح بعد الموافقة.</p>
      <Button asChild className="mt-7"><Link to="/account">حسابي</Link></Button>
    </div>
  );

  return (
    <div className="turbo-container section-space">
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-7">
          <p className="eyebrow">برنامج تجار الجملة</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">كبّر شغلك<br />مع TURBO.</h1>
          <p className="mt-6 max-w-xl leading-8 text-muted-foreground">
            قدّم بيانات نشاطك. بعد المراجعة والموافقة، هتشتغل بأسعار الجملة على المتجر كله، وأقل كمية للطلب {minQuantity} منتجات — مختلفة أو من نفس الموديل.
          </p>
          {status === "rejected" && <p className="mt-5 rounded-[10px] border border-border bg-off-white p-4 text-sm">طلبك السابق لم تتم الموافقة عليه. تقدر تكلمنا لمراجعة البيانات من جديد.</p>}
          <Button asChild size="lg" className="mt-8"><Link to="/wholesale-apply">سجّل وقدّم طلبك</Link></Button>
        </div>
        <div className="grid gap-3 md:col-span-5">
          {[[Store, "بيانات نشاط واضحة"], [ShieldCheck, "أسعار محمية للمقبولين فقط"], [PackageCheck, `أقل كمية ${minQuantity} قطع للطلب`]].map(([Icon, text]) => {
            const I = Icon as typeof Store;
            return (
              <div key={String(text)} className="flex items-center gap-4 rounded-[10px] border border-border bg-card p-5">
                <I className="size-6 shrink-0 text-primary" />
                <strong>{String(text)}</strong>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

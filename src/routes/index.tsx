import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Truck, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import mark from "@/assets/turbo-mark.svg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "TURBO Egypt — شارعك ملعبك" },
    { name: "description", content: "تسوّق ملابس TURBO الرياضية المصرية المصممة للملعب والشارع وكل يوم." },
    { property: "og:title", content: "TURBO Egypt — شارعك ملعبك" },
    { property: "og:description", content: "ملابس رياضية مصرية بروح الكورة والشارع." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: Index,
});

function Index() {
  return (
    <>
      <section className="relative min-h-[72vh] overflow-hidden bg-brand-black text-primary-foreground">
        <div className="brand-grid absolute inset-0 opacity-15" />
        <img src={mark.url} alt="" aria-hidden className="absolute -start-20 bottom-[-10%] w-[70vw] max-w-4xl opacity-20" />
        <div className="turbo-container relative grid min-h-[72vh] content-center py-16 md:grid-cols-12">
          <div className="reveal md:col-span-8 lg:col-span-7">
            <p className="mb-5 flex items-center gap-3 text-sm font-bold text-primary"><span className="h-px w-12 bg-primary"/> STREET MATCH · CAIRO</p>
            <h1 className="text-5xl font-bold leading-[1.12] sm:text-6xl lg:text-8xl">اتحرّك.<br/><span className="text-primary">العب.</span> كمّل.</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-primary-foreground/70 md:text-lg">من الملعب للشارع — قطع رياضية معمولة لحركة يومك، بسعر قريب منك وجودة تعتمد عليها.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/shop">تسوّق الآن <ArrowLeft/></Link></Button><Button asChild size="lg" variant="outline"><Link to="/new" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-brand-black">شوف الجديد</Link></Button></div>
          </div>
          <div className="mt-12 flex items-end justify-end md:col-span-4 md:mt-0 lg:col-span-5"><div className="border-s-2 border-primary ps-5 text-end"><div className="text-5xl font-bold">50<span className="text-primary">/</span>50</div><p className="mt-2 text-sm text-primary-foreground/60">كورة × شارع مصري</p></div></div>
        </div>
      </section>
      <section className="border-b border-border bg-off-white"><div className="turbo-container grid divide-y divide-border py-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:divide-x-reverse">{[[Truck,"توصيل لكل مصر"],[RefreshCcw,"استبدال سهل"],[ShieldCheck,"دفع آمن وموثوق"]].map(([Icon,label]) => <div key={String(label)} className="flex items-center justify-center gap-3 px-4 py-4 text-sm font-bold"><Icon className="size-5 text-primary"/>{label as string}</div>)}</div></section>
      <section className="section-space"><div className="turbo-container"><div className="mb-10 flex items-end justify-between gap-4"><div><p className="text-sm font-bold text-primary">اختار لعبتك</p><h2 className="mt-2 text-3xl font-bold md:text-5xl">كل يوم له طقم</h2></div><Link to="/categories" className="hidden font-bold underline decoration-primary decoration-2 underline-offset-8 sm:block">كل الفئات</Link></div><div className="grid gap-4 md:grid-cols-3">{["تيشيرتات الملعب","أساسيات الشارع","أطقم التدريب"].map((title,i)=><Link to="/shop" key={title} className="group relative min-h-72 overflow-hidden rounded-[10px] border border-border bg-card p-6 shadow-card"><span className="text-xs font-bold text-muted-foreground">0{i+1}</span><img src={mark.url} alt="" className="absolute -bottom-12 -start-12 w-64 opacity-[.07] transition-transform duration-300 group-hover:scale-110"/><h3 className="absolute bottom-6 text-2xl font-bold">{title}</h3></Link>)}</div></div></section>
      <section className="section-space bg-brand-black text-primary-foreground"><div className="turbo-container grid gap-12 md:grid-cols-12"><div className="md:col-span-7"><p className="text-sm font-bold text-primary">TURBO / STREET MATCH</p><h2 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">الكورة مش 90 دقيقة.<br/>دي طريقة عيش.</h2></div><div className="md:col-span-5 md:self-end"><p className="leading-8 text-primary-foreground/65">تصميم عملي، مقاسات واضحة، وحركة حقيقية. من التمرين للمشاوير من غير ما تغيّر شخصيتك.</p><Button asChild className="mt-6" variant="outline"><Link to="/about" className="border-primary-foreground/30 bg-transparent text-primary-foreground">اعرف حكايتنا</Link></Button></div></div></section>
      <section className="section-space"><div className="turbo-container text-center"><p className="text-sm font-bold text-primary">الجديد قريب</p><h2 className="mt-3 text-3xl font-bold md:text-5xl">أول تشكيلة TURBO</h2><p className="mx-auto mt-4 max-w-xl leading-7 text-muted-foreground">صور المنتجات والأسعار والمقاسات ستظهر هنا فور إضافتها من لوحة الإدارة — بدون منتجات وهمية.</p><Button asChild className="mt-8" size="lg"><Link to="/shop">ادخل المتجر</Link></Button></div></section>
    </>
  );
}

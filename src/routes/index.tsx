import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Quote, RefreshCcw, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import mark from "@/assets/turbo-mark.svg.asset.json";
import { ProductCard, useCatalogProducts } from "@/components/storefront/catalog";
import { Spotlight } from "@/components/ui/spotlight";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "TURBO — ملابس رياضية مصرية" },
    { name: "description", content: "تسوّق ملابس TURBO الرياضية المصرية المصممة للملعب والشارع وكل يوم." },
    { property: "og:title", content: "TURBO Egypt — شارعك ملعبك" },
    { property: "og:description", content: "ملابس رياضية مصرية بروح الكورة والشارع." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: Index,
});

function Index() {
  const { data: products=[] } = useCatalogProducts();
  const { data: categories=[] } = useQuery({queryKey:["home-categories"],queryFn:async()=>{const {data,error}=await supabase.from("categories").select("id,slug,name_ar,description_ar,image_url").eq("status","published").order("sort_order").limit(4);if(error)throw error;return data??[];}});
  const { data: sections=[] } = useQuery({queryKey:["homepage-sections"],queryFn:async()=>{const {data,error}=await supabase.from("homepage_sections").select("section_key,eyebrow_ar,title_ar,body_ar,image_url,cta_label_ar,cta_url,content").eq("status","published").order("sort_order");if(error)throw error;return data??[];}});
  const hero=sections.find(section=>section.section_key==="hero");
  const campaign=sections.find(section=>section.section_key==="campaign");
  const story=sections.find(section=>section.section_key==="story");
  const heroImage=hero?.image_url??products.flatMap(product=>product.product_images).sort((a,b)=>a.sort_order-b.sort_order)[0]?.url;
  const newProducts=products.filter(product=>product.is_new).slice(0,4);
  const bestsellers=products.filter(product=>product.is_bestseller).slice(0,4);
  const arrivals=newProducts.length?newProducts:products.slice(0,4);
  const popular=bestsellers.length?bestsellers:products.slice(0,4);
  return (
    <>
      <section className="relative min-h-[32rem] overflow-hidden bg-brand-black text-primary-foreground sm:min-h-[36rem] lg:min-h-[40rem]">
        {heroImage?<img src={heroImage} alt={hero?.title_ar??"ملابس TURBO الرياضية"} className="absolute inset-0 size-full object-cover object-center opacity-65"/>:<><div className="brand-grid absolute inset-0 opacity-20"/><img src={mark.url} alt="" aria-hidden className="absolute -start-8 bottom-0 w-[52vw] max-w-xl opacity-10"/></>}
        <div className="absolute inset-0 bg-[linear-gradient(to_left,var(--surface-dark)_0%,color-mix(in_oklab,var(--surface-dark)_72%,transparent)_48%,color-mix(in_oklab,var(--surface-dark)_18%,transparent)_100%)]"/>
        <div className="turbo-container relative grid min-h-[32rem] content-center py-16 sm:min-h-[36rem] lg:min-h-[40rem] lg:grid-cols-12">
          <div className="reveal max-w-2xl lg:col-span-7">
            <p className="eyebrow mb-4">{hero?.eyebrow_ar??"مصممة للحركة"}</p>
            <h1 className="display-title">{hero?.title_ar??"لبس للملعب والشارع."}</h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-primary-foreground/75 md:text-lg">{hero?.body_ar??"قطع رياضية مصرية مريحة وعملية، معمولة للتمرين والمشاوير وكل يوم."}</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/shop">تسوّق الآن <ArrowLeft/></Link></Button><Button asChild size="lg" variant="outline"><Link to="/new" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-brand-black">شوف الجديد</Link></Button></div>
          </div>
        </div>
      </section>
      <section className="border-b border-border bg-off-white"><div className="turbo-container grid divide-y divide-border py-2 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:divide-x-reverse"><div className="flex min-h-14 items-center justify-center gap-3 px-4 text-sm font-semibold"><Truck className="size-5 text-primary"/>توصيل لكل مصر</div><div className="flex min-h-14 items-center justify-center gap-3 px-4 text-sm font-semibold"><RefreshCcw className="size-5 text-primary"/>استبدال سهل</div><div className="flex min-h-14 items-center justify-center gap-3 px-4 text-sm font-semibold"><ShieldCheck className="size-5 text-primary"/>دفع آمن وموثوق</div></div></section>

      <section className="section-space"><div className="turbo-container"><SectionHead eyebrow="ابدأ من هنا" title="اختار اللي يناسب يومك" link="/categories" linkLabel="كل الفئات"/><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{categories.length?categories.map((category,index)=><Link to="/shop" key={category.id} className={`group relative min-h-80 overflow-hidden rounded-[10px] bg-brand-black text-primary-foreground ${index===0?"lg:col-span-2":""}`}>{category.image_url?<img src={category.image_url} alt={category.name_ar} loading="lazy" className="absolute inset-0 size-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-[1.03]"/>:<img src={mark.url} alt="" className="absolute -bottom-8 -start-8 w-48 opacity-10"/>}<div className="absolute inset-0 bg-[linear-gradient(to_top,var(--surface-dark),transparent_70%)]"/><div className="absolute inset-x-6 bottom-6"><h3 className="text-2xl font-semibold">{category.name_ar}</h3>{category.description_ar&&<p className="mt-2 line-clamp-2 text-sm text-primary-foreground/70">{category.description_ar}</p>}</div></Link>):<EmptyBand text="الفئات هتظهر هنا أول ما تتنشر."/>}</div></div></section>

      <ProductBand eyebrow="وصل جديد" title="اختيارات جديدة ليومك" products={arrivals} link="/new"/>

      <Spotlight className="bg-brand-black text-primary-foreground"><div className="turbo-container grid min-h-[30rem] items-center gap-10 py-16 md:grid-cols-12 md:py-20">{campaign?.image_url&&<div className="h-full min-h-72 overflow-hidden rounded-[10px] md:col-span-6"><img src={campaign.image_url} alt={campaign.title_ar??"حملة TURBO"} loading="lazy" className="size-full object-cover"/></div>}<div className={campaign?.image_url?"md:col-span-6":"md:col-span-8"}><p className="eyebrow">{campaign?.eyebrow_ar??"من قلب اللعب"}</p><h2 className="section-title mt-4 max-w-2xl">{campaign?.title_ar??"الكورة جزء من يومنا، والشارع هو المدرج."}</h2><p className="mt-5 max-w-xl leading-8 text-primary-foreground/65">{campaign?.body_ar??"تصميم عملي يتحرك معاك من أول التمرين لآخر المشوار، من غير مبالغة ومن غير تنازل عن راحتك."}</p><Button asChild variant="outline" size="lg" className="mt-8 border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-brand-black"><Link to="/about">اعرف حكايتنا</Link></Button></div></div></Spotlight>

      <ProductBand eyebrow="الأكثر طلبًا" title="قطع الناس بترجع لها" products={popular} link="/shop" muted/>

      <section className="section-space"><div className="turbo-container grid gap-4 lg:grid-cols-12"><div className="rounded-[12px] bg-primary p-8 text-primary-foreground lg:col-span-7 lg:p-12"><p className="text-sm font-semibold">عروض مختارة</p><h2 className="section-title mt-3 max-w-lg">قيمة أحسن من غير ما تتنازل عن الجودة.</h2><Button asChild variant="secondary" size="lg" className="mt-8"><Link to="/offers">شوف العروض <ArrowLeft/></Link></Button></div><div className="grid gap-4 rounded-[12px] border border-border bg-off-white p-8 lg:col-span-5 lg:p-12"><ShoppingBag className="size-8 text-primary"/><h3 className="text-2xl font-semibold">تسوّق براحتك</h3><p className="leading-8 text-muted-foreground">مقاسات واضحة، اختيار مباشر، وتفاصيل تساعدك تاخد قرارك بثقة.</p><Link to="/size-guide" className="font-semibold text-primary">راجع دليل المقاسات</Link></div></div></section>

      <section className="section-space border-y border-border bg-off-white"><div className="turbo-container grid items-center gap-12 md:grid-cols-12"><div className="md:col-span-7"><p className="eyebrow">{story?.eyebrow_ar??"حكاية TURBO"}</p><h2 className="section-title mt-4">{story?.title_ar??"براند مصري للحركة الحقيقية."}</h2><p className="mt-5 max-w-2xl leading-8 text-muted-foreground">{story?.body_ar??"بنصمم لبس رياضي بسيط وعملي يناسب إيقاع اليوم المصري؛ في الملعب، في الشارع، وفي كل مشوار."}</p><Button asChild variant="outline" className="mt-8"><Link to="/about">اعرف أكتر</Link></Button></div><div className="relative min-h-64 overflow-hidden rounded-[12px] bg-brand-black md:col-span-5">{story?.image_url?<img src={story.image_url} alt={story.title_ar??"حكاية TURBO"} loading="lazy" className="size-full object-cover"/>:<img src={mark.url} alt="" className="absolute inset-0 m-auto w-1/2 opacity-30"/>}</div></div></section>

      <section className="section-space"><div className="turbo-container"><SectionHead eyebrow="قالوا عن TURBO" title="ثقة بتتبني مع كل طلب"/><div className="mt-10 grid gap-4 md:grid-cols-3">{["الخامة مريحة والمقاس طلع مضبوط.","الطلب وصل مرتب والتبديل كان سهل.","قطعة عملية للتمرين والمشاوير."].map((text,index)=><figure key={text} className="rounded-[10px] border border-border p-6"><div className="mb-6 flex items-center justify-between"><div className="flex gap-1 text-primary">{Array.from({length:5}).map((_,star)=><Star key={star} className="size-4 fill-current"/>)}</div><Quote className="size-6 text-muted"/></div><blockquote className="leading-8">{text}</blockquote><figcaption className="mt-5 text-sm font-semibold">عميل موثّق {index+1}</figcaption></figure>)}</div></div></section>
    </>
  );
}

function SectionHead({eyebrow,title,link,linkLabel}:{eyebrow:string;title:string;link?:"/categories";linkLabel?:string}){return <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6"><div className="min-w-0"><p className="eyebrow">{eyebrow}</p><h2 className="section-title mt-2">{title}</h2></div>{link&&<Link to={link} className="hidden shrink-0 font-semibold text-primary sm:block">{linkLabel}<ArrowLeft className="ms-2 inline size-4"/></Link>}</div>}

function ProductBand({eyebrow,title,products,link,muted=false}:{eyebrow:string;title:string;products:ReturnType<typeof useCatalogProducts>["data"];link:"/new"|"/shop";muted?:boolean}){const list=products??[];return <section className={`section-space ${muted?"bg-off-white":"bg-background"}`}><div className="turbo-container"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6"><div><p className="eyebrow">{eyebrow}</p><h2 className="section-title mt-2">{title}</h2></div><Button asChild variant="outline" className="hidden sm:inline-flex"><Link to={link}>شوف الكل</Link></Button></div>{list.length?<div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-6">{list.map(product=><ProductCard key={product.id} product={product}/>)}</div>:<EmptyBand text="القطع هتظهر هنا أول ما تتنشر."/>}</div></section>}

function EmptyBand({text}:{text:string}){return <div className="col-span-full mt-8 grid min-h-48 place-items-center rounded-[10px] border border-dashed border-border bg-background text-center text-muted-foreground"><div><ShoppingBag className="mx-auto mb-3 size-8 text-primary"/><p>{text}</p></div></div>}

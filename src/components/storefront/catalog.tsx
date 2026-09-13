import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Heart, PackageOpen, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { toggleWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import mark from "@/assets/turbo-mark.svg.asset.json";

export type CatalogProduct = {
  id:string; slug:string; name_ar:string; name_en:string|null; is_new:boolean; is_bestseller:boolean;
  category_id:string|null; product_images:{url:string;alt_ar:string;sort_order:number}[];
  product_variants:{id:string;retail_price:number;compare_at_price:number|null;color_name_ar:string;color_value:string|null;size_label:string;sku:string}[];
};

export function useCatalogProducts(){return useQuery({queryKey:["catalog-products"],queryFn:async()=>{const {data,error}=await supabase.from("products").select("id,slug,name_ar,name_en,is_new,is_bestseller,category_id,product_images(url,alt_ar,sort_order),product_variants(id,retail_price,compare_at_price,color_name_ar,color_value,size_label,sku)").eq("status","published").order("created_at",{ascending:false});if(error)throw error;return (data??[]) as CatalogProduct[];}})}
export const money=(n:number)=>new Intl.NumberFormat("ar-EG",{style:"currency",currency:"EGP",maximumFractionDigits:0}).format(n);

export function ProductCard({product}:{product:CatalogProduct}){
  const { has } = useWishlist();
  const variants=product.product_variants??[]; const prices=variants.map(v=>v.retail_price); const price=prices.length?Math.min(...prices):null;
  const images=[...(product.product_images??[])].sort((a,b)=>a.sort_order-b.sort_order); const image=images[0]; const alternate=images[1];
  const comparePrices=variants.map(v=>v.compare_at_price).filter((value):value is number=>value!==null); const compare=comparePrices.length?Math.max(...comparePrices):null;
  const colors=Array.from(new Map(variants.map(v=>[v.color_name_ar,v.color_name_ar])).values()).slice(0,4);
  return <article className="group min-w-0"><div className="relative"><Link to="/products/$slug" params={{slug:product.slug}} className="relative block aspect-[4/5] overflow-hidden rounded-[10px] border border-border bg-off-white">
    {image?<><img src={image.url} alt={image.alt_ar} loading="lazy" className="size-full object-cover transition-opacity duration-300 group-hover:opacity-0"/>{alternate&&<img src={alternate.url} alt={alternate.alt_ar} loading="lazy" className="absolute inset-0 size-full object-cover opacity-0 transition-all duration-300 group-hover:scale-[1.02] group-hover:opacity-100"/>}</>:<img src={mark.url} alt="" className="absolute inset-0 m-auto w-1/2 opacity-[.08]"/>}
    <div className="absolute start-3 top-3 flex flex-wrap gap-2">{product.is_new&&<Badge>جديد</Badge>}{product.is_bestseller&&<Badge variant="secondary">الأكثر طلباً</Badge>}</div>
  </Link><Button type="button" variant="outline" size="icon" aria-label={has(product.id)?"إزالة من المفضلة":"أضف للمفضلة"} aria-pressed={has(product.id)} onClick={async()=>{const wasSaved=has(product.id);try{await toggleWishlist(product.id);toast.success(wasSaved?"اتشالت من المفضلة":"اتضافت للمفضلة")}catch{toast.error("تعذر تحديث المفضلة")}}} className={cn("absolute end-3 top-3 rounded-lg bg-background/95 shadow-none",has(product.id)&&"border-primary text-primary")}><Heart className={cn("size-5", has(product.id) && "fill-current")}/></Button><Button asChild size="sm" className="absolute inset-x-3 bottom-3 hidden opacity-0 transition-opacity duration-200 group-hover:flex group-hover:opacity-100"><Link to="/products/$slug" params={{slug:product.slug}}><ShoppingBag/> اختار المقاس</Link></Button></div><div className="mt-4"><Link to="/products/$slug" params={{slug:product.slug}} className="font-semibold transition-colors hover:text-primary">{product.name_ar}</Link><div className="mt-2 flex flex-wrap items-center gap-2"><span className="font-bold">{price===null?"السعر قريباً":money(price)}</span>{compare!==null&&price!==null&&compare>price&&<del className="text-sm text-muted-foreground">{money(compare)}</del>}</div>{colors.length>0&&<p className="mt-2 text-xs text-muted-foreground">{colors.join(" · ")}</p>}</div>
  </article>;
}

type Filters={category:string;size:string;color:string;sort:string};
const initial:Filters={category:"",size:"",color:"",sort:"new"};
function FilterFields({filters,setFilters,categories,sizes,colors}:{filters:Filters;setFilters:(x:Filters)=>void;categories:{id:string;name_ar:string}[];sizes:string[];colors:string[]}){return <div className="grid gap-6"><label className="grid gap-2 text-sm font-bold">الفئة<select className="h-11 rounded-lg border border-input bg-background px-3" value={filters.category} onChange={e=>setFilters({...filters,category:e.target.value})}><option value="">كل الفئات</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name_ar}</option>)}</select></label><fieldset><legend className="mb-3 text-sm font-bold">المقاس</legend><div className="flex flex-wrap gap-2"><Button size="sm" variant={!filters.size?"default":"outline"} onClick={()=>setFilters({...filters,size:""})}>الكل</Button>{sizes.map(s=><Button key={s} size="sm" variant={filters.size===s?"default":"outline"} onClick={()=>setFilters({...filters,size:s})}>{s}</Button>)}</div></fieldset><label className="grid gap-2 text-sm font-bold">اللون<select className="h-11 rounded-lg border border-input bg-background px-3" value={filters.color} onChange={e=>setFilters({...filters,color:e.target.value})}><option value="">كل الألوان</option>{colors.map(c=><option key={c} value={c}>{c}</option>)}</select></label><label className="grid gap-2 text-sm font-bold">الترتيب<select className="h-11 rounded-lg border border-input bg-background px-3" value={filters.sort} onChange={e=>setFilters({...filters,sort:e.target.value})}><option value="new">الأحدث</option><option value="low">السعر: الأقل أولاً</option><option value="high">السعر: الأعلى أولاً</option></select></label><Button variant="ghost" onClick={()=>setFilters(initial)}>مسح الفلاتر</Button></div>}

export function CatalogGrid(){
  const {data=[],isLoading,error}=useCatalogProducts(); const [filters,setFilters]=useState(initial);
  const {data:categories=[]}=useQuery({queryKey:["categories"],queryFn:async()=>{const {data,error}=await supabase.from("categories").select("id,name_ar").eq("status","published").order("sort_order");if(error)throw error;return data??[];}});
  const sizes=useMemo(()=>Array.from(new Set(data.flatMap(p=>p.product_variants.map(v=>v.size_label)))),[data]);
  const colors=useMemo(()=>Array.from(new Set(data.flatMap(p=>p.product_variants.map(v=>v.color_name_ar)))),[data]);
  const filtered=useMemo(()=>data.filter(p=>(!filters.category||p.category_id===filters.category)&&(!filters.size||p.product_variants.some(v=>v.size_label===filters.size))&&(!filters.color||p.product_variants.some(v=>v.color_name_ar===filters.color))).sort((a,b)=>{const ap=Math.min(...a.product_variants.map(v=>v.retail_price)),bp=Math.min(...b.product_variants.map(v=>v.retail_price));return filters.sort==="low"?ap-bp:filters.sort==="high"?bp-ap:0}),[data,filters]);
  if(isLoading)return <div className="grid grid-cols-2 gap-4 md:grid-cols-3"><div className="aspect-[4/5] animate-pulse rounded-[10px] bg-muted"/><div className="aspect-[4/5] animate-pulse rounded-[10px] bg-muted"/></div>;
  if(error)return <div className="rounded-[10px] border border-border p-8 text-center"><strong>تعذر تحميل المنتجات.</strong><p className="mt-2 text-sm text-muted-foreground">جرّب تحديث الصفحة بعد قليل.</p></div>;
  return <><div className="mb-6 flex items-center justify-between lg:hidden"><span className="text-sm text-muted-foreground">{filtered.length} منتج</span><Sheet><SheetTrigger asChild><Button variant="outline"><SlidersHorizontal/> فلترة</Button></SheetTrigger><SheetContent side="right"><SheetTitle>فلترة وترتيب</SheetTitle><div className="mt-8"><FilterFields {...{filters,setFilters,categories,sizes,colors}}/></div></SheetContent></Sheet></div><div className="grid gap-8 lg:grid-cols-[240px_1fr]"><aside className="hidden lg:block"><FilterFields {...{filters,setFilters,categories,sizes,colors}}/></aside><div>{filtered.length?<div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">{filtered.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<div className="grid min-h-72 place-items-center text-center"><div><PackageOpen className="mx-auto size-11 text-primary"/><h2 className="mt-4 text-xl font-bold">مفيش قطع مطابقة</h2><p className="mt-2 text-muted-foreground">غيّر الفلاتر وجرب تاني.</p></div></div>}</div></div></>;
}
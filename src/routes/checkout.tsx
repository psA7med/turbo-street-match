import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, CreditCard, Loader2, MapPin, PackageCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { money } from "@/components/storefront/catalog";
import { clearCart, useCart } from "@/lib/cart";
import { notifyOrderPlaced } from "@/lib/order-notification.functions";
import { startTurboOverlay } from "@/components/storefront/page-transition";
import { supabase } from "@/integrations/supabase/client";

type OrderResult={order_id:string;order_number:string;subtotal:number;shipping:number;total:number};
type CheckoutFields={customerName:string;phone:string;email:string;governorate:string;city:string;streetAddress:string;landmark:string};
const emptyFields:CheckoutFields={customerName:"",phone:"",email:"",governorate:"",city:"",streetAddress:"",landmark:""};

export const Route=createFileRoute("/checkout")({head:()=>({meta:[{title:"إتمام الطلب — TURBO"},{name:"description",content:"أدخل بيانات التوصيل واختر طريقة الدفع لإتمام طلب TURBO."},{property:"og:title",content:"إتمام طلب TURBO"},{property:"og:description",content:"خطوات واضحة وآمنة لإتمام الطلب."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}]}),component:Page});

function Page(){
  const {lines,subtotal}=useCart();
  const [fields,setFields]=useState(emptyFields);
  const [isSubmitting,setIsSubmitting]=useState(false);
  const [order,setOrder]=useState<OrderResult|null>(null);
  const {data:zones=[],isLoading:zonesLoading}=useQuery({queryKey:["shipping-zones"],queryFn:async()=>{const {data,error}=await supabase.from("shipping_zones").select("id,name_ar,governorates,fee,eta_min_days,eta_max_days,cod_available").eq("active",true).order("fee");if(error)throw error;return data??[];}});
  const governorates=useMemo(()=>Array.from(new Set(zones.flatMap(zone=>zone.governorates))).sort((a,b)=>a.localeCompare(b,"ar")),[zones]);
  const selectedZone=zones.find(zone=>zone.governorates.includes(fields.governorate));
  const shipping=selectedZone?.fee??0;
  const update=(key:keyof CheckoutFields,value:string)=>setFields(current=>({...current,[key]:value}));

  useEffect(()=>{
    let active=true;
    supabase.auth.getUser().then(async({data})=>{
      if(!active||!data.user)return;
      const[{data:profile},{data:address}]=await Promise.all([
        supabase.from("profiles").select("full_name,phone").eq("id",data.user.id).maybeSingle(),
        supabase.from("addresses").select("recipient_name,phone,governorate,city,street_address,landmark").eq("user_id",data.user.id).order("is_default",{ascending:false}).limit(1).maybeSingle(),
      ]);
      if(!active)return;
      setFields(current=>({customerName:address?.recipient_name||profile?.full_name||current.customerName,phone:address?.phone||profile?.phone||current.phone,email:data.user.email||current.email,governorate:address?.governorate||current.governorate,city:address?.city||current.city,streetAddress:address?.street_address||current.streetAddress,landmark:address?.landmark||current.landmark}));
    });
    return()=>{active=false};
  },[]);

  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(!/^01[0125][0-9]{8}$/.test(fields.phone)){toast.error("راجع رقم الموبايل",{description:"اكتب رقم مصري صحيح مكوّن من 11 رقم."});return;}
    if(!fields.email.trim()){toast.error("اكتب بريدك الإلكتروني",{description:"هنبعت عليه تأكيد الطلب."});return;}
    if(!selectedZone){toast.error("اختار محافظة متاحة للشحن");return;}
    setIsSubmitting(true);
    const stopOverlay=startTurboOverlay();
    const {data,error}=await supabase.rpc("place_retail_order",{p_customer_name:fields.customerName.trim(),p_phone:fields.phone,p_email:fields.email.trim(),p_governorate:fields.governorate,p_city:fields.city.trim(),p_street_address:fields.streetAddress.trim(),p_landmark:fields.landmark.trim(),p_items:lines.map(line=>({variant_id:line.variantId,quantity:line.quantity}))});
    if(error){stopOverlay();setIsSubmitting(false);const unavailable=error.message.includes("insufficient_stock")||error.message.includes("variant_unavailable");toast.error(unavailable?"قطعة في طلبك لم تعد متاحة":"تعذر تأكيد الطلب",{description:unavailable?"ارجع للسلة وحدّث اختياراتك.":"راجع البيانات وحاول مرة أخرى."});return;}
    const result=data as unknown as OrderResult;
    try {
      await notifyOrderPlaced({data:{orderId:result.order_id}});
    } catch {
      // The order is already confirmed; email delivery can be retried independently.
    }
    setIsSubmitting(false);
    clearCart();
    setOrder(result);
    window.scrollTo({top:0,behavior:"smooth"});
    stopOverlay();
  };


  if(order)return <div className="turbo-container section-space min-h-[65vh]"><div className="mx-auto max-w-2xl rounded-[12px] border border-border bg-card p-6 text-center sm:p-10"><CheckCircle2 className="mx-auto size-14 text-primary"/><p className="eyebrow mt-6">تم استلام طلبك</p><h1 className="mt-3 text-3xl font-bold sm:text-5xl">طلبك دخل الملعب.</h1><p className="mt-4 leading-8 text-muted-foreground">هنراجع الطلب ونتواصل معاك على رقم الموبايل لتأكيد التوصيل.</p><div className="mt-8 rounded-[10px] bg-off-white p-5"><span className="text-sm text-muted-foreground">رقم الطلب</span><strong dir="ltr" className="mt-1 block text-2xl">#{order.order_number}</strong><div className="mt-4 flex justify-between border-t border-border pt-4"><span>الإجمالي</span><strong>{money(order.total)}</strong></div></div><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild size="lg"><Link to="/shop">كمّل تسوق</Link></Button><Button asChild size="lg" variant="outline"><Link to="/">الرئيسية</Link></Button></div></div></div>;
  if(!lines.length)return <div className="turbo-container section-space min-h-[60vh] text-center"><PackageCheck className="mx-auto size-12 text-primary"/><h1 className="mt-4 text-3xl font-bold">ابدأ بالسلة</h1><p className="mt-2 text-muted-foreground">أضف قطعك ومقاساتك قبل إتمام الطلب.</p><Button asChild className="mt-6"><Link to="/shop">المتجر</Link></Button></div>;

  return <div className="turbo-container section-space"><div className="mb-10"><p className="eyebrow">إتمام الطلب</p><h1 className="mt-2 text-4xl font-bold md:text-6xl">كمّل طلبك</h1><p className="mt-3 text-muted-foreground">من غير إنشاء حساب إجباري.</p></div><form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_380px]"><div className="grid gap-8"><section className="rounded-[10px] border border-border bg-card p-5 sm:p-6"><h2 className="flex items-center gap-3 text-xl font-bold"><span className="grid size-8 place-items-center rounded-full bg-primary text-sm text-primary-foreground">1</span> بيانات التواصل</h2><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">الاسم بالكامل<Input required minLength={3} autoComplete="name" value={fields.customerName} onChange={event=>update("customerName",event.target.value)}/></label><label className="grid gap-2 text-sm font-bold">رقم الموبايل<Input required type="tel" dir="ltr" inputMode="numeric" pattern="01[0125][0-9]{8}" autoComplete="tel" placeholder="01xxxxxxxxx" value={fields.phone} onChange={event=>update("phone",event.target.value.replace(/\D/g,"").slice(0,11))}/></label><label className="grid gap-2 text-sm font-bold sm:col-span-2">البريد الإلكتروني <span className="font-normal text-muted-foreground">(هنبعت عليه تأكيد الطلب)</span><Input required type="email" dir="ltr" autoComplete="email" value={fields.email} onChange={event=>update("email",event.target.value)}/></label></div></section><section className="rounded-[10px] border border-border bg-card p-5 sm:p-6"><h2 className="flex items-center gap-3 text-xl font-bold"><MapPin className="size-6 text-primary"/> عنوان التوصيل</h2><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">المحافظة<select required className="h-11 rounded-lg border border-input bg-background px-3" value={fields.governorate} onChange={event=>update("governorate",event.target.value)}><option value="">{zonesLoading?"جاري تحميل المحافظات...":"اختار المحافظة"}</option>{governorates.map(name=><option key={name} value={name}>{name}</option>)}</select></label><label className="grid gap-2 text-sm font-bold">المدينة<Input required minLength={2} autoComplete="address-level2" value={fields.city} onChange={event=>update("city",event.target.value)}/></label><label className="grid gap-2 text-sm font-bold sm:col-span-2">العنوان بالتفصيل<Input required minLength={5} autoComplete="street-address" value={fields.streetAddress} onChange={event=>update("streetAddress",event.target.value)}/></label><label className="grid gap-2 text-sm font-bold sm:col-span-2">علامة مميزة <span className="font-normal text-muted-foreground">(اختياري)</span><Input value={fields.landmark} onChange={event=>update("landmark",event.target.value)}/></label></div>{selectedZone&&<p className="mt-4 text-sm text-muted-foreground">التوصيل خلال {selectedZone.eta_min_days}–{selectedZone.eta_max_days} أيام عمل.</p>}</section><section className="rounded-[10px] border border-border bg-card p-5 sm:p-6"><h2 className="flex items-center gap-3 text-xl font-bold"><CreditCard className="size-6 text-primary"/> الدفع</h2><label className="mt-6 flex cursor-pointer items-center gap-3 rounded-lg border border-primary bg-accent p-4"><input type="radio" name="payment" defaultChecked/> <strong>الدفع عند الاستلام</strong></label><p className="mt-3 text-sm text-muted-foreground">ادفع قيمة الطلب عند وصوله لعنوانك.</p></section></div><aside className="h-fit rounded-[10px] bg-brand-black p-6 text-primary-foreground lg:sticky lg:top-28"><h2 className="text-xl font-bold">راجع طلبك</h2><div className="mt-5 grid gap-4">{lines.map(line=><div key={line.variantId} className="flex justify-between gap-4 border-b border-primary-foreground/15 pb-4 text-sm"><div><strong>{line.name}</strong><p className="mt-1 text-primary-foreground/55">{line.color} · {line.size} · ×{line.quantity}</p></div><span>{money(line.unitPrice*line.quantity)}</span></div>)}</div><div className="mt-5 flex justify-between"><span>الإجمالي الفرعي</span><strong>{money(subtotal)}</strong></div><div className="mt-3 flex justify-between text-sm text-primary-foreground/60"><span className="flex items-center gap-2"><Truck className="size-4"/> الشحن</span><span>{selectedZone?money(shipping):"اختار المحافظة"}</span></div><div className="mt-5 flex justify-between border-t border-primary-foreground/15 pt-5 text-lg"><strong>الإجمالي</strong><strong>{money(subtotal+shipping)}</strong></div><Button type="submit" size="lg" className="mt-6 w-full" disabled={isSubmitting||!selectedZone}>{isSubmitting?<><Loader2 className="animate-spin"/> جاري تأكيد الطلب</>:"تأكيد الطلب"}</Button><p className="mt-3 text-center text-xs text-primary-foreground/50">السعر والمخزون بيتراجعوا بأمان وقت التأكيد.</p></aside></form></div>;
}
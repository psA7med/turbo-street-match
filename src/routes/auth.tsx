import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import logo from "@/assets/turbo-logo.svg.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route=createFileRoute("/auth")({
  head:()=>({meta:[
    {title:"حسابك — TURBO"},
    {name:"description",content:"سجل الدخول إلى حساب TURBO لمتابعة الطلبات وطلبات الجملة."},
    {property:"og:title",content:"حساب TURBO"},
    {property:"og:description",content:"تابع طلباتك وبياناتك بأمان."},
    {property:"og:type",content:"website"},
    {name:"twitter:card",content:"summary"},
  ]}),
  component:AuthPage,
});

function AuthPage(){
  const [mode,setMode]=useState<"signin"|"signup">("signin"); const [loading,setLoading]=useState(false); const navigate=useNavigate();
  const submit=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();setLoading(true);const fd=new FormData(e.currentTarget);const email=String(fd.get("email")??"");const password=String(fd.get("password")??"");const result=mode==="signin"?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password});setLoading(false);if(result.error){toast.error("تعذر إكمال الطلب",{description:result.error.message});return}if(mode==="signup"&&!result.data.session){toast.success("راجع بريدك الإلكتروني لتأكيد الحساب");return}toast.success("أهلاً بيك في TURBO");navigate({to:"/shop"})};
  const google=async()=>{setLoading(true);const result=await lovable.auth.signInWithOAuth("google",{redirect_uri:window.location.origin+"/auth"});if(result.error){setLoading(false);toast.error("تعذر الدخول بجوجل",{description:result.error.message})}};
  return <div className="turbo-container section-space"><div className="mx-auto max-w-md rounded-[12px] border border-border bg-card p-6 shadow-card sm:p-8"><img src={logo.url} alt="TURBO" className="mx-auto h-12 w-40 object-contain"/><h1 className="mt-8 text-center text-3xl font-bold">{mode==="signin"?"ادخل حسابك":"اعمل حساب جديد"}</h1><p className="mt-2 text-center text-sm text-muted-foreground">لمتابعة الطلبات أو التقديم كتاجر جملة.</p><div className="mt-6 grid grid-cols-2 rounded-lg bg-muted p-1"><Button variant={mode==="signin"?"secondary":"ghost"} onClick={()=>setMode("signin")}>دخول</Button><Button variant={mode==="signup"?"secondary":"ghost"} onClick={()=>setMode("signup")}>حساب جديد</Button></div><form onSubmit={submit} className="mt-6 grid gap-4"><label className="grid gap-2 text-sm font-bold">البريد الإلكتروني<Input name="email" required type="email" dir="ltr" autoComplete="email" placeholder="email@example.com"/></label><label className="grid gap-2 text-sm font-bold">كلمة المرور<Input name="password" required minLength={8} type="password" dir="ltr" autoComplete={mode==="signin"?"current-password":"new-password"}/></label><Button type="submit" size="lg" disabled={loading}>{loading?<LoaderCircle className="animate-spin"/>:mode==="signin"?"تسجيل الدخول":"إنشاء الحساب"}</Button></form><div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border"/>أو<span className="h-px flex-1 bg-border"/></div><Button type="button" variant="outline" size="lg" className="w-full" disabled={loading} onClick={google}><span dir="ltr">G</span> المتابعة بجوجل</Button><p className="mt-6 text-center text-sm text-muted-foreground">التسوق العادي وإتمام الطلب لا يحتاجان إلى حساب.</p></div></div>}
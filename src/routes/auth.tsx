import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import logo from "@/assets/turbo-logo.svg.asset.json";

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

function AuthPage(){return <div className="turbo-container section-space"><div className="mx-auto max-w-md rounded-[12px] border border-border bg-card p-6 shadow-card sm:p-8"><img src={logo.url} alt="TURBO" className="mx-auto h-12 w-40 object-contain"/><h1 className="mt-8 text-center text-3xl font-bold">ادخل حسابك</h1><p className="mt-2 text-center text-sm text-muted-foreground">لمتابعة الطلبات أو التقديم كتاجر جملة.</p><form className="mt-8 grid gap-4"><label className="grid gap-2 text-sm font-bold">البريد الإلكتروني<Input type="email" dir="ltr" autoComplete="email" placeholder="email@example.com"/></label><label className="grid gap-2 text-sm font-bold">كلمة المرور<Input type="password" dir="ltr" autoComplete="current-password"/></label><Button type="button" size="lg">تسجيل الدخول</Button></form><p className="mt-6 text-center text-sm text-muted-foreground">التسوق العادي وإتمام الطلب لا يحتاجان إلى حساب.</p></div></div>}
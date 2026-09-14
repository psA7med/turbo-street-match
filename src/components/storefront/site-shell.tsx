import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Heart, LogIn, Menu, Search, ShoppingBag, Store, UserRound } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import darkLogo from "@/assets/turbo-logo-dark.svg.asset.json";
import mark from "@/assets/turbo-mark.svg.asset.json";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { startNavTransition } from "@/components/storefront/page-transition";

const links = [
  ["المتجر", "/shop"], ["الفئات", "/categories"], ["وصل جديد", "/new"],
  ["العروض", "/offers"], ["حكايتنا", "/about"],
] as const;

type AccountState = "guest" | "customer" | "pending" | "wholesale" | "admin";

function useAccountState() {
  const [state, setState] = useState<AccountState>("guest");
  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!active || !data.user) { setState("guest"); return; }
      const [{ data: roles }, { data: application }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", data.user.id),
        supabase.from("wholesale_applications").select("status").eq("user_id", data.user.id).maybeSingle(),
      ]);
      const names = (roles ?? []).map((item) => item.role);
      if (names.includes("admin") || names.includes("super_admin")) setState("admin");
      else if (names.includes("wholesale")) setState("wholesale");
      else if (application?.status === "pending") setState("pending");
      else setState("customer");
    }
    void load();
    const { data: listener } = supabase.auth.onAuthStateChange(() => { void load(); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  return state;
}

export function SiteHeader() {
  const { count: wishlistCount } = useWishlist();
  const { count } = useCart();
  const accountState = useAccountState();
  return <>
    <div className="bg-primary px-4 py-2 text-center text-xs font-semibold text-primary-foreground">توصيل لكل محافظات مصر · استبدال سهل خلال 14 يوم</div>
    <header className="sticky top-0 z-40 border-b border-primary-foreground/10 bg-brand-black text-primary-foreground">
      <div className="turbo-container grid h-16 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 lg:h-20 lg:grid-cols-[auto_minmax(20rem,1fr)_auto] lg:gap-8">
        <div className="flex items-center justify-self-start lg:hidden">
          <Sheet><SheetTrigger asChild><Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" aria-label="فتح القائمة"><Menu /></Button></SheetTrigger>
            <SheetContent side="right" className="w-[88%] max-w-sm"><SheetTitle className="text-start">القائمة</SheetTitle><nav className="mt-8 grid gap-1">{links.map(([label,to]) => <Link key={to} to={to} className="border-b border-border py-4 text-lg font-semibold">{label}</Link>)}<Link to="/wholesale" className="py-4 text-lg font-semibold text-primary">تجار الجملة</Link>{accountState === "admin"&&<Link to="/admin/wholesale" className="py-4 text-lg font-semibold text-primary">لوحة الإدارة — طلبات الجملة</Link>}{accountState !== "guest"&&<Link to="/account" className="py-4 text-lg font-semibold">حسابي</Link>}</nav></SheetContent>
          </Sheet>
        </div>
        <div className="flex min-w-0 items-center gap-8 lg:contents">
           <Link to="/" aria-label="TURBO الصفحة الرئيسية" className="justify-self-center lg:order-first lg:justify-self-auto"><img src={darkLogo.url} alt="TURBO" className="h-9 w-32 object-contain lg:h-11 lg:w-40" /></Link>
          <div className="hidden min-w-0 lg:block">
            <div className="flex items-center gap-7">
              <nav className="flex shrink-0 items-center gap-5 text-sm font-medium">{links.map(([label,to]) => <Link key={to} to={to} className="transition-colors duration-150 hover:text-primary" activeProps={{className:"text-primary"}}>{label}</Link>)}</nav>
              <Link to="/search" className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 px-4 text-sm text-primary-foreground/60 transition-colors hover:border-primary/60"><Search className="size-5 shrink-0"/><span className="truncate">ابحث عن قطعة أو مقاس</span></Link>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-self-end">
          <Link className="grid size-11 place-items-center lg:hidden" to="/search" aria-label="البحث"><Search className="size-5" /></Link>
          {accountState === "guest" ? <Button asChild variant="ghost" className="hidden text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground lg:inline-flex"><Link to="/auth"><LogIn/> تسجيل الدخول</Link></Button> : <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="hidden text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground lg:inline-flex"><UserRound/> حسابي <ChevronDown className="size-4"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel>حساب TURBO</DropdownMenuLabel><DropdownMenuSeparator/><DropdownMenuItem asChild><Link to="/account"><UserRound/> الحساب والطلبات</Link></DropdownMenuItem>{accountState === "pending"&&<DropdownMenuItem asChild><Link to="/wholesale-apply"><Store/> حالة طلب الجملة</Link></DropdownMenuItem>}{accountState === "wholesale"&&<DropdownMenuItem asChild><Link to="/wholesale"><Store/> بوابة تجار الجملة</Link></DropdownMenuItem>}{accountState === "admin"&&<DropdownMenuItem asChild><Link to="/admin/wholesale"><Store/> طلبات تجار الجملة</Link></DropdownMenuItem>}</DropdownMenuContent></DropdownMenu>}
          <Link className="grid size-11 place-items-center lg:hidden" to={accountState === "guest" ? "/auth" : "/account"} aria-label={accountState === "guest" ? "تسجيل الدخول" : "الحساب"}><UserRound className="size-5" /></Link>
          <Link className="relative grid size-11 place-items-center" to="/wishlist" aria-label={`المفضلة، ${wishlistCount} قطع`}><Heart className="size-5" />{wishlistCount>0&&<span className="absolute end-0 top-0 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{wishlistCount}</span>}</Link>
          <Link className="relative grid size-11 place-items-center" to="/cart" aria-label={`السلة، ${count} قطع`}><ShoppingBag className="size-5" />{count>0&&<span className="absolute end-0 top-0 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{count}</span>}</Link>
        </div>
      </div>
      <div className="hidden border-t border-primary-foreground/10 lg:block"><div className="turbo-container flex h-10 items-center justify-between text-xs"><Link to="/wholesale" className="font-semibold text-primary">تجار الجملة</Link><span className="text-primary-foreground/55">ملابس رياضية مصرية للملعب والشارع وكل يوم</span></div></div>
    </header>
  </>;
}

export function SiteFooter() {
  return <footer className="bg-brand-black text-primary-foreground"><div className="turbo-container grid gap-10 py-16 md:grid-cols-4">
    <div className="md:col-span-2"><img src={darkLogo.url} alt="TURBO" className="h-12 w-48 object-contain"/><p className="mt-6 max-w-md text-sm leading-7 text-primary-foreground/70">ملابس رياضية مصرية مصممة لحركة الشارع وروح الملعب وكل يوم.</p></div>
    <div><h2 className="font-bold">خدمة العملاء</h2><nav className="mt-4 grid gap-3 text-sm text-primary-foreground/70"><Link to="/shipping">الشحن والاستبدال</Link><Link to="/size-guide">دليل المقاسات</Link><Link to="/faq">الأسئلة الشائعة</Link><Link to="/contact">تواصل معنا</Link></nav></div>
    <div><img src={mark.url} alt="علامة T من TURBO" className="h-24 w-24 object-contain opacity-70"/><p className="mt-4 text-xs text-primary-foreground/50">© 2026 TURBO EGYPT</p></div>
  </div></footer>;
}
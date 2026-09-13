import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/turbo-logo.svg.asset.json";
import mark from "@/assets/turbo-mark.svg.asset.json";
import { useCart } from "@/lib/cart";

const links = [
  ["المتجر", "/shop"], ["الفئات", "/categories"], ["جديد", "/new"],
  ["العروض", "/offers"], ["عن TURBO", "/about"], ["الجملة", "/wholesale"],
] as const;

export function SiteHeader() {
  const { count } = useCart();
  return <>
    <div className="bg-brand-black px-4 py-2 text-center text-xs font-semibold text-primary-foreground">توصيل لكل محافظات مصر · استبدال سهل خلال 14 يوم</div>
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="turbo-container flex h-18 items-center justify-between gap-4">
        <div className="flex items-center gap-2 lg:hidden">
          <Sheet><SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="فتح القائمة"><Menu /></Button></SheetTrigger>
            <SheetContent side="right" className="w-[88%] max-w-sm"><SheetTitle className="text-start">القائمة</SheetTitle><nav className="mt-8 grid gap-2">{links.map(([label,to]) => <Link key={to} to={to} className="border-b border-border py-4 text-lg font-bold">{label}</Link>)}</nav></SheetContent>
          </Sheet>
          <Link to="/search" aria-label="البحث"><Search className="size-5" /></Link>
        </div>
        <Link to="/" aria-label="TURBO الصفحة الرئيسية"><img src={logo.url} alt="TURBO" className="h-10 w-36 object-contain" /></Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold lg:flex">{links.map(([label,to]) => <Link key={to} to={to} activeProps={{className:"text-primary"}}>{label}</Link>)}</nav>
        <div className="flex items-center gap-1">
          <Link className="hidden p-3 lg:block" to="/search" aria-label="البحث"><Search className="size-5" /></Link>
          <Link className="p-3" to="/auth" aria-label="الحساب"><UserRound className="size-5" /></Link>
          <Link className="relative p-3" to="/cart" aria-label={`السلة، ${count} قطع`}><ShoppingBag className="size-5" />{count>0&&<span className="absolute end-1 top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{count}</span>}</Link>
        </div>
      </div>
    </header>
  </>;
}

export function SiteFooter() {
  return <footer className="bg-brand-black text-primary-foreground"><div className="turbo-container grid gap-10 py-16 md:grid-cols-4">
    <div className="md:col-span-2"><img src={logo.url} alt="TURBO" className="h-16 w-56 bg-off-white object-contain p-2"/><p className="mt-6 max-w-md text-sm leading-7 text-primary-foreground/70">ملابس رياضية مصرية مصممة لحركة الشارع وروح الملعب وكل يوم.</p></div>
    <div><h2 className="font-bold">خدمة العملاء</h2><nav className="mt-4 grid gap-3 text-sm text-primary-foreground/70"><Link to="/shipping">الشحن والاستبدال</Link><Link to="/size-guide">دليل المقاسات</Link><Link to="/faq">الأسئلة الشائعة</Link><Link to="/contact">تواصل معنا</Link></nav></div>
    <div><img src={mark.url} alt="علامة T من TURBO" className="h-24 w-24 object-contain opacity-70"/><p className="mt-4 text-xs text-primary-foreground/50">© 2026 TURBO EGYPT</p></div>
  </div></footer>;
}
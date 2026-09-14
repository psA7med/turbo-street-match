import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell, Boxes, ClipboardList, FileText, LayoutDashboard, LogOut, Menu, MessageSquareQuote,
  PanelLeftClose, PanelLeftOpen, Ruler, Search, Settings, Shirt, ShoppingCart, Store, Tags, Truck, UserRound, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { adminGlobalSearch, ensureAdmin } from "@/lib/admin.functions";
import { money } from "@/components/admin/ui";
import darkLogo from "@/assets/turbo-logo-dark.svg.asset.json";
import mark from "@/assets/turbo-mark.svg.asset.json";

const nav = [
  { to: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "الطلبات", icon: ShoppingCart },
  { to: "/admin/products", label: "المنتجات", icon: Shirt },
  { to: "/admin/inventory", label: "المخزون", icon: Boxes },
  { to: "/admin/categories", label: "الفئات", icon: Tags },
  { to: "/admin/customers", label: "العملاء", icon: Users },
  { to: "/admin/reviews", label: "التقييمات", icon: MessageSquareQuote },
  { to: "/admin/wholesale", label: "الجملة", icon: Store },
  { to: "/admin/content", label: "محتوى الرئيسية", icon: FileText },
  { to: "/admin/shipping", label: "الشحن", icon: Truck },
  { to: "/admin/size-guides", label: "دليل المقاسات", icon: Ruler },
  { to: "/admin/settings", label: "الإعدادات", icon: Settings },
] as { to: any; label: string; icon: any; exact?: boolean }[];

const titles: Record<string, string> = {
  "/admin": "لوحة التحكم",
  "/admin/orders": "الطلبات",
  "/admin/products": "المنتجات",
  "/admin/inventory": "المخزون",
  "/admin/categories": "الفئات",
  "/admin/customers": "العملاء",
  "/admin/reviews": "التقييمات",
  "/admin/wholesale": "طلبات الجملة",
  "/admin/content": "محتوى الرئيسية",
  "/admin/shipping": "مناطق الشحن",
  "/admin/size-guides": "أدلة المقاسات",
  "/admin/settings": "الإعدادات",
};

function useCurrentPath() {
  return useRouterState({ select: (state) => state.location.pathname });
}

function NavList({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const path = useCurrentPath();
  return (
    <nav aria-label="أقسام لوحة الإدارة" className="grid gap-1">
      {nav.map((item) => {
        const active = item.exact ? path === item.to : path.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground",
              active && "bg-primary text-primary-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function GlobalSearch() {
  const run = useServerFn(adminGlobalSearch);
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 300);
    return () => clearTimeout(timer);
  }, [term]);
  const query = useQuery({
    queryKey: ["admin-search", debounced],
    queryFn: () => run({ data: { term: debounced } }),
    enabled: debounced.length >= 2,
  });
  const results = query.data;
  const hasResults = results && (results.orders.length || results.products.length || results.customers.length || results.applications.length);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-9 w-full justify-start gap-2 px-3 text-sm font-normal text-muted-foreground sm:w-64">
          <Search className="size-4" aria-hidden="true" /> بحث في الطلبات والمنتجات…
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>البحث الشامل</DialogTitle></DialogHeader>
        <Input autoFocus value={term} onChange={(event) => setTerm(event.target.value)} placeholder="رقم طلب، منتج، عميل، أو تاجر جملة" aria-label="كلمة البحث" />
        <div className="max-h-80 overflow-y-auto text-sm">
          {debounced.length < 2 && <p className="p-3 text-muted-foreground">اكتب حرفين على الأقل.</p>}
          {query.isFetching && <p className="p-3 text-muted-foreground">جاري البحث…</p>}
          {debounced.length >= 2 && !query.isFetching && !hasResults && <p className="p-3 text-muted-foreground">لا نتائج.</p>}
          {results?.orders?.length ? <div className="border-b border-border py-2"><p className="px-3 pb-1 text-xs font-bold text-muted-foreground">طلبات</p>{results.orders.map((order: any) => <Link key={order.id} to="/admin/orders/$id" params={{ id: order.id }} className="flex items-center justify-between px-3 py-2 hover:bg-accent"><span dir="ltr">{order.order_number}</span><span>{money(order.grand_total)}</span></Link>)}</div> : null}
          {results?.products?.length ? <div className="border-b border-border py-2"><p className="px-3 pb-1 text-xs font-bold text-muted-foreground">منتجات</p>{results.products.map((product: any) => <Link key={product.id} to="/admin/products/$id" params={{ id: product.id }} className="block px-3 py-2 hover:bg-accent">{product.name_ar}</Link>)}</div> : null}
          {results?.customers?.length ? <div className="border-b border-border py-2"><p className="px-3 pb-1 text-xs font-bold text-muted-foreground">عملاء</p>{results.customers.map((customer: any) => <Link key={customer.id} to="/admin/customers" className="block px-3 py-2 hover:bg-accent">{customer.full_name || customer.id}</Link>)}</div> : null}
          {results?.applications?.length ? <div className="py-2"><p className="px-3 pb-1 text-xs font-bold text-muted-foreground">طلبات جملة</p>{results.applications.map((application: any) => <Link key={application.id} to="/admin/wholesale" className="block px-3 py-2 hover:bg-accent">{application.business_name}</Link>)}</div> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const path = useCurrentPath();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const check = useServerFn(ensureAdmin);
  const guard = useQuery({ queryKey: ["admin-guard"], queryFn: () => check(), refetchInterval: 60000, retry: false });

  useEffect(() => {
    setCollapsed(localStorage.getItem("turbo-admin-collapsed") === "1");
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      localStorage.setItem("turbo-admin-collapsed", current ? "0" : "1");
      return !current;
    });
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const alerts = guard.data?.alerts;
  const alertCount = (alerts?.pendingOrders ?? 0) + (alerts?.pendingWholesale ?? 0) + (alerts?.pendingReviews ?? 0);
  const title = titles[path] ?? (path.startsWith("/admin/orders/") ? "تفاصيل الطلب" : path.startsWith("/admin/products") ? "المنتجات" : "الإدارة");

  if (guard.isError) {
    return (
      <div className="grid min-h-screen place-items-center bg-off-white p-6 text-center">
        <div>
          <img src={mark.url} alt="TURBO" className="mx-auto h-12 w-12" />
          <h1 className="mt-4 text-2xl font-extrabold">غير مسموح بالدخول</h1>
          <p className="mt-2 text-sm text-muted-foreground">لوحة الإدارة متاحة لحسابات الإدارة فقط.</p>
          <Button asChild className="mt-6"><Link to="/">الرجوع للمتجر</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white lg:grid" style={{ gridTemplateColumns: collapsed ? "4.5rem 1fr" : "16rem 1fr" }}>
      <aside className="sticky top-0 hidden h-screen flex-col bg-brand-black p-3 lg:flex">
        <div className={cn("flex items-center gap-2 px-1 py-3", collapsed && "justify-center px-0")}>
          <Link to="/admin" aria-label="لوحة إدارة TURBO">
            {collapsed ? <img src={mark.url} alt="TURBO" className="size-8" /> : <img src={darkLogo.url} alt="TURBO" className="h-8 w-28 object-contain" />}
          </Link>
        </div>
        <div className="admin-nav-scroll mt-2 flex-1 overflow-y-auto"><NavList collapsed={collapsed} /></div>
        <div className="grid gap-1 border-t border-primary-foreground/10 pt-3">
          {!collapsed && <p dir="ltr" className="truncate px-3 text-xs text-primary-foreground/50">{email}</p>}
          <Link to="/account" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-primary-foreground/70 hover:bg-primary-foreground/10", collapsed && "justify-center px-0")} title="ملف الإدارة">
            <UserRound className="size-4" aria-hidden="true" />{!collapsed && "ملف الإدارة"}
          </Link>
          <button type="button" onClick={signOut} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-primary-foreground/70 hover:bg-primary-foreground/10", collapsed && "justify-center px-0")}>
            <LogOut className="size-4" aria-hidden="true" />{!collapsed && "تسجيل الخروج"}
          </button>
          <Button variant="ghost" size="sm" onClick={toggleCollapsed} className="mt-1 text-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground" aria-label={collapsed ? "توسيع القائمة" : "تصغير القائمة"}>
            {collapsed ? <PanelLeftOpen /> : <><PanelLeftClose /> تصغير</>}
          </Button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-2.5">
            <Sheet>
              <SheetTrigger asChild><Button variant="outline" size="icon" className="lg:hidden" aria-label="فتح قائمة الإدارة"><Menu /></Button></SheetTrigger>
              <SheetContent side="right" className="w-[84%] max-w-xs bg-brand-black p-3">
                <SheetTitle className="px-1 text-start text-primary-foreground">لوحة الإدارة</SheetTitle>
                <div className="mt-6"><NavList /></div>
              </SheetContent>
            </Sheet>
            <Link to="/admin" className="lg:hidden" aria-label="TURBO"><img src={mark.url} alt="" className="size-7" /></Link>
            <div className="min-w-0 flex-1">
              <nav aria-label="مسار التنقل" className="hidden text-xs text-muted-foreground sm:block">
                <Link to="/admin" className="hover:text-foreground">الإدارة</Link>
                {path !== "/admin" && <> / <span className="text-foreground">{title}</span></>}
              </nav>
              <h2 className="truncate text-sm font-bold sm:text-base">{title}</h2>
            </div>
            <div className="hidden sm:block"><GlobalSearch /></div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative" aria-label={`تنبيهات، ${alertCount}`}>
                  <Bell />
                  {alertCount > 0 && <span className="absolute -end-1 -top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{alertCount}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-2 text-sm">
                <p className="px-2 pb-2 text-xs font-bold text-muted-foreground">يحتاج انتباه</p>
                <Link to="/admin/orders" className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-accent"><span>طلبات بانتظار التأكيد</span><strong>{alerts?.pendingOrders ?? 0}</strong></Link>
                <Link to="/admin/wholesale" className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-accent"><span>طلبات جملة جديدة</span><strong>{alerts?.pendingWholesale ?? 0}</strong></Link>
                <Link to="/admin/reviews" className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-accent"><span>تقييمات للمراجعة</span><strong>{alerts?.pendingReviews ?? 0}</strong></Link>
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="حساب الإدارة"><UserRound /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel><span dir="ltr" className="block truncate text-xs font-normal">{email ?? "حساب الإدارة"}</span></DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/account"><UserRound /> ملف الحساب</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/"><Store /> عرض المتجر</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/admin/settings"><ClipboardList /> الإعدادات</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}><LogOut /> تسجيل الخروج</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="border-t border-border px-4 py-2 sm:hidden"><GlobalSearch /></div>
        </header>
        <main className="grid gap-5 p-4 pb-16 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

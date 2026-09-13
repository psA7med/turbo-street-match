import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAdminProductFormData, listAdminProducts, setAdminProductStatus } from "@/lib/admin.functions";
import { AdminPageHeader, Pager, Panel, StatusPill, TableScroller, TableState, Td, Th, dateOnly, money, statusLabels } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/products")({ component: Page });

const ANY = "all";

function Page() {
  const load = useServerFn(listAdminProducts);
  const loadForm = useServerFn(getAdminProductFormData);
  const changeStatus = useServerFn(setAdminProductStatus);
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState(ANY);
  const [status, setStatus] = useState(ANY);
  const [flag, setFlag] = useState(ANY);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => { setDebounced(term.trim()); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [term]);

  const form = useQuery({ queryKey: ["admin-product-form"], queryFn: () => loadForm(), retry: false });
  const query = useQuery({
    queryKey: ["admin-products", debounced, category, status, flag, page],
    queryFn: () => load({ data: {
      ...(debounced ? { term: debounced } : {}),
      ...(category === ANY ? {} : { category }),
      ...(status === ANY ? {} : { status }),
      ...(flag === ANY ? {} : { flag }),
      page,
    } }),
    retry: false,
  });
  const rows = query.data?.rows ?? [];

  const toggleStatus = async (id: string, next: string) => {
    setBusy(id);
    try {
      await changeStatus({ data: { id, status: next } });
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(next === "published" ? "المنتج بقى منشور" : next === "archived" ? "اتأرشف المنتج" : "المنتج بقى مسودة");
    } catch {
      toast.error("تعذر تحديث حالة المنتج");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <AdminPageHeader title="المنتجات" description="إدارة الكتالوج والمقاسات والأسعار." actions={<Button asChild size="sm"><Link to="/admin/products/new"><Plus /> منتج جديد</Link></Button>} />
      <Panel>
        <div className="grid gap-3 border-b border-border p-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1.5 text-xs font-bold">بحث<Input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="الاسم أو الكود أو الرابط" className="h-9" /></label>
          <label className="grid gap-1.5 text-xs font-bold">الفئة
            <Select value={category} onValueChange={(value) => { setCategory(value); setPage(1); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ANY}>الكل</SelectItem>{(form.data?.categories ?? []).map((item: any) => <SelectItem key={item.id} value={item.id}>{item.name_ar}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <label className="grid gap-1.5 text-xs font-bold">الحالة
            <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ANY}>الكل</SelectItem>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <label className="grid gap-1.5 text-xs font-bold">تمييز
            <Select value={flag} onValueChange={(value) => { setFlag(value); setPage(1); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ANY}>الكل</SelectItem><SelectItem value="new">جديد</SelectItem><SelectItem value="bestseller">الأكثر مبيعًا</SelectItem></SelectContent>
            </Select>
          </label>
        </div>
        <TableState loading={query.isLoading} error={query.error} empty={!rows.length} emptyLabel="لا منتجات مطابقة">
          <TableScroller>
            <thead><tr><Th>المنتج</Th><Th>الفئة</Th><Th>الحالة</Th><Th>السعر</Th><Th>الخيارات</Th><Th>المخزون</Th><Th>تمييز</Th><Th>آخر تحديث</Th><Th>إجراء</Th></tr></thead>
            <tbody>
              {rows.map((product: any) => {
                const variants = product.product_variants ?? [];
                const prices = variants.map((variant: any) => Number(variant.retail_price)).filter((value: number) => value > 0);
                const stock = variants.reduce((total: number, variant: any) => total + Math.max(0, (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved_quantity ?? 0)), 0);
                return (
                  <tr key={product.id} className="hover:bg-accent/50">
                    <Td><Link to="/admin/products/$id" params={{ id: product.id }} className="font-bold text-primary">{product.name_ar}</Link><span className="block text-xs text-muted-foreground" dir="ltr">{product.slug}</span></Td>
                    <Td className="text-xs">{product.categories?.name_ar ?? "—"}</Td>
                    <Td><StatusPill label={statusLabels[product.status] ?? product.status} tone={product.status === "published" ? "good" : product.status === "archived" ? "bad" : "warn"} /></Td>
                    <Td className="tabular-nums">{prices.length ? money(Math.min(...prices)) : "—"}</Td>
                    <Td className="tabular-nums">{variants.length}</Td>
                    <Td className={stock <= 0 ? "font-bold text-red-600 tabular-nums" : "tabular-nums"}>{stock}</Td>
                    <Td className="text-xs">{[product.is_new ? "جديد" : null, product.is_bestseller ? "الأكثر مبيعًا" : null].filter(Boolean).join(" · ") || "—"}</Td>
                    <Td className="text-xs text-muted-foreground">{dateOnly(product.updated_at)}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline"><Link to="/admin/products/$id" params={{ id: product.id }}>تعديل</Link></Button>
                        <Button size="sm" variant="outline" disabled={busy === product.id} onClick={() => void toggleStatus(product.id, product.status === "published" ? "draft" : "published")}>
                          {product.status === "published" ? "إخفاء" : "نشر"}
                        </Button>
                        {product.status !== "archived" && <Button size="sm" variant="ghost" disabled={busy === product.id} onClick={() => void toggleStatus(product.id, "archived")}>أرشفة</Button>}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableScroller>
          <Pager page={query.data?.page ?? 1} size={query.data?.size ?? 20} total={query.data?.total ?? 0} onPage={setPage} />
        </TableState>
      </Panel>
    </>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listAdminInventory, updateAdminInventory } from "@/lib/admin.functions";
import { AdminPageHeader, Pager, Panel, StatusPill, TableScroller, TableState, Td, Th, dateTime } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/inventory")({ component: Page });

const filters = [{ key: "all", label: "الكل" }, { key: "low", label: "قارب على النفاد" }, { key: "out", label: "نفد" }];

function Page() {
  const load = useServerFn(listAdminInventory);
  const save = useServerFn(updateAdminInventory);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => { setDebounced(term.trim()); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [term]);

  const query = useQuery({
    queryKey: ["admin-inventory", filter, debounced, page],
    queryFn: () => load({ data: { ...(filter === "all" ? {} : { filter }), ...(debounced ? { term: debounced } : {}), page } }),
    retry: false,
  });
  const rows = query.data?.rows ?? [];

  const submit = async (event: FormEvent<HTMLFormElement>, variantId: string) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(variantId);
    try {
      await save({ data: {
        variantId,
        quantity: Number(values.get("quantity") ?? 0),
        reserved_quantity: Number(values.get("reserved_quantity") ?? 0),
        low_stock_threshold: Number(values.get("low_stock_threshold") ?? 0),
      } });
      await queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      toast.success("اتحدث المخزون");
    } catch {
      toast.error("تعذر تحديث المخزون");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <AdminPageHeader title="المخزون" description="تحديث الكميات المتاحة والمحجوزة وحدود التنبيه." />
      <Panel>
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="flex gap-2" role="tablist" aria-label="فلترة المخزون">
            {filters.map((item) => (
              <Button key={item.key} role="tab" aria-selected={filter === item.key} size="sm" variant={filter === item.key ? "default" : "outline"} onClick={() => { setFilter(item.key); setPage(1); }}>{item.label}</Button>
            ))}
          </div>
          <Input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="بحث بالكود أو اسم المنتج" className="h-9 md:max-w-xs" aria-label="بحث في المخزون" />
        </div>
        <TableState loading={query.isLoading} error={query.error} empty={!rows.length} emptyLabel="لا سجلات مخزون مطابقة">
          <TableScroller>
            <thead><tr><Th>المنتج</Th><Th>الكود</Th><Th>الحالة</Th><Th>المتاح</Th><Th>محجوز</Th><Th>حد التنبيه</Th><Th>آخر تحديث</Th><Th>حفظ</Th></tr></thead>
            <tbody>
              {rows.map((row: any) => {
                const available = row.quantity - row.reserved_quantity;
                return (
                  <tr key={row.variant_id}>
                    <Td>{row.product_variants?.products?.name_ar ?? "—"}<span className="block text-xs text-muted-foreground">{row.product_variants?.color_name_ar} · <span dir="ltr">{row.product_variants?.size_label}</span></span></Td>
                    <Td dir="ltr" className="text-xs">{row.product_variants?.sku}</Td>
                    <Td><StatusPill label={available <= 0 ? "نفد" : available <= row.low_stock_threshold ? "قارب على النفاد" : "متاح"} tone={available <= 0 ? "bad" : available <= row.low_stock_threshold ? "warn" : "good"} /></Td>
                    <Td colSpan={5} className="p-0">
                      <form onSubmit={(event) => void submit(event, row.variant_id)} className="flex flex-wrap items-center gap-2 p-3">
                        <Input name="quantity" type="number" defaultValue={row.quantity} className="h-9 w-24" aria-label="الكمية" />
                        <Input name="reserved_quantity" type="number" defaultValue={row.reserved_quantity} className="h-9 w-24" aria-label="المحجوز" />
                        <Input name="low_stock_threshold" type="number" defaultValue={row.low_stock_threshold} className="h-9 w-24" aria-label="حد التنبيه" />
                        <span className="text-xs text-muted-foreground">{dateTime(row.updated_at)}</span>
                        <Button type="submit" size="sm" variant="outline" disabled={busy === row.variant_id}>حفظ</Button>
                      </form>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableScroller>
          <Pager page={query.data?.page ?? 1} size={query.data?.size ?? 30} total={query.data?.total ?? 0} onPage={setPage} />
        </TableState>
      </Panel>
    </>
  );
}

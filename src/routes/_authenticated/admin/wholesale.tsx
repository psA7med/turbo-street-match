import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { listWholesaleApplications, updateWholesaleApplicationStatus } from "@/lib/wholesale-admin.functions";
import { deleteAdminWholesalePrice, listAdminWholesalePrices, saveAdminWholesalePrice } from "@/lib/admin.functions";
import { Input } from "@/components/ui/input";
import { money } from "@/components/admin/ui";
import { AdminPageHeader, Panel, StatusPill, TableScroller, TableState, Td, Th, applicationLabels, dateOnly } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/wholesale")({ component: Page });

const tabs = [{ key: "pending", label: "قيد المراجعة" }, { key: "approved", label: "مقبول" }, { key: "rejected", label: "مرفوض" }];

function Page() {
  const load = useServerFn(listWholesaleApplications);
  const save = useServerFn(updateWholesaleApplicationStatus);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["admin-wholesale-applications"], queryFn: () => load(), refetchInterval: 30000, retry: false });
  const rows = (query.data ?? []).filter((row: any) => row.status === tab);

  const change = async (id: string, status: "approved" | "rejected") => {
    setBusy(id);
    try {
      await save({ data: { applicationId: id, status } });
      await queryClient.invalidateQueries({ queryKey: ["admin-wholesale-applications"] });
      toast.success(status === "approved" ? "تم قبول التاجر" : "تم رفض الطلب");
    } catch {
      toast.error("تعذر تحديث حالة الطلب");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <AdminPageHeader title="تجار الجملة" description="مراجعة طلبات الجملة وقبولها أو رفضها، وتحديد أسعار الجملة." />
      <Panel>
        <div className="flex flex-wrap gap-2 border-b border-border p-4" role="tablist" aria-label="حالة الطلبات">
          {tabs.map((item) => (
            <Button key={item.key} role="tab" aria-selected={tab === item.key} size="sm" variant={tab === item.key ? "default" : "outline"} onClick={() => setTab(item.key)}>{item.label}</Button>
          ))}
        </div>
        <TableState loading={query.isLoading} error={query.error} empty={!rows.length} emptyLabel="لا طلبات في الحالة دي">
          <TableScroller>
            <thead><tr><Th>النشاط</Th><Th>المسؤول</Th><Th>الموبايل</Th><Th>المحافظة</Th><Th>العنوان</Th><Th>السجل الضريبي</Th><Th>الحالة</Th><Th>التقديم</Th><Th>إجراء</Th></tr></thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id} className="hover:bg-accent/50">
                  <Td className="font-semibold">{row.business_name}<span className="block text-xs text-muted-foreground">{row.business_type || "نوع غير محدد"}</span></Td>
                  <Td className="text-xs">{row.contact_name}<span className="block text-muted-foreground">{row.profile?.full_name ?? ""}</span></Td>
                  <Td dir="ltr" className="text-xs">{row.phone}</Td>
                  <Td className="text-xs">{row.governorate}</Td>
                  <Td className="max-w-xs text-xs">{row.address}{row.notes && <span className="block text-muted-foreground">{row.notes}</span>}</Td>
                  <Td dir="ltr" className="text-xs">{row.tax_registration || "—"}</Td>
                  <Td><StatusPill label={applicationLabels[row.status] ?? row.status} tone={row.status === "approved" ? "good" : row.status === "rejected" ? "bad" : "warn"} /></Td>
                  <Td className="text-xs text-muted-foreground">{dateOnly(row.created_at)}<span className="block">{row.reviewed_at ? `المراجعة: ${dateOnly(row.reviewed_at)}` : ""}</span></Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button size="sm" disabled={busy === row.id || row.status === "approved"} onClick={() => void change(row.id, "approved")}>قبول</Button>
                      <Button size="sm" variant="outline" disabled={busy === row.id || row.status === "rejected"} onClick={() => void change(row.id, "rejected")}>رفض</Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableScroller>
        </TableState>
      </Panel>
      <WholesalePricing />
    </>
  );
}

function WholesalePricing() {
  const load = useServerFn(listAdminWholesalePrices);
  const save = useServerFn(saveAdminWholesalePrice);
  const remove = useServerFn(deleteAdminWholesalePrice);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin-wholesale-prices"], queryFn: () => load(), retry: false });
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await save({ data: {
        variant_id: String(form.get("variant_id")),
        tier: String(form.get("tier") || "جملة"),
        unit_price: Number(form.get("unit_price")),
        minimum_quantity: Number(form.get("minimum_quantity") || 7),
      } });
      await queryClient.invalidateQueries({ queryKey: ["admin-wholesale-prices"] });
      event.currentTarget.reset();
      toast.success("اتحفظ سعر الجملة");
    } catch {
      toast.error("تعذر حفظ السعر");
    } finally {
      setSaving(false);
    }
  };

  const drop = async (id: string) => {
    try {
      await remove({ data: { id } });
      await queryClient.invalidateQueries({ queryKey: ["admin-wholesale-prices"] });
      toast.success("اتحذف السعر");
    } catch {
      toast.error("تعذر حذف السعر");
    }
  };

  const prices = query.data?.prices ?? [];
  const variants = query.data?.variants ?? [];

  return (
    <Panel className="mt-6">
      <div className="border-b border-border p-4">
        <h2 className="font-bold">أسعار الجملة</h2>
        <p className="mt-1 text-sm text-muted-foreground">السعر بيتطبق تلقائيًا لتجار الجملة المقبولين عند الوصول لأقل كمية.</p>
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-5">
          <select name="variant_id" required className="h-10 rounded-lg border border-input bg-background px-3 text-sm sm:col-span-2" aria-label="القطعة">
            <option value="">اختار القطعة</option>
            {variants.map((variant: any) => (
              <option key={variant.id} value={variant.id}>{variant.products?.name_ar} — {variant.color_name_ar} / {variant.size_label} ({variant.sku})</option>
            ))}
          </select>
          <Input name="tier" placeholder="الفئة (جملة)" defaultValue="جملة" aria-label="الفئة" className="h-10" />
          <Input name="unit_price" type="number" step="1" min="1" required placeholder="سعر الجملة" aria-label="سعر الجملة" className="h-10" />
          <Input name="minimum_quantity" type="number" min="1" defaultValue={7} required placeholder="أقل كمية" aria-label="أقل كمية" className="h-10" />
          <Button type="submit" size="sm" className="sm:col-span-5 sm:w-fit" disabled={saving}>حفظ السعر</Button>
        </form>
      </div>
      <TableState loading={query.isLoading} error={query.error} empty={!prices.length} emptyLabel="لا أسعار جملة مسجّلة">
        <TableScroller>
          <thead><tr><Th>القطعة</Th><Th>الفئة</Th><Th>سعر التجزئة</Th><Th>سعر الجملة</Th><Th>أقل كمية</Th><Th>إجراء</Th></tr></thead>
          <tbody>
            {prices.map((price: any) => (
              <tr key={price.id} className="hover:bg-accent/50">
                <Td className="text-xs font-semibold">{price.product_variants?.products?.name_ar}<span className="block text-muted-foreground">{price.product_variants?.color_name_ar} / {price.product_variants?.size_label}</span></Td>
                <Td className="text-xs">{price.tier}</Td>
                <Td className="text-xs text-muted-foreground">{money(price.product_variants?.retail_price ?? 0)}</Td>
                <Td className="text-xs font-bold">{money(price.unit_price)}</Td>
                <Td className="text-xs">{price.minimum_quantity}</Td>
                <Td><Button size="sm" variant="outline" onClick={() => void drop(price.id)}>حذف</Button></Td>
              </tr>
            ))}
          </tbody>
        </TableScroller>
      </TableState>
    </Panel>
  );
}

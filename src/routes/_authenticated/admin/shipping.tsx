import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { listAdminShippingZones, saveAdminShippingZone } from "@/lib/admin.functions";
import { AdminPageHeader, Panel, StatusPill, TableScroller, TableState, Td, Th, money } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/shipping")({ component: Page });

function Page() {
  const load = useServerFn(listAdminShippingZones);
  const save = useServerFn(saveAdminShippingZone);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const query = useQuery({ queryKey: ["admin-shipping"], queryFn: () => load(), retry: false });
  const rows = query.data ?? [];

  const persist = async (payload: any, message: string) => {
    setBusy(true);
    try {
      await save({ data: payload });
      await queryClient.invalidateQueries({ queryKey: ["admin-shipping"] });
      setOpen(false);
      toast.success(message);
    } catch {
      toast.error("تعذر حفظ منطقة الشحن");
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const threshold = String(values.get("free_shipping_threshold") ?? "").trim();
    void persist({
      ...(editing?.id ? { id: editing.id } : {}),
      name_ar: String(values.get("name_ar") ?? ""),
      governorates: String(values.get("governorates") ?? "").split(/[\n,،]+/).map((item) => item.trim()).filter(Boolean),
      fee: Number(values.get("fee") ?? 0),
      free_shipping_threshold: threshold ? Number(threshold) : null,
      eta_min_days: Number(values.get("eta_min_days") ?? 1),
      eta_max_days: Number(values.get("eta_max_days") ?? 3),
      cod_available: values.get("cod_available") === "on",
      active: values.get("active") === "on",
    }, "اتحفظت منطقة الشحن");
  };

  const toggleActive = (zone: any) => void persist({
    id: zone.id, name_ar: zone.name_ar, governorates: zone.governorates ?? [], fee: zone.fee,
    free_shipping_threshold: zone.free_shipping_threshold ?? null, eta_min_days: zone.eta_min_days,
    eta_max_days: zone.eta_max_days, cod_available: zone.cod_available, active: !zone.active,
  }, "اتحدثت حالة المنطقة");

  return (
    <>
      <AdminPageHeader title="الشحن" description="مناطق الشحن والرسوم ومدة التوصيل والدفع عند الاستلام." actions={<Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><Plus /> منطقة جديدة</Button>} />
      <Panel>
        <TableState loading={query.isLoading} error={query.error} empty={!rows.length} emptyLabel="لا مناطق شحن بعد">
          <TableScroller>
            <thead><tr><Th>المنطقة</Th><Th>المحافظات</Th><Th>الرسوم</Th><Th>شحن مجاني من</Th><Th>مدة التوصيل</Th><Th>الدفع عند الاستلام</Th><Th>الحالة</Th><Th>إجراء</Th></tr></thead>
            <tbody>
              {rows.map((zone: any) => (
                <tr key={zone.id} className="hover:bg-accent/50">
                  <Td className="font-semibold">{zone.name_ar}</Td>
                  <Td className="max-w-sm text-xs text-muted-foreground">{(zone.governorates ?? []).join(" · ")}</Td>
                  <Td className="tabular-nums">{money(zone.fee)}</Td>
                  <Td className="tabular-nums">{zone.free_shipping_threshold ? money(zone.free_shipping_threshold) : "—"}</Td>
                  <Td className="tabular-nums">{zone.eta_min_days}–{zone.eta_max_days} يوم</Td>
                  <Td className="text-xs">{zone.cod_available ? "متاح" : "غير متاح"}</Td>
                  <Td><StatusPill label={zone.active ? "مفعّلة" : "موقوفة"} tone={zone.active ? "good" : "warn"} /></Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditing(zone); setOpen(true); }}>تعديل</Button>
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => toggleActive(zone)}>{zone.active ? "إيقاف" : "تفعيل"}</Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableScroller>
        </TableState>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "تعديل منطقة شحن" : "منطقة شحن جديدة"}</DialogTitle><DialogDescription>الرسوم دي بتتطبق على الشيك أوت مباشرة.</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="grid gap-3">
            <label className="grid gap-1.5 text-xs font-bold">اسم المنطقة *<Input name="name_ar" required defaultValue={editing?.name_ar ?? ""} className="h-9" /></label>
            <label className="grid gap-1.5 text-xs font-bold">المحافظات (سطر أو فاصلة بين كل محافظة)<Textarea name="governorates" rows={3} defaultValue={(editing?.governorates ?? []).join("، ")} /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-bold">رسوم الشحن<Input name="fee" type="number" defaultValue={editing?.fee ?? 0} className="h-9" /></label>
              <label className="grid gap-1.5 text-xs font-bold">شحن مجاني من<Input name="free_shipping_threshold" type="number" defaultValue={editing?.free_shipping_threshold ?? ""} className="h-9" /></label>
              <label className="grid gap-1.5 text-xs font-bold">أقل مدة (يوم)<Input name="eta_min_days" type="number" defaultValue={editing?.eta_min_days ?? 2} className="h-9" /></label>
              <label className="grid gap-1.5 text-xs font-bold">أقصى مدة (يوم)<Input name="eta_max_days" type="number" defaultValue={editing?.eta_max_days ?? 5} className="h-9" /></label>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-xs font-bold"><Switch name="cod_available" defaultChecked={editing?.cod_available ?? true} /> الدفع عند الاستلام</label>
              <label className="flex items-center gap-2 text-xs font-bold"><Switch name="active" defaultChecked={editing?.active ?? true} /> مفعّلة</label>
            </div>
            <DialogFooter><Button type="submit" size="sm" disabled={busy}>{busy ? "جاري الحفظ…" : "حفظ"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

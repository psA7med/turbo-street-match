import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { listAdminSizeGuides, saveAdminSizeGuide } from "@/lib/admin.functions";
import { AdminPageHeader, Panel, StatusPill, TableScroller, TableState, Td, Th, statusLabels } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/size-guides")({ component: Page });

const NONE = "none";

function Page() {
  const load = useServerFn(listAdminSizeGuides);
  const save = useServerFn(saveAdminSizeGuide);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const query = useQuery({ queryKey: ["admin-size-guides"], queryFn: () => load(), retry: false });
  const guides = query.data?.guides ?? [];
  const categories = query.data?.categories ?? [];

  const persist = async (payload: any, message: string) => {
    setBusy(true);
    try {
      await save({ data: payload });
      await queryClient.invalidateQueries({ queryKey: ["admin-size-guides"] });
      setOpen(false);
      toast.success(message);
    } catch {
      toast.error("تعذر الحفظ — تأكد من صيغة المقاسات (JSON)");
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const category = String(values.get("category_id") ?? NONE);
    void persist({
      ...(editing?.id ? { id: editing.id } : {}),
      name_ar: String(values.get("name_ar") ?? ""),
      category_id: category === NONE ? "" : category,
      instructions_ar: String(values.get("instructions_ar") ?? ""),
      measurements: String(values.get("measurements") ?? "[]"),
      status: String(values.get("status") ?? "draft"),
    }, "اتحفظ دليل المقاسات");
  };

  const quickStatus = (guide: any, status: string) => void persist({
    id: guide.id, name_ar: guide.name_ar, category_id: guide.category_id ?? "",
    instructions_ar: guide.instructions_ar ?? "", measurements: JSON.stringify(guide.measurements ?? []), status,
  }, "اتحدثت حالة الدليل");

  return (
    <>
      <AdminPageHeader title="دليل المقاسات" description="جداول المقاسات والقياسات المرتبطة بالمنتجات." actions={<Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><Plus /> دليل جديد</Button>} />
      <Panel>
        <TableState loading={query.isLoading} error={query.error} empty={!guides.length} emptyLabel="لا أدلة مقاسات بعد">
          <TableScroller>
            <thead><tr><Th>الاسم</Th><Th>الفئة</Th><Th>عدد الصفوف</Th><Th>التعليمات</Th><Th>الحالة</Th><Th>إجراء</Th></tr></thead>
            <tbody>
              {guides.map((guide: any) => (
                <tr key={guide.id} className="hover:bg-accent/50">
                  <Td className="font-semibold">{guide.name_ar}</Td>
                  <Td className="text-xs">{categories.find((item: any) => item.id === guide.category_id)?.name_ar ?? "—"}</Td>
                  <Td className="tabular-nums">{Array.isArray(guide.measurements) ? guide.measurements.length : 0}</Td>
                  <Td className="max-w-sm text-xs text-muted-foreground">{guide.instructions_ar || "—"}</Td>
                  <Td><StatusPill label={statusLabels[guide.status] ?? guide.status} tone={guide.status === "published" ? "good" : guide.status === "archived" ? "bad" : "warn"} /></Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditing(guide); setOpen(true); }}>تعديل</Button>
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => quickStatus(guide, guide.status === "published" ? "draft" : "published")}>{guide.status === "published" ? "إخفاء" : "نشر"}</Button>
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
          <DialogHeader><DialogTitle>{editing ? "تعديل دليل مقاسات" : "دليل مقاسات جديد"}</DialogTitle><DialogDescription>القياسات تُكتب بصيغة JSON، مثال: [{"{"}"المقاس":"M","الصدر":"104"{"}"}]</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="grid gap-3">
            <label className="grid gap-1.5 text-xs font-bold">الاسم *<Input name="name_ar" required defaultValue={editing?.name_ar ?? ""} className="h-9" /></label>
            <label className="grid gap-1.5 text-xs font-bold">الفئة
              <Select name="category_id" defaultValue={editing?.category_id ?? NONE}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value={NONE}>بدون فئة</SelectItem>{categories.map((item: any) => <SelectItem key={item.id} value={item.id}>{item.name_ar}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <label className="grid gap-1.5 text-xs font-bold">تعليمات القياس<Textarea name="instructions_ar" rows={2} defaultValue={editing?.instructions_ar ?? ""} /></label>
            <label className="grid gap-1.5 text-xs font-bold">القياسات (JSON)<Textarea name="measurements" dir="ltr" rows={6} defaultValue={JSON.stringify(editing?.measurements ?? [], null, 2)} /></label>
            <label className="grid gap-1.5 text-xs font-bold">الحالة
              <Select name="status" defaultValue={editing?.status ?? "draft"}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <DialogFooter><Button type="submit" size="sm" disabled={busy}>{busy ? "جاري الحفظ…" : "حفظ"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

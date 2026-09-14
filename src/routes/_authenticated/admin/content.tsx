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
import { listAdminSections, saveAdminSection } from "@/lib/admin.functions";
import { AdminPageHeader, Panel, StatusPill, TableScroller, TableState, Td, Th, statusLabels } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/content")({ component: Page });

function Page() {
  const load = useServerFn(listAdminSections);
  const save = useServerFn(saveAdminSection);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const query = useQuery({ queryKey: ["admin-sections"], queryFn: () => load(), retry: false });
  const rows = query.data ?? [];

  const persist = async (payload: any, message: string) => {
    setBusy(true);
    try {
      await save({ data: payload });
      await queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
      setOpen(false);
      toast.success(message);
    } catch {
      toast.error("تعذر حفظ القسم");
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    void persist({
      ...(editing?.id ? { id: editing.id } : {}),
      section_key: String(values.get("section_key") ?? ""),
      eyebrow_ar: String(values.get("eyebrow_ar") ?? ""),
      title_ar: String(values.get("title_ar") ?? ""),
      body_ar: String(values.get("body_ar") ?? ""),
      cta_label_ar: String(values.get("cta_label_ar") ?? ""),
      cta_url: String(values.get("cta_url") ?? ""),
      image_url: String(values.get("image_url") ?? ""),
      sort_order: Number(values.get("sort_order") ?? 0),
      status: String(values.get("status") ?? "draft"),
    }, "اتحفظ القسم");
  };

  const quickStatus = (section: any, status: string) => void persist({
    id: section.id, section_key: section.section_key, eyebrow_ar: section.eyebrow_ar ?? "", title_ar: section.title_ar ?? "",
    body_ar: section.body_ar ?? "", cta_label_ar: section.cta_label_ar ?? "", cta_url: section.cta_url ?? "",
    image_url: section.image_url ?? "", sort_order: section.sort_order, status,
  }, "اتحدثت حالة القسم");

  return (
    <>
      <AdminPageHeader title="محتوى الرئيسية" description="نصوص وصور وأزرار أقسام الصفحة الرئيسية." actions={<Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><Plus /> قسم جديد</Button>} />
      <Panel>
        <TableState loading={query.isLoading} error={query.error} empty={!rows.length} emptyLabel="لا أقسام بعد">
          <TableScroller>
            <thead><tr><Th>المفتاح</Th><Th>العنوان</Th><Th>النص</Th><Th>زر الدعوة</Th><Th>الترتيب</Th><Th>الحالة</Th><Th>إجراء</Th></tr></thead>
            <tbody>
              {rows.map((section: any) => (
                <tr key={section.id} className="hover:bg-accent/50">
                  <Td dir="ltr" className="text-xs font-bold">{section.section_key}</Td>
                  <Td>{section.title_ar || "—"}<span className="block text-xs text-muted-foreground">{section.eyebrow_ar || ""}</span></Td>
                  <Td className="max-w-sm text-xs text-muted-foreground">{section.body_ar || "—"}</Td>
                  <Td className="text-xs">{section.cta_label_ar || "—"}<span className="block text-muted-foreground" dir="ltr">{section.cta_url || ""}</span></Td>
                  <Td className="tabular-nums">{section.sort_order}</Td>
                  <Td><StatusPill label={statusLabels[section.status] ?? section.status} tone={section.status === "published" ? "good" : section.status === "archived" ? "bad" : "warn"} /></Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditing(section); setOpen(true); }}>تعديل</Button>
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => quickStatus(section, section.status === "published" ? "draft" : "published")}>{section.status === "published" ? "إخفاء" : "نشر"}</Button>
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
          <DialogHeader><DialogTitle>{editing ? "تعديل قسم" : "قسم جديد"}</DialogTitle><DialogDescription>التغييرات تظهر في الصفحة الرئيسية بعد النشر.</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="grid gap-3">
            <label className="grid gap-1.5 text-xs font-bold">مفتاح القسم *<Input name="section_key" dir="ltr" required defaultValue={editing?.section_key ?? ""} className="h-9" /></label>
            <label className="grid gap-1.5 text-xs font-bold">العنوان الصغير<Input name="eyebrow_ar" defaultValue={editing?.eyebrow_ar ?? ""} className="h-9" /></label>
            <label className="grid gap-1.5 text-xs font-bold">العنوان<Input name="title_ar" defaultValue={editing?.title_ar ?? ""} className="h-9" /></label>
            <label className="grid gap-1.5 text-xs font-bold">النص<Textarea name="body_ar" rows={3} defaultValue={editing?.body_ar ?? ""} /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-bold">نص الزر<Input name="cta_label_ar" defaultValue={editing?.cta_label_ar ?? ""} className="h-9" /></label>
              <label className="grid gap-1.5 text-xs font-bold">رابط الزر<Input name="cta_url" dir="ltr" defaultValue={editing?.cta_url ?? ""} className="h-9" /></label>
            </div>
            <label className="grid gap-1.5 text-xs font-bold">رابط الصورة<Input name="image_url" dir="ltr" defaultValue={editing?.image_url ?? ""} className="h-9" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-bold">الترتيب<Input name="sort_order" type="number" defaultValue={editing?.sort_order ?? rows.length} className="h-9" /></label>
              <label className="grid gap-1.5 text-xs font-bold">الحالة
                <Select name="status" defaultValue={editing?.status ?? "draft"}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </label>
            </div>
            <DialogFooter><Button type="submit" size="sm" disabled={busy}>{busy ? "جاري الحفظ…" : "حفظ"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

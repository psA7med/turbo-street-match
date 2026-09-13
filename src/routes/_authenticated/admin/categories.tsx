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
import { listAdminCategories, saveAdminCategory } from "@/lib/admin.functions";
import { AdminPageHeader, Panel, StatusPill, TableScroller, TableState, Td, Th, statusLabels } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/categories")({ component: Page });

const NONE = "none";

function Page() {
  const load = useServerFn(listAdminCategories);
  const save = useServerFn(saveAdminCategory);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const query = useQuery({ queryKey: ["admin-categories"], queryFn: () => load(), retry: false });
  const rows = query.data ?? [];

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const parent = String(values.get("parent_id") ?? NONE);
    setBusy(true);
    try {
      await save({ data: {
        ...(editing?.id ? { id: editing.id } : {}),
        name_ar: String(values.get("name_ar") ?? ""),
        name_en: String(values.get("name_en") ?? ""),
        slug: String(values.get("slug") ?? ""),
        description_ar: String(values.get("description_ar") ?? ""),
        image_url: String(values.get("image_url") ?? ""),
        parent_id: parent === NONE ? "" : parent,
        sort_order: Number(values.get("sort_order") ?? 0),
        status: String(values.get("status") ?? "draft"),
      } });
      await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setOpen(false);
      toast.success("اتحفظت الفئة");
    } catch {
      toast.error("تعذر حفظ الفئة — تأكد من الاسم والرابط");
    } finally {
      setBusy(false);
    }
  };

  const openFor = (category: any | null) => { setEditing(category); setOpen(true); };
  const changeStatus = async (category: any, status: string) => {
    try {
      await save({ data: { id: category.id, name_ar: category.name_ar, name_en: category.name_en ?? "", slug: category.slug, description_ar: category.description_ar ?? "", image_url: category.image_url ?? "", parent_id: category.parent_id ?? "", sort_order: category.sort_order, status } });
      await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("اتحدثت حالة الفئة");
    } catch { toast.error("تعذر تحديث الفئة"); }
  };

  return (
    <>
      <AdminPageHeader title="الفئات" description="تنظيم أقسام المتجر وترتيبها." actions={<Button size="sm" onClick={() => openFor(null)}><Plus /> فئة جديدة</Button>} />
      <Panel>
        <TableState loading={query.isLoading} error={query.error} empty={!rows.length} emptyLabel="لا فئات بعد">
          <TableScroller>
            <thead><tr><Th>الاسم</Th><Th>الرابط</Th><Th>القسم الأعلى</Th><Th>الترتيب</Th><Th>الحالة</Th><Th>إجراء</Th></tr></thead>
            <tbody>
              {rows.map((category: any) => (
                <tr key={category.id} className="hover:bg-accent/50">
                  <Td className="font-semibold">{category.name_ar}<span className="block text-xs text-muted-foreground" dir="ltr">{category.name_en ?? ""}</span></Td>
                  <Td dir="ltr" className="text-xs">{category.slug}</Td>
                  <Td className="text-xs">{rows.find((item: any) => item.id === category.parent_id)?.name_ar ?? "—"}</Td>
                  <Td className="tabular-nums">{category.sort_order}</Td>
                  <Td><StatusPill label={statusLabels[category.status] ?? category.status} tone={category.status === "published" ? "good" : category.status === "archived" ? "bad" : "warn"} /></Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openFor(category)}>تعديل</Button>
                      <Button size="sm" variant="ghost" onClick={() => void changeStatus(category, category.status === "published" ? "draft" : "published")}>{category.status === "published" ? "إخفاء" : "نشر"}</Button>
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
          <DialogHeader><DialogTitle>{editing ? "تعديل فئة" : "فئة جديدة"}</DialogTitle><DialogDescription>البيانات دي تظهر في المتجر مباشرة.</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="grid gap-3">
            <label className="grid gap-1.5 text-xs font-bold">الاسم بالعربية *<Input name="name_ar" required defaultValue={editing?.name_ar ?? ""} className="h-9" /></label>
            <label className="grid gap-1.5 text-xs font-bold">الاسم بالإنجليزية<Input name="name_en" dir="ltr" defaultValue={editing?.name_en ?? ""} className="h-9" /></label>
            <label className="grid gap-1.5 text-xs font-bold">الرابط *<Input name="slug" dir="ltr" required defaultValue={editing?.slug ?? ""} className="h-9" /></label>
            <label className="grid gap-1.5 text-xs font-bold">الوصف<Textarea name="description_ar" rows={2} defaultValue={editing?.description_ar ?? ""} /></label>
            <label className="grid gap-1.5 text-xs font-bold">رابط الصورة<Input name="image_url" dir="ltr" defaultValue={editing?.image_url ?? ""} className="h-9" /></label>
            <label className="grid gap-1.5 text-xs font-bold">القسم الأعلى
              <Select name="parent_id" defaultValue={editing?.parent_id ?? NONE}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value={NONE}>بدون</SelectItem>{rows.filter((item: any) => item.id !== editing?.id).map((item: any) => <SelectItem key={item.id} value={item.id}>{item.name_ar}</SelectItem>)}</SelectContent>
              </Select>
            </label>
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

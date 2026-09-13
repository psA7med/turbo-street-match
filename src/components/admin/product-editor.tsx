import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  deleteAdminProductImage, getAdminProduct, getAdminProductFormData, saveAdminProduct,
  saveAdminProductImage, saveAdminVariant, setAdminVariantActive,
} from "@/lib/admin.functions";
import { AdminPageHeader, Panel, TableScroller, TableState, Td, Th, money, statusLabels } from "@/components/admin/ui";

const NONE = "none";

export function ProductEditor({ productId }: { productId?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loadProduct = useServerFn(getAdminProduct);
  const loadForm = useServerFn(getAdminProductFormData);
  const saveProduct = useServerFn(saveAdminProduct);
  const saveVariant = useServerFn(saveAdminVariant);
  const toggleVariant = useServerFn(setAdminVariantActive);
  const saveImage = useServerFn(saveAdminProductImage);
  const removeImage = useServerFn(deleteAdminProductImage);
  const [busy, setBusy] = useState(false);

  const detail = useQuery({
    queryKey: ["admin-product", productId],
    queryFn: () => loadProduct({ data: { id: productId! } }),
    enabled: Boolean(productId),
    retry: false,
  });
  const form = useQuery({ queryKey: ["admin-product-form"], queryFn: () => loadForm(), enabled: !productId, retry: false });

  const product: any = detail.data?.product;
  const categories: any[] = (detail.data?.categories ?? form.data?.categories ?? []) as any[];
  const guides: any[] = (detail.data?.guides ?? form.data?.guides ?? []) as any[];

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-product", productId] });
    await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const submitBasics = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const category = String(values.get("category_id") ?? NONE);
    const guide = String(values.get("size_guide_id") ?? NONE);
    setBusy(true);
    try {
      const result = await saveProduct({ data: {
        ...(productId ? { id: productId } : {}),
        name_ar: String(values.get("name_ar") ?? ""),
        name_en: String(values.get("name_en") ?? ""),
        slug: String(values.get("slug") ?? ""),
        description_ar: String(values.get("description_ar") ?? ""),
        fit_ar: String(values.get("fit_ar") ?? ""),
        materials_ar: String(values.get("materials_ar") ?? ""),
        category_id: category === NONE ? "" : category,
        size_guide_id: guide === NONE ? "" : guide,
        status: String(values.get("status") ?? "draft"),
        is_new: values.get("is_new") === "on",
        is_bestseller: values.get("is_bestseller") === "on",
      } });
      toast.success("اتحفظت بيانات المنتج");
      if (!productId && result?.id) {
        await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
        await navigate({ to: "/admin/products/$id", params: { id: result.id } });
        return;
      }
      await refresh();
    } catch {
      toast.error("تعذر حفظ المنتج — تأكد من الاسم والرابط");
    } finally {
      setBusy(false);
    }
  };

  const submitVariant = async (event: FormEvent<HTMLFormElement>, variantId?: string) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await saveVariant({ data: {
        ...(variantId ? { id: variantId } : {}),
        product_id: productId!,
        sku: String(values.get("sku") ?? ""),
        color_name_ar: String(values.get("color_name_ar") ?? ""),
        color_value: String(values.get("color_value") ?? ""),
        size_label: String(values.get("size_label") ?? ""),
        retail_price: Number(values.get("retail_price") ?? 0),
        compare_at_price: values.get("compare_at_price") ? Number(values.get("compare_at_price")) : null,
        active: values.get("active") !== "off",
        quantity: Number(values.get("quantity") ?? 0),
        reserved_quantity: Number(values.get("reserved_quantity") ?? 0),
        low_stock_threshold: Number(values.get("low_stock_threshold") ?? 3),
      } });
      await refresh();
      toast.success("اتحفظ الخيار");
      if (!variantId) event.currentTarget.reset();
    } catch {
      toast.error("تعذر حفظ الخيار — تأكد من الكود واللون والمقاس");
    } finally {
      setBusy(false);
    }
  };

  const submitImage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const values = new FormData(formElement);
    const file = values.get("file") as File | null;
    const url = String(values.get("url") ?? "").trim();
    if (!file?.size && !url) { toast.error("اختر صورة أو ضع رابط"); return; }
    setBusy(true);
    try {
      let fileFields = {};
      if (file?.size) {
        const buffer = await file.arrayBuffer();
        let binary = "";
        new Uint8Array(buffer).forEach((byte) => { binary += String.fromCharCode(byte); });
        fileFields = { fileBase64: btoa(binary), fileName: file.name, contentType: file.type };
      }
      await saveImage({ data: {
        product_id: productId!,
        alt_ar: String(values.get("alt_ar") ?? ""),
        sort_order: Number(values.get("sort_order") ?? 0),
        ...(url ? { url } : {}),
        ...fileFields,
      } });
      await refresh();
      formElement.reset();
      toast.success("اتضافت الصورة");
    } catch {
      toast.error("تعذر رفع الصورة — اكتب وصف الصورة وجرّب تاني");
    } finally {
      setBusy(false);
    }
  };

  if (productId && (detail.isLoading || detail.isError)) {
    return (
      <>
        <AdminPageHeader title="تعديل منتج" />
        <Panel><TableState loading={detail.isLoading} error={detail.error}><div /></TableState></Panel>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title={productId ? product?.name_ar ?? "تعديل منتج" : "منتج جديد"}
        description={productId ? "عدّل البيانات والخيارات والصور والمخزون." : "أدخل البيانات الأساسية أولًا ثم أضف الخيارات والصور."}
        actions={<Button asChild variant="outline" size="sm"><Link to="/admin/products"><ArrowRight /> كل المنتجات</Link></Button>}
      />

      <Panel title="البيانات الأساسية">
        <form onSubmit={submitBasics} className="grid gap-4 p-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-bold">الاسم بالعربية *<Input name="name_ar" required defaultValue={product?.name_ar ?? ""} className="h-9" /></label>
          <label className="grid gap-1.5 text-xs font-bold">الاسم بالإنجليزية<Input name="name_en" dir="ltr" defaultValue={product?.name_en ?? ""} className="h-9" /></label>
          <label className="grid gap-1.5 text-xs font-bold">الرابط (slug) *<Input name="slug" dir="ltr" required defaultValue={product?.slug ?? ""} className="h-9" /></label>
          <label className="grid gap-1.5 text-xs font-bold">الحالة
            <Select name="status" defaultValue={product?.status ?? "draft"}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <label className="grid gap-1.5 text-xs font-bold">الفئة
            <Select name="category_id" defaultValue={product?.category_id ?? NONE}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={NONE}>بدون فئة</SelectItem>{categories.map((item) => <SelectItem key={item.id} value={item.id}>{item.name_ar}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <label className="grid gap-1.5 text-xs font-bold">دليل المقاسات
            <Select name="size_guide_id" defaultValue={product?.size_guide_id ?? NONE}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={NONE}>بدون دليل</SelectItem>{guides.map((item) => <SelectItem key={item.id} value={item.id}>{item.name_ar}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <label className="grid gap-1.5 text-xs font-bold md:col-span-2">الوصف<Textarea name="description_ar" rows={3} defaultValue={product?.description_ar ?? ""} /></label>
          <label className="grid gap-1.5 text-xs font-bold">المقاس والقَصّة<Textarea name="fit_ar" rows={2} defaultValue={product?.fit_ar ?? ""} /></label>
          <label className="grid gap-1.5 text-xs font-bold">الخامات<Textarea name="materials_ar" rows={2} defaultValue={product?.materials_ar ?? ""} /></label>
          <div className="flex flex-wrap items-center gap-6 md:col-span-2">
            <label className="flex items-center gap-2 text-xs font-bold"><Switch name="is_new" defaultChecked={product?.is_new ?? false} /> منتج جديد</label>
            <label className="flex items-center gap-2 text-xs font-bold"><Switch name="is_bestseller" defaultChecked={product?.is_bestseller ?? false} /> الأكثر مبيعًا</label>
          </div>
          <div className="md:col-span-2"><Button type="submit" size="sm" disabled={busy}>{busy ? "جاري الحفظ…" : productId ? "حفظ التعديلات" : "حفظ ومتابعة"}</Button></div>
        </form>
      </Panel>

      {!productId ? (
        <p className="text-sm text-muted-foreground">احفظ البيانات الأساسية أولًا لتفتح إدارة الخيارات والصور والمخزون.</p>
      ) : (
        <>
          <Panel title="الخيارات والمخزون" description="اللون والمقاس والكود والسعر والكميات.">
            <TableScroller>
              <thead><tr><Th>الكود</Th><Th>اللون</Th><Th>المقاس</Th><Th>السعر</Th><Th>قبل الخصم</Th><Th>المتاح</Th><Th>محجوز</Th><Th>حد التنبيه</Th><Th>إجراء</Th></tr></thead>
              <tbody>
                {(product?.product_variants ?? []).map((variant: any) => (
                  <tr key={variant.id}>
                    <Td colSpan={9} className="p-0">
                      <form onSubmit={(event) => void submitVariant(event, variant.id)} className="grid gap-2 p-3 md:grid-cols-9 md:items-end">
                        <Input name="sku" dir="ltr" defaultValue={variant.sku} className="h-9" aria-label="الكود" />
                        <Input name="color_name_ar" defaultValue={variant.color_name_ar} className="h-9" aria-label="اللون" />
                        <Input name="color_value" dir="ltr" defaultValue={variant.color_value ?? ""} className="h-9" aria-label="كود اللون" />
                        <Input name="size_label" dir="ltr" defaultValue={variant.size_label} className="h-9" aria-label="المقاس" />
                        <Input name="retail_price" type="number" step="1" defaultValue={variant.retail_price} className="h-9" aria-label="السعر" />
                        <Input name="compare_at_price" type="number" step="1" defaultValue={variant.compare_at_price ?? ""} className="h-9" aria-label="السعر قبل الخصم" />
                        <Input name="quantity" type="number" defaultValue={variant.inventory?.quantity ?? 0} className="h-9" aria-label="الكمية" />
                        <Input name="reserved_quantity" type="number" defaultValue={variant.inventory?.reserved_quantity ?? 0} className="h-9" aria-label="المحجوز" />
                        <div className="flex gap-2">
                          <Input name="low_stock_threshold" type="number" defaultValue={variant.inventory?.low_stock_threshold ?? 3} className="h-9" aria-label="حد التنبيه" />
                          <input type="hidden" name="active" value={variant.active ? "on" : "off"} />
                          <Button type="submit" size="sm" variant="outline" disabled={busy}>حفظ</Button>
                          <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void toggleVariant({ data: { id: variant.id, active: !variant.active } }).then(refresh)}>
                            {variant.active ? "إيقاف" : "تشغيل"}
                          </Button>
                        </div>
                      </form>
                    </Td>
                  </tr>
                ))}
                <tr className="bg-muted/40">
                  <Td colSpan={9} className="p-0">
                    <form onSubmit={(event) => void submitVariant(event)} className="grid gap-2 p-3 md:grid-cols-9 md:items-end">
                      <Input name="sku" dir="ltr" placeholder="الكود" required className="h-9" aria-label="كود جديد" />
                      <Input name="color_name_ar" placeholder="اللون" required className="h-9" aria-label="لون جديد" />
                      <Input name="color_value" dir="ltr" placeholder="#000000" className="h-9" aria-label="كود اللون" />
                      <Input name="size_label" dir="ltr" placeholder="المقاس" required className="h-9" aria-label="مقاس جديد" />
                      <Input name="retail_price" type="number" placeholder="السعر" required className="h-9" aria-label="سعر جديد" />
                      <Input name="compare_at_price" type="number" placeholder="قبل الخصم" className="h-9" aria-label="سعر قبل الخصم" />
                      <Input name="quantity" type="number" placeholder="الكمية" className="h-9" aria-label="كمية" />
                      <Input name="reserved_quantity" type="number" placeholder="محجوز" className="h-9" aria-label="محجوز" />
                      <div className="flex gap-2">
                        <Input name="low_stock_threshold" type="number" placeholder="حد التنبيه" className="h-9" aria-label="حد التنبيه" />
                        <Button type="submit" size="sm" disabled={busy}>إضافة</Button>
                      </div>
                    </form>
                  </Td>
                </tr>
              </tbody>
            </TableScroller>
          </Panel>

          <Panel title="الصور" description="ارفع صور المنتج الحقيقية وحدد ترتيبها ووصفها.">
            <div className="grid gap-4 p-4">
              <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {(product?.product_images ?? []).map((image: any) => (
                  <li key={image.id} className="overflow-hidden rounded-md border border-border">
                    <img src={image.url} alt={image.alt_ar} loading="lazy" className="aspect-[3/4] w-full object-cover" />
                    <div className="flex items-center justify-between gap-2 p-2 text-xs">
                      <span className="truncate">{image.alt_ar}</span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="icon" variant="ghost" aria-label="حذف الصورة"><Trash2 /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>حذف الصورة؟</AlertDialogTitle><AlertDialogDescription>الصورة هتتشال من صفحة المنتج فورًا.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>رجوع</AlertDialogCancel><AlertDialogAction onClick={() => void removeImage({ data: { id: image.id } }).then(refresh)}>حذف</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </li>
                ))}
              </ul>
              <form onSubmit={submitImage} className="grid gap-3 border-t border-border pt-4 md:grid-cols-4 md:items-end">
                <label className="grid gap-1.5 text-xs font-bold">صورة من الجهاز<Input name="file" type="file" accept="image/*" className="h-9" /></label>
                <label className="grid gap-1.5 text-xs font-bold">أو رابط صورة<Input name="url" dir="ltr" className="h-9" /></label>
                <label className="grid gap-1.5 text-xs font-bold">وصف الصورة *<Input name="alt_ar" required className="h-9" /></label>
                <div className="flex gap-2">
                  <Input name="sort_order" type="number" defaultValue={(product?.product_images?.length ?? 0)} className="h-9" aria-label="الترتيب" />
                  <Button type="submit" size="sm" disabled={busy}>إضافة</Button>
                </div>
              </form>
            </div>
          </Panel>

          <Panel title="أسعار الجملة">
            <TableState empty={!(product?.product_variants ?? []).some((variant: any) => (variant.wholesale_prices ?? []).length)} emptyLabel="لا أسعار جملة — أضفها من صفحة الجملة">
              <TableScroller>
                <thead><tr><Th>الكود</Th><Th>الشريحة</Th><Th>سعر الجملة</Th><Th>أقل كمية</Th><Th>سعر التجزئة</Th></tr></thead>
                <tbody>
                  {(product?.product_variants ?? []).flatMap((variant: any) => (variant.wholesale_prices ?? []).map((price: any) => (
                    <tr key={price.id}>
                      <Td dir="ltr" className="text-xs">{variant.sku}</Td>
                      <Td>{price.tier}</Td>
                      <Td className="tabular-nums">{money(price.unit_price)}</Td>
                      <Td className="tabular-nums">{price.minimum_quantity}</Td>
                      <Td className="tabular-nums text-muted-foreground">{money(variant.retail_price)}</Td>
                    </tr>
                  )))}
                </tbody>
              </TableScroller>
            </TableState>
          </Panel>
        </>
      )}
    </>
  );
}

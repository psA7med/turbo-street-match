import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAdminOrder, saveAdminFulfillment, sendAdminOrderUpdate, updateAdminOrder } from "@/lib/admin.functions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AdminPageHeader, Panel, StatusPill, TableScroller, TableState, Td, Th, dateOnly, dateTime, fulfillmentLabels, money, paymentLabels, toneForFulfillment, toneForPayment } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/orders/$id")({ component: Page });

function Page() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const load = useServerFn(getAdminOrder);
  const update = useServerFn(updateAdminOrder);
  const saveShipment = useServerFn(saveAdminFulfillment);
  const sendUpdate = useServerFn(sendAdminOrderUpdate);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const query = useQuery({ queryKey: ["admin-order", id], queryFn: () => load({ data: { id } }), retry: false });
  const order = query.data?.order;
  const profile = query.data?.profile;
  const payment = order?.payments?.[0];
  const shipment = order?.fulfillments?.[0];
  const address = order?.shipping_address ?? {};

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
    await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const run = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await action();
      await refresh();
      toast.success(message);
    } catch {
      toast.error("تعذر تنفيذ العملية");
    } finally {
      setBusy(false);
    }
  };

  const submitShipment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void run(() => saveShipment({ data: {
      orderId: id,
      carrier: String(form.get("carrier") ?? ""),
      trackingNumber: String(form.get("tracking") ?? ""),
      status: String(form.get("status") ?? "processing"),
      eta: String(form.get("eta") ?? ""),
    } }), "اتحفظت بيانات الشحن");
  };

  const submitNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void run(() => update({ data: { id, note: String(form.get("note") ?? "") } }), "اتحفظت الملاحظة");
  };

  const notifyCustomer = async () => {
    setSending(true);
    try {
      const result = await sendUpdate({ data: { id, message: message.trim() } });
      setMessage("");
      toast.success(result.customer ? "اتبعت الإيميل للعميل" : "الإيميل مش اتسلم للعميل", {
        description: result.store ? "ووصلت نسخة لبريد المتجر." : "راجع بريد العميل وحاول تاني.",
      });
    } catch (error) {
      const missing = error instanceof Error && error.message.includes("no_recipient");
      toast.error(missing ? "الطلب مش فيه بريد للعميل" : "تعذر إرسال الإيميل");
    } finally {
      setSending(false);
    }
  };


  return (
    <>
      <AdminPageHeader
        title={order ? `طلب ${order.order_number}` : "تفاصيل الطلب"}
        {...(order ? { description: dateTime(order.created_at) } : {})}
        actions={<Button asChild variant="outline" size="sm"><Link to="/admin/orders"><ArrowRight /> كل الطلبات</Link></Button>}
      />

      <TableState loading={query.isLoading} error={query.error}>
        {order && (
          <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
            <div className="grid gap-5">
              <Panel title="الأصناف">
                <TableScroller>
                  <thead><tr><Th>المنتج</Th><Th>الكود</Th><Th>اللون / المقاس</Th><Th>الكمية</Th><Th>سعر الوحدة</Th><Th>الإجمالي</Th></tr></thead>
                  <tbody>
                    {(order.order_items ?? []).map((item: any) => (
                      <tr key={item.id}>
                        <Td>{item.product_name_ar}</Td>
                        <Td dir="ltr" className="text-xs">{item.sku}</Td>
                        <Td className="text-xs">{item.color_name_ar} · <span dir="ltr">{item.size_label}</span></Td>
                        <Td className="tabular-nums">{item.quantity}</Td>
                        <Td className="tabular-nums">{money(item.unit_price)}</Td>
                        <Td className="font-semibold tabular-nums">{money(item.line_total)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </TableScroller>
                <dl className="grid gap-2 border-t border-border p-4 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">المجموع</dt><dd className="tabular-nums">{money(order.subtotal)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">الخصم</dt><dd className="tabular-nums">{money(order.discount_total)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">الشحن</dt><dd className="tabular-nums">{money(order.shipping_total)}</dd></div>
                  <div className="flex justify-between border-t border-border pt-2 text-base font-extrabold"><dt>الإجمالي</dt><dd className="tabular-nums">{money(order.grand_total)}</dd></div>
                </dl>
              </Panel>

              <Panel title="الشحن والتتبع">
                <form onSubmit={submitShipment} className="grid gap-3 p-4 md:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-bold">شركة الشحن<Input name="carrier" defaultValue={shipment?.carrier ?? ""} className="h-9" /></label>
                  <label className="grid gap-1.5 text-xs font-bold">رقم التتبع<Input name="tracking" dir="ltr" defaultValue={shipment?.tracking_number ?? ""} className="h-9" /></label>
                  <label className="grid gap-1.5 text-xs font-bold">حالة الشحنة
                    <Select name="status" defaultValue={shipment?.status ?? "processing"}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(fulfillmentLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                    </Select>
                  </label>
                  <label className="grid gap-1.5 text-xs font-bold">تاريخ التسليم المتوقع<Input name="eta" type="date" defaultValue={shipment?.estimated_delivery_date ?? ""} className="h-9" /></label>
                  <div className="md:col-span-2"><Button type="submit" size="sm" disabled={busy}>{busy ? "جاري الحفظ…" : "حفظ بيانات الشحن"}</Button></div>
                </form>
              </Panel>

              <Panel title="ملاحظة الطلب">
                <form onSubmit={submitNote} className="grid gap-3 p-4">
                  <label className="grid gap-1.5 text-xs font-bold" htmlFor="order-note">ملاحظة داخلية أو ملاحظة العميل</label>
                  <Textarea id="order-note" name="note" rows={3} defaultValue={order.customer_note ?? ""} />
                  <Button type="submit" size="sm" variant="outline" disabled={busy}>حفظ الملاحظة</Button>
                </form>
              </Panel>
            </div>

            <div className="grid gap-5">
              <Panel title="الحالة">
                <div className="grid gap-4 p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill label={fulfillmentLabels[order.fulfillment_status] ?? order.fulfillment_status} tone={toneForFulfillment(order.fulfillment_status)} />
                    <StatusPill label={paymentLabels[payment?.status ?? "pending"] ?? "غير مدفوع"} tone={toneForPayment(payment?.status ?? "pending")} />
                    <StatusPill label={order.kind === "wholesale" ? "جملة" : "تجزئة"} tone="neutral" />
                  </div>
                  <label className="grid gap-1.5 text-xs font-bold">تحديث حالة التنفيذ
                    <Select value={order.fulfillment_status} onValueChange={(value) => void run(() => update({ data: { id, fulfillmentStatus: value } }), "اتحدثت حالة التنفيذ")}>
                      <SelectTrigger className="h-9" disabled={busy}><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(fulfillmentLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                    </Select>
                  </label>
                  <label className="grid gap-1.5 text-xs font-bold">تحديث حالة الدفع
                    <Select value={payment?.status ?? "pending"} onValueChange={(value) => void run(() => update({ data: { id, paymentStatus: value } }), "اتحدثت حالة الدفع")}>
                      <SelectTrigger className="h-9" disabled={busy}><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(paymentLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                    </Select>
                  </label>
                  {order.fulfillment_status !== "cancelled" && (
                    <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                      <DialogTrigger asChild><Button variant="outline" size="sm" disabled={busy}>إلغاء الطلب</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>إلغاء الطلب؟</DialogTitle><DialogDescription>اكتب سبب الإلغاء — هيتسجل مع الطلب للرجوع إليه.</DialogDescription></DialogHeader>
                        <label className="grid gap-1.5 text-xs font-bold" htmlFor="cancel-reason">سبب الإلغاء *</label>
                        <Textarea id="cancel-reason" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="مثال: العميل طلب الإلغاء / المقاس غير متاح" />
                        <DialogFooter>
                          <Button variant="outline" size="sm" onClick={() => setCancelOpen(false)}>رجوع</Button>
                          <Button size="sm" disabled={busy || !reason.trim()} onClick={() => {
                            const note = `${order.customer_note ? `${order.customer_note}\n` : ""}سبب الإلغاء: ${reason.trim()}`;
                            void run(() => update({ data: { id, fulfillmentStatus: "cancelled", note } }), "اتم إلغاء الطلب").then(() => { setCancelOpen(false); setReason(""); });
                          }}>تأكيد الإلغاء</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  {order.customer_note?.includes("سبب الإلغاء:") && (
                    <p className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">{order.customer_note.split("سبب الإلغاء:").pop()?.trim()}</p>
                  )}
                </div>
              </Panel>

              <Panel title="العميل والعنوان">
                <div className="grid gap-2 p-4 text-sm">
                  <p className="font-bold">{address.customer_name ?? profile?.full_name ?? "عميل"}</p>
                  <p dir="ltr" className="text-start text-muted-foreground">{order.guest_phone || address.phone || profile?.phone || "—"}</p>
                  <p dir="ltr" className="text-start text-muted-foreground">{order.guest_email || "—"}</p>
                  <p className="mt-2 leading-6">{[address.governorate, address.city, address.street_address, address.landmark].filter(Boolean).join(" · ") || "لا يوجد عنوان"}</p>
                  {order.user_id && <Link to="/admin/customers" className="mt-2 text-xs font-bold text-primary">ملف العميل</Link>}
                </div>
              </Panel>

              <Panel title="الجدول الزمني">
                <ul className="grid gap-3 p-4 text-sm">
                  <li className="flex justify-between gap-3"><span className="text-muted-foreground">إنشاء الطلب</span><span>{dateTime(order.created_at)}</span></li>
                  <li className="flex justify-between gap-3"><span className="text-muted-foreground">آخر تحديث</span><span>{dateTime(order.updated_at)}</span></li>
                  {payment?.paid_at && <li className="flex justify-between gap-3"><span className="text-muted-foreground">تم الدفع</span><span>{dateTime(payment.paid_at)}</span></li>}
                  {shipment?.shipped_at && <li className="flex justify-between gap-3"><span className="text-muted-foreground">تم الشحن</span><span>{dateTime(shipment.shipped_at)}</span></li>}
                  {shipment?.delivered_at && <li className="flex justify-between gap-3"><span className="text-muted-foreground">تم التسليم</span><span>{dateTime(shipment.delivered_at)}</span></li>}
                  {shipment?.estimated_delivery_date && <li className="flex justify-between gap-3"><span className="text-muted-foreground">تسليم متوقع</span><span>{dateOnly(shipment.estimated_delivery_date)}</span></li>}
                </ul>
              </Panel>
            </div>
          </div>
        )}
      </TableState>
    </>
  );
}

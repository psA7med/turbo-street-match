import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listAdminOrders } from "@/lib/admin.functions";
import { AdminPageHeader, Pager, Panel, StatusPill, TableScroller, TableState, Td, Th, dateTime, fulfillmentLabels, money, paymentLabels, toneForFulfillment, toneForPayment } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/orders")({ component: Page });

const ANY = "all";

function Page() {
  const load = useServerFn(listAdminOrders);
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [fulfillment, setFulfillment] = useState(ANY);
  const [payment, setPayment] = useState(ANY);
  const [kind, setKind] = useState(ANY);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => { setDebounced(term.trim()); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [term]);

  const query = useQuery({
    queryKey: ["admin-orders", debounced, fulfillment, payment, kind, from, to, sort, page],
    queryFn: () => load({ data: {
      term: debounced || undefined,
      fulfillment: fulfillment === ANY ? undefined : fulfillment,
      payment: payment === ANY ? undefined : payment,
      kind: kind === ANY ? undefined : kind,
      from: from || undefined, to: to || undefined, sort, page,
    } }),
    retry: false,
  });
  const rows = query.data?.rows ?? [];

  const reset = () => { setTerm(""); setFulfillment(ANY); setPayment(ANY); setKind(ANY); setFrom(""); setTo(""); setSort("newest"); setPage(1); };

  return (
    <>
      <AdminPageHeader title="الطلبات" description="متابعة وتحديث طلبات التجزئة والجملة." actions={<Button variant="outline" size="sm" onClick={reset}>إعادة ضبط الفلاتر</Button>} />
      <Panel>
        <div className="grid gap-3 border-b border-border p-4 md:grid-cols-3 xl:grid-cols-6">
          <label className="grid gap-1.5 text-xs font-bold md:col-span-2">بحث<Input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="رقم الطلب أو البريد أو الموبايل" className="h-9" /></label>
          <label className="grid gap-1.5 text-xs font-bold">حالة التنفيذ
            <Select value={fulfillment} onValueChange={(value) => { setFulfillment(value); setPage(1); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ANY}>الكل</SelectItem>{Object.entries(fulfillmentLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <label className="grid gap-1.5 text-xs font-bold">حالة الدفع
            <Select value={payment} onValueChange={(value) => { setPayment(value); setPage(1); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ANY}>الكل</SelectItem>{Object.entries(paymentLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <label className="grid gap-1.5 text-xs font-bold">النوع
            <Select value={kind} onValueChange={(value) => { setKind(value); setPage(1); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ANY}>الكل</SelectItem><SelectItem value="retail">تجزئة</SelectItem><SelectItem value="wholesale">جملة</SelectItem></SelectContent>
            </Select>
          </label>
          <label className="grid gap-1.5 text-xs font-bold">الترتيب
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="newest">الأحدث</SelectItem><SelectItem value="oldest">الأقدم</SelectItem><SelectItem value="total">الأعلى قيمة</SelectItem></SelectContent>
            </Select>
          </label>
          <label className="grid gap-1.5 text-xs font-bold">من تاريخ<Input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="h-9" /></label>
          <label className="grid gap-1.5 text-xs font-bold">إلى تاريخ<Input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="h-9" /></label>
        </div>
        <TableState loading={query.isLoading} error={query.error} empty={!rows.length} emptyLabel="لا طلبات مطابقة">
          <TableScroller>
            <thead>
              <tr><Th>رقم الطلب</Th><Th>العميل</Th><Th>التاريخ</Th><Th>الأصناف</Th><Th>الإجمالي</Th><Th>الدفع</Th><Th>التنفيذ</Th><Th>النوع</Th><Th>إجراء</Th></tr>
            </thead>
            <tbody>
              {rows.map((order: any) => {
                const paymentStatus = order.payments?.[0]?.status ?? "pending";
                return (
                  <tr key={order.id} className="hover:bg-accent/50">
                    <Td><Link to="/admin/orders/$id" params={{ id: order.id }} className="font-bold text-primary" dir="ltr">{order.order_number}</Link></Td>
                    <Td>{order.shipping_address?.customer_name ?? "—"}<span className="block text-xs text-muted-foreground" dir="ltr">{order.guest_phone || order.guest_email || ""}</span></Td>
                    <Td className="whitespace-nowrap text-xs text-muted-foreground">{dateTime(order.created_at)}</Td>
                    <Td className="tabular-nums">{order.order_items?.length ?? 0}</Td>
                    <Td className="font-semibold tabular-nums">{money(order.grand_total)}</Td>
                    <Td><StatusPill label={paymentLabels[paymentStatus] ?? paymentStatus} tone={toneForPayment(paymentStatus)} /></Td>
                    <Td><StatusPill label={fulfillmentLabels[order.fulfillment_status] ?? order.fulfillment_status} tone={toneForFulfillment(order.fulfillment_status)} /></Td>
                    <Td className="text-xs">{order.kind === "wholesale" ? "جملة" : "تجزئة"}</Td>
                    <Td><Button asChild size="sm" variant="outline"><Link to="/admin/orders/$id" params={{ id: order.id }}>تفاصيل</Link></Button></Td>
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

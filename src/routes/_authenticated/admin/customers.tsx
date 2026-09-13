import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAdminCustomer, listAdminCustomers } from "@/lib/admin.functions";
import { AdminPageHeader, Pager, Panel, StatusPill, TableScroller, TableState, Td, Th, applicationLabels, dateOnly, fulfillmentLabels, money } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/customers")({ component: Page });

function Page() {
  const load = useServerFn(listAdminCustomers);
  const loadOne = useServerFn(getAdminCustomer);
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => { setDebounced(term.trim()); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [term]);

  const query = useQuery({
    queryKey: ["admin-customers", debounced, page],
    queryFn: () => load({ data: { ...(debounced ? { term: debounced } : {}), page } }),
    retry: false,
  });
  const detail = useQuery({
    queryKey: ["admin-customer", selected],
    queryFn: () => loadOne({ data: { id: selected! } }),
    enabled: Boolean(selected),
    retry: false,
  });
  const rows = query.data?.rows ?? [];

  return (
    <>
      <AdminPageHeader title="العملاء" description="حسابات العملاء وطلباتهم وعناوينهم." />
      <Panel>
        <div className="border-b border-border p-4">
          <Input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="بحث بالاسم أو الموبايل" className="h-9 md:max-w-sm" aria-label="بحث في العملاء" />
        </div>
        <TableState loading={query.isLoading} error={query.error} empty={!rows.length} emptyLabel="لا عملاء مطابقين">
          <TableScroller>
            <thead><tr><Th>الاسم</Th><Th>البريد</Th><Th>الموبايل</Th><Th>الطلبات</Th><Th>إجمالي الشراء</Th><Th>آخر طلب</Th><Th>تاريخ الحساب</Th><Th>الصلاحية</Th><Th>إجراء</Th></tr></thead>
            <tbody>
              {rows.map((customer: any) => (
                <tr key={customer.id} className="hover:bg-accent/50">
                  <Td className="font-semibold">{customer.full_name ?? "بدون اسم"}</Td>
                  <Td dir="ltr" className="text-xs">{customer.email ?? "—"}</Td>
                  <Td dir="ltr" className="text-xs">{customer.phone ?? "—"}</Td>
                  <Td className="tabular-nums">{customer.orders}</Td>
                  <Td className="tabular-nums">{money(customer.spent)}</Td>
                  <Td className="text-xs text-muted-foreground">{dateOnly(customer.lastOrder)}</Td>
                  <Td className="text-xs text-muted-foreground">{dateOnly(customer.created_at)}</Td>
                  <Td className="text-xs">{customer.roles?.length ? customer.roles.join(", ") : "customer"}</Td>
                  <Td><Button size="sm" variant="outline" onClick={() => setSelected(customer.id)}>تفاصيل</Button></Td>
                </tr>
              ))}
            </tbody>
          </TableScroller>
          <Pager page={query.data?.page ?? 1} size={query.data?.size ?? 20} total={query.data?.total ?? 0} onPage={setPage} />
        </TableState>
      </Panel>

      <Dialog open={Boolean(selected)} onOpenChange={(next) => !next && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail.data?.profile?.full_name ?? "ملف العميل"}</DialogTitle>
            <DialogDescription>بيانات الحساب والعناوين وسجل الطلبات.</DialogDescription>
          </DialogHeader>
          <TableState loading={detail.isLoading} error={detail.error}>
            <div className="grid gap-5 text-sm">
              <div className="grid gap-1">
                <p dir="ltr" className="text-start text-muted-foreground">{detail.data?.email ?? "—"}</p>
                <p dir="ltr" className="text-start text-muted-foreground">{detail.data?.profile?.phone ?? "—"}</p>
                <p className="text-xs text-muted-foreground">الصلاحيات: {detail.data?.roles?.length ? detail.data.roles.join(", ") : "customer"}</p>
                {detail.data?.application && (
                  <p className="mt-1 flex items-center gap-2 text-xs">طلب جملة: {detail.data.application.business_name} <StatusPill label={applicationLabels[detail.data.application.status] ?? detail.data.application.status} tone={detail.data.application.status === "approved" ? "good" : detail.data.application.status === "rejected" ? "bad" : "warn"} /></p>
                )}
              </div>
              <section>
                <h3 className="mb-2 text-sm font-bold">العناوين</h3>
                {detail.data?.addresses?.length ? (
                  <ul className="grid gap-2">
                    {detail.data.addresses.map((address: any) => (
                      <li key={address.id} className="rounded-md border border-border p-3 text-xs leading-6">
                        <strong>{address.recipient_name}</strong> · <span dir="ltr">{address.phone}</span>
                        <span className="block">{[address.governorate, address.city, address.street_address, address.building_details, address.landmark].filter(Boolean).join(" · ")}</span>
                        {address.is_default && <span className="mt-1 inline-block font-bold text-primary">العنوان الافتراضي</span>}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-xs text-muted-foreground">لا عناوين محفوظة</p>}
              </section>
              <section>
                <h3 className="mb-2 text-sm font-bold">الطلبات</h3>
                {detail.data?.orders?.length ? (
                  <ul className="grid gap-2">
                    {detail.data.orders.map((order: any) => (
                      <li key={order.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-xs">
                        <Link to="/admin/orders/$id" params={{ id: order.id }} className="font-bold text-primary" dir="ltr">{order.order_number}</Link>
                        <span>{money(order.grand_total)}</span>
                        <span>{fulfillmentLabels[order.fulfillment_status] ?? order.fulfillment_status}</span>
                        <span className="text-muted-foreground">{dateOnly(order.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-xs text-muted-foreground">لا طلبات بعد</p>}
              </section>
            </div>
          </TableState>
        </DialogContent>
      </Dialog>
    </>
  );
}

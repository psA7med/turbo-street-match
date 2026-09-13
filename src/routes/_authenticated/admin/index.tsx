import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminOverview } from "@/lib/admin.functions";
import { AdminPageHeader, Panel, StatCard, StatusPill, TableScroller, TableState, Td, Th, dateOnly, dateTime, fulfillmentLabels, money, toneForFulfillment } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Page });

function Page() {
  const load = useServerFn(getAdminOverview);
  const query = useQuery({ queryKey: ["admin-overview"], queryFn: () => load(), refetchInterval: 60000, retry: false });
  const data = query.data;

  return (
    <>
      <AdminPageHeader title="لوحة التحكم" description="نظرة سريعة على ما يحتاج تصرفًا اليوم." />
      <TableState loading={query.isLoading} error={query.error} >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="طلبات اليوم" value={data?.stats.todayOrders ?? 0} />
          <StatCard label="إيراد اليوم" value={money(data?.stats.todayRevenue)} />
          <StatCard label="طلبات بانتظار التأكيد" value={data?.stats.pendingOrders ?? 0} tone="warn" />
          <StatCard label="أصناف قاربت على النفاد" value={data?.stats.lowStockCount ?? 0} tone="bad" />
          <StatCard label="طلبات الأسبوع" value={data?.stats.weekOrders ?? 0} />
          <StatCard label="إيراد الأسبوع" value={money(data?.stats.weekRevenue)} />
          <StatCard label="عملاء جدد (٧ أيام)" value={data?.stats.newCustomers ?? 0} />
          <StatCard label="طلبات جملة للمراجعة" value={data?.stats.pendingWholesale ?? 0} tone="accent" />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="أحدث الطلبات" actions={<Link to="/admin/orders" className="text-xs font-bold text-primary">كل الطلبات</Link>}>
            <TableState empty={!data?.recentOrders.length} emptyLabel="لا طلبات بعد">
              <TableScroller>
                <thead><tr><Th>رقم الطلب</Th><Th>العميل</Th><Th>التاريخ</Th><Th>الإجمالي</Th><Th>الحالة</Th></tr></thead>
                <tbody>
                  {(data?.recentOrders ?? []).map((order: any) => (
                    <tr key={order.id} className="hover:bg-accent/50">
                      <Td><Link to="/admin/orders/$id" params={{ id: order.id }} className="font-bold text-primary" dir="ltr">{order.order_number}</Link></Td>
                      <Td>{order.shipping_address?.customer_name ?? "—"}</Td>
                      <Td className="text-xs text-muted-foreground">{dateOnly(order.created_at)}</Td>
                      <Td className="font-semibold tabular-nums">{money(order.grand_total)}</Td>
                      <Td><StatusPill label={fulfillmentLabels[order.fulfillment_status] ?? order.fulfillment_status} tone={toneForFulfillment(order.fulfillment_status)} /></Td>
                    </tr>
                  ))}
                </tbody>
              </TableScroller>
            </TableState>
          </Panel>

          <Panel title="أصناف قاربت على النفاد" actions={<Link to="/admin/inventory" className="text-xs font-bold text-primary">المخزون</Link>}>
            <TableState empty={!data?.lowStock.length} emptyLabel="المخزون في أمان">
              <TableScroller>
                <thead><tr><Th>المنتج</Th><Th>الكود</Th><Th>المتاح</Th><Th>الحد</Th></tr></thead>
                <tbody>
                  {(data?.lowStock ?? []).map((row: any) => (
                    <tr key={row.variant_id} className="hover:bg-accent/50">
                      <Td>{row.product_variants?.products?.name_ar ?? "—"}<span className="block text-xs text-muted-foreground">{row.product_variants?.color_name_ar} · <span dir="ltr">{row.product_variants?.size_label}</span></span></Td>
                      <Td dir="ltr" className="text-xs">{row.product_variants?.sku}</Td>
                      <Td className="font-bold tabular-nums">{row.quantity - row.reserved_quantity}</Td>
                      <Td className="tabular-nums text-muted-foreground">{row.low_stock_threshold}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableScroller>
            </TableState>
          </Panel>

          <Panel title="طلبات جملة قيد المراجعة" actions={<Link to="/admin/wholesale" className="text-xs font-bold text-primary">إدارة الجملة</Link>}>
            <TableState empty={!data?.wholesale.length} emptyLabel="لا طلبات جملة جديدة">
              <ul className="divide-y divide-border">
                {(data?.wholesale ?? []).map((row: any) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span><strong>{row.business_name}</strong><span className="block text-xs text-muted-foreground">{row.contact_name} · {row.governorate}</span></span>
                    <span className="text-xs text-muted-foreground">{dateOnly(row.created_at)}</span>
                  </li>
                ))}
              </ul>
            </TableState>
          </Panel>

          <Panel title="أحدث التقييمات" actions={<Link to="/admin/reviews" className="text-xs font-bold text-primary">كل التقييمات</Link>}>
            <TableState empty={!data?.reviews.length} emptyLabel="لا تقييمات بعد">
              <ul className="divide-y divide-border">
                {(data?.reviews ?? []).map((row: any) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span><strong>{row.products?.name_ar ?? "—"}</strong><span className="block text-xs text-muted-foreground">{row.title || "بدون عنوان"} · {row.rating}/5</span></span>
                    <span className="text-xs text-muted-foreground">{dateTime(row.created_at)}</span>
                  </li>
                ))}
              </ul>
            </TableState>
          </Panel>
        </div>
      </TableState>
    </>
  );
}

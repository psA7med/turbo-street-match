import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminSettings } from "@/lib/admin.functions";
import { AdminPageHeader, Panel, StatCard, TableScroller, TableState, Td, Th } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: Page });

function Page() {
  const load = useServerFn(getAdminSettings);
  const query = useQuery({ queryKey: ["admin-settings"], queryFn: () => load(), retry: false });

  return (
    <>
      <AdminPageHeader title="الإعدادات" description="ملخص المتجر وصلاحيات الإدارة." />
      <TableState loading={query.isLoading} error={query.error}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="المنتجات" value={query.data?.counts.products ?? 0} />
          <StatCard label="الطلبات" value={query.data?.counts.orders ?? 0} />
          <StatCard label="العملاء" value={query.data?.counts.customers ?? 0} />
          <StatCard label="مناطق شحن مفعّلة" value={query.data?.counts.activeZones ?? 0} />
        </div>
        <Panel title="حسابات الإدارة" description="الصلاحيات تُدار من قاعدة البيانات فقط.">
          <TableState empty={!query.data?.admins.length} emptyLabel="لا حسابات إدارة">
            <TableScroller>
              <thead><tr><Th>البريد</Th><Th>الصلاحية</Th></tr></thead>
              <tbody>
                {(query.data?.admins ?? []).map((admin: any) => (
                  <tr key={`${admin.email}-${admin.role}`}><Td dir="ltr" className="text-xs">{admin.email}</Td><Td className="text-xs">{admin.role}</Td></tr>
                ))}
              </tbody>
            </TableScroller>
          </TableState>
        </Panel>
      </TableState>
    </>
  );
}

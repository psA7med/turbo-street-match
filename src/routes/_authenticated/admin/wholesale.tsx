import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { listWholesaleApplications, updateWholesaleApplicationStatus } from "@/lib/wholesale-admin.functions";
import { AdminPageHeader, Panel, StatusPill, TableScroller, TableState, Td, Th, applicationLabels, dateOnly } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/wholesale")({ component: Page });

const tabs = [{ key: "pending", label: "قيد المراجعة" }, { key: "approved", label: "مقبول" }, { key: "rejected", label: "مرفوض" }];

function Page() {
  const load = useServerFn(listWholesaleApplications);
  const save = useServerFn(updateWholesaleApplicationStatus);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["admin-wholesale-applications"], queryFn: () => load(), refetchInterval: 30000, retry: false });
  const rows = (query.data ?? []).filter((row: any) => row.status === tab);

  const change = async (id: string, status: "approved" | "rejected") => {
    setBusy(id);
    try {
      await save({ data: { applicationId: id, status } });
      await queryClient.invalidateQueries({ queryKey: ["admin-wholesale-applications"] });
      toast.success(status === "approved" ? "تم قبول التاجر" : "تم رفض الطلب");
    } catch {
      toast.error("تعذر تحديث حالة الطلب");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <AdminPageHeader title="تجار الجملة" description="مراجعة طلبات الجملة وقبولها أو رفضها." />
      <Panel>
        <div className="flex flex-wrap gap-2 border-b border-border p-4" role="tablist" aria-label="حالة الطلبات">
          {tabs.map((item) => (
            <Button key={item.key} role="tab" aria-selected={tab === item.key} size="sm" variant={tab === item.key ? "default" : "outline"} onClick={() => setTab(item.key)}>{item.label}</Button>
          ))}
        </div>
        <TableState loading={query.isLoading} error={query.error} empty={!rows.length} emptyLabel="لا طلبات في الحالة دي">
          <TableScroller>
            <thead><tr><Th>النشاط</Th><Th>المسؤول</Th><Th>الموبايل</Th><Th>المحافظة</Th><Th>العنوان</Th><Th>السجل الضريبي</Th><Th>الحالة</Th><Th>التقديم</Th><Th>إجراء</Th></tr></thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id} className="hover:bg-accent/50">
                  <Td className="font-semibold">{row.business_name}<span className="block text-xs text-muted-foreground">{row.business_type || "نوع غير محدد"}</span></Td>
                  <Td className="text-xs">{row.contact_name}<span className="block text-muted-foreground">{row.profile?.full_name ?? ""}</span></Td>
                  <Td dir="ltr" className="text-xs">{row.phone}</Td>
                  <Td className="text-xs">{row.governorate}</Td>
                  <Td className="max-w-xs text-xs">{row.address}{row.notes && <span className="block text-muted-foreground">{row.notes}</span>}</Td>
                  <Td dir="ltr" className="text-xs">{row.tax_registration || "—"}</Td>
                  <Td><StatusPill label={applicationLabels[row.status] ?? row.status} tone={row.status === "approved" ? "good" : row.status === "rejected" ? "bad" : "warn"} /></Td>
                  <Td className="text-xs text-muted-foreground">{dateOnly(row.created_at)}<span className="block">{row.reviewed_at ? `المراجعة: ${dateOnly(row.reviewed_at)}` : ""}</span></Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button size="sm" disabled={busy === row.id || row.status === "approved"} onClick={() => void change(row.id, "approved")}>قبول</Button>
                      <Button size="sm" variant="outline" disabled={busy === row.id || row.status === "rejected"} onClick={() => void change(row.id, "rejected")}>رفض</Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableScroller>
        </TableState>
      </Panel>
    </>
  );
}

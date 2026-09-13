import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listAdminReviews, setAdminReviewStatus } from "@/lib/admin.functions";
import { AdminPageHeader, Pager, Panel, StatusPill, TableScroller, TableState, Td, Th, dateOnly, reviewLabels } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/reviews")({ component: Page });

const ANY = "all";

function Page() {
  const load = useServerFn(listAdminReviews);
  const save = useServerFn(setAdminReviewStatus);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(ANY);
  const [rating, setRating] = useState(ANY);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin-reviews", status, rating, page],
    queryFn: () => load({ data: { ...(status === ANY ? {} : { status }), ...(rating === ANY ? {} : { rating: Number(rating) }), page } }),
    retry: false,
  });
  const rows = query.data?.rows ?? [];

  const change = async (id: string, next: string) => {
    setBusy(id);
    try {
      await save({ data: { id, status: next } });
      await queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success(next === "published" ? "اتنشر التقييم" : next === "rejected" ? "اترفض التقييم" : "رجع لقائمة المراجعة");
    } catch {
      toast.error("تعذر تحديث التقييم");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <AdminPageHeader title="التقييمات" description="مراجعة تقييمات العملاء قبل نشرها." />
      <Panel>
        <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-2 md:max-w-lg">
          <label className="grid gap-1.5 text-xs font-bold">الحالة
            <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ANY}>الكل</SelectItem>{Object.entries(reviewLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <label className="grid gap-1.5 text-xs font-bold">التقييم
            <Select value={rating} onValueChange={(value) => { setRating(value); setPage(1); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ANY}>الكل</SelectItem>{[5, 4, 3, 2, 1].map((value) => <SelectItem key={value} value={String(value)}>{value} نجوم</SelectItem>)}</SelectContent>
            </Select>
          </label>
        </div>
        <TableState loading={query.isLoading} error={query.error} empty={!rows.length} emptyLabel="لا تقييمات مطابقة">
          <TableScroller>
            <thead><tr><Th>المنتج</Th><Th>العميل</Th><Th>التقييم</Th><Th>العنوان والنص</Th><Th>المقاس</Th><Th>الحالة</Th><Th>التاريخ</Th><Th>إجراء</Th></tr></thead>
            <tbody>
              {rows.map((review: any) => (
                <tr key={review.id} className="hover:bg-accent/50">
                  <Td className="font-semibold">{review.products?.name_ar ?? "—"}</Td>
                  <Td className="text-xs">{review.customer ?? "—"}</Td>
                  <Td className="tabular-nums">{review.rating}/5</Td>
                  <Td className="max-w-sm text-xs"><strong>{review.title || "بدون عنوان"}</strong><span className="block text-muted-foreground">{review.body || "—"}</span></Td>
                  <Td className="text-xs">{review.fit_feedback || "—"}</Td>
                  <Td><StatusPill label={reviewLabels[review.status] ?? review.status} tone={review.status === "published" ? "good" : review.status === "rejected" ? "bad" : "warn"} /></Td>
                  <Td className="text-xs text-muted-foreground">{dateOnly(review.created_at)}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled={busy === review.id || review.status === "published"} onClick={() => void change(review.id, "published")}>نشر</Button>
                      <Button size="sm" variant="ghost" disabled={busy === review.id || review.status === "rejected"} onClick={() => void change(review.id, "rejected")}>رفض</Button>
                      {review.status !== "pending" && <Button size="sm" variant="ghost" disabled={busy === review.id} onClick={() => void change(review.id, "pending")}>إخفاء</Button>}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableScroller>
          <Pager page={query.data?.page ?? 1} size={query.data?.size ?? 20} total={query.data?.total ?? 0} onPage={setPage} />
        </TableState>
      </Panel>
    </>
  );
}

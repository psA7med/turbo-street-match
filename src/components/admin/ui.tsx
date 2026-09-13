import type { ReactNode } from "react";
import { AlertTriangle, Inbox, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(Number(value ?? 0));

export const dateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export const dateOnly = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

export const fulfillmentLabels: Record<string, string> = {
  pending: "بانتظار التأكيد", confirmed: "مؤكد", processing: "تحت التجهيز",
  shipped: "تم الشحن", delivered: "تم التسليم", cancelled: "ملغي",
};
export const paymentLabels: Record<string, string> = {
  pending: "غير مدفوع", paid: "مدفوع", failed: "فشل", refunded: "مسترجع", cod: "دفع عند الاستلام",
};
export const statusLabels: Record<string, string> = { draft: "مسودة", published: "منشور", archived: "مؤرشف" };
export const reviewLabels: Record<string, string> = { pending: "بانتظار المراجعة", published: "منشور", rejected: "مرفوض" };
export const applicationLabels: Record<string, string> = { pending: "قيد المراجعة", approved: "مقبول", rejected: "مرفوض" };

const tones: Record<string, string> = {
  neutral: "bg-muted text-foreground/80 border-border",
  warn: "border-amber-300 bg-amber-50 text-amber-800",
  good: "border-emerald-300 bg-emerald-50 text-emerald-800",
  bad: "border-red-300 bg-red-50 text-red-700",
  accent: "border-primary/30 bg-primary/10 text-primary",
};

export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: keyof typeof tones }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold", tones[tone])}>{label}</span>;
}

export const toneForFulfillment = (status: string): keyof typeof tones =>
  status === "delivered" ? "good" : status === "cancelled" ? "bad" : status === "pending" ? "warn" : "neutral";
export const toneForPayment = (status: string): keyof typeof tones =>
  status === "paid" ? "good" : status === "failed" ? "bad" : "warn";

export function AdminPageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, actions, children, className }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-border bg-card", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            {title && <h2 className="text-sm font-bold">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint, tone = "neutral" }: { label: string; value: string | number; hint?: string; tone?: keyof typeof tones }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-2xl font-extrabold tabular-nums", tone === "warn" && "text-amber-700", tone === "bad" && "text-red-600", tone === "accent" && "text-primary")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TableState({ loading, error, empty, emptyLabel = "لا توجد بيانات", children }: { loading?: boolean; error?: unknown; empty?: boolean; emptyLabel?: string; children: ReactNode }) {
  if (loading) return <div className="grid place-items-center p-10" role="status" aria-live="polite"><LoaderCircle className="size-6 animate-spin text-primary" /><span className="mt-2 text-sm text-muted-foreground">جاري التحميل…</span></div>;
  if (error) return <div className="grid place-items-center p-10 text-center" role="alert"><AlertTriangle className="size-6 text-red-600" /><p className="mt-2 text-sm font-semibold">تعذر تحميل البيانات</p><p className="text-xs text-muted-foreground">{(error as Error)?.message === "forbidden" ? "الصفحة متاحة للإدارة فقط." : "جرّب التحديث مرة أخرى."}</p></div>;
  if (empty) return <div className="grid place-items-center p-10 text-center"><Inbox className="size-6 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">{emptyLabel}</p></div>;
  return <>{children}</>;
}

export function TableScroller({ children }: { children: ReactNode }) {
  return <div className="w-full overflow-x-auto"><table className="w-full min-w-[46rem] border-collapse text-sm">{children}</table></div>;
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th scope="col" className={cn("border-b border-border px-4 py-2.5 text-start text-xs font-bold text-muted-foreground", className)}>{children}</th>;
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("border-b border-border px-4 py-3 align-middle", className)}>{children}</td>;
}

export function Pager({ page, size, total, onPage }: { page: number; size: number; total: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;
  return (
    <nav className="flex items-center justify-between gap-3 px-4 py-3 text-sm" aria-label="ترقيم الصفحات">
      <span className="text-xs text-muted-foreground">صفحة {page} من {pages} · {total} سجل</span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>السابق</Button>
        <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>التالي</Button>
      </div>
    </nav>
  );
}

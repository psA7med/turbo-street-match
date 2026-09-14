import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Store, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { money } from "@/components/storefront/catalog";
import { removeCartLine, setCartQuantity, useCart } from "@/lib/cart";
import { useWholesale } from "@/hooks/use-wholesale";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [
    { title: "سلة التسوق — TURBO" },
    { name: "description", content: "راجع قطع TURBO المختارة قبل إتمام الطلب." },
    { property: "og:title", content: "سلة TURBO" },
    { property: "og:description", content: "راجع طلبك وأكمل الشراء." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

function Page() {
  const { lines } = useCart();
  const { approved, price, minQuantity } = useWholesale();
  const maxPerLine = approved ? 500 : 10;
  const priced = lines.map((line) => ({ ...line, price: price(line.variantId, line.quantity, line.unitPrice) }));
  const subtotal = priced.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const totalQuantity = priced.reduce((sum, line) => sum + line.quantity, 0);
  const missing = approved ? Math.max(0, minQuantity - totalQuantity) : 0;

  return (
    <div className="turbo-container section-space min-h-[60vh]">
      <h1 className="text-4xl font-bold md:text-6xl">السلة</h1>
      {approved && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-[10px] border border-primary bg-primary/5 p-4 text-sm">
          <Store className="size-5 text-primary" aria-hidden="true" />
          <strong>أسعار الجملة مطبقة على حسابك</strong>
          <span className="text-muted-foreground">أقل كمية للطلب {minQuantity} قطع (مختلفة أو من نفس الموديل).</span>
        </div>
      )}
      {!lines.length ? (
        <div className="mt-10 grid min-h-72 place-items-center rounded-[10px] border border-border bg-card text-center">
          <div>
            <ShoppingBag className="mx-auto size-12 text-primary" />
            <h2 className="mt-4 text-2xl font-bold">السلة فاضية</h2>
            <p className="mt-2 text-muted-foreground">اختار قطعتك، لونك ومقاسك ونكمّل.</p>
            <Button asChild className="mt-6"><Link to="/shop">ابدأ التسوق</Link></Button>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-4">
            {priced.map((x) => (
              <article key={x.variantId} className="grid grid-cols-[96px_1fr] gap-4 rounded-[10px] border border-border bg-card p-4 sm:grid-cols-[128px_1fr_auto]">
                {x.image ? <img src={x.image} alt={x.name} className="aspect-square size-24 rounded-lg object-cover sm:size-32" /> : <div className="grid size-24 place-items-center rounded-lg bg-muted sm:size-32"><ShoppingBag /></div>}
                <div>
                  <Link to="/products/$slug" params={{ slug: x.slug }} className="font-bold hover:text-primary">{x.name}</Link>
                  <p className="mt-2 text-sm text-muted-foreground">{x.color} · المقاس {x.size}</p>
                  <p dir="ltr" className="mt-1 text-start text-xs text-muted-foreground">SKU: {x.sku}</p>
                  {approved && x.price < x.unitPrice && <p className="mt-1 text-xs font-bold text-primary">سعر جملة {money(x.price)} للقطعة</p>}
                  <div className="mt-4 flex w-fit items-center rounded-lg border">
                    <button aria-label="زيادة" className="p-2" onClick={() => setCartQuantity(x.variantId, Math.min(x.quantity + 1, maxPerLine))}><Plus className="size-4" /></button>
                    <span className="w-10 text-center font-bold">{x.quantity}</span>
                    <button aria-label="تقليل" className="p-2" onClick={() => setCartQuantity(x.variantId, x.quantity - 1)}><Minus className="size-4" /></button>
                  </div>
                </div>
                <div className="col-span-2 flex items-end justify-between sm:col-span-1 sm:flex-col">
                  <strong>{money(x.price * x.quantity)}</strong>
                  <button onClick={() => removeCartLine(x.variantId)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /> حذف</button>
                </div>
              </article>
            ))}
          </div>
          <aside className="h-fit rounded-[10px] bg-brand-black p-6 text-primary-foreground lg:sticky lg:top-28">
            <h2 className="text-xl font-bold">ملخص الطلب</h2>
            <div className="mt-6 flex justify-between border-b border-primary-foreground/15 pb-5"><span>الإجمالي الفرعي</span><strong>{money(subtotal)}</strong></div>
            <p className="mt-4 text-sm text-primary-foreground/60">{totalQuantity} قطعة في السلة</p>
            {missing > 0 && <p className="mt-3 rounded-lg bg-primary/20 p-3 text-sm font-bold">ناقص {missing} قطعة للوصول لأقل كمية جملة ({minQuantity} قطع).</p>}
            <p className="mt-4 text-sm leading-6 text-primary-foreground/60">الشحن والخصومات تظهر في الخطوة التالية حسب العنوان.</p>
            {missing > 0 ? (
              <Button size="lg" className="mt-6 w-full" disabled>إتمام الطلب</Button>
            ) : (
              <Button asChild size="lg" className="mt-6 w-full"><Link to="/checkout">إتمام الطلب</Link></Button>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/hooks/use-wishlist";
import { ProductCard, type CatalogProduct } from "@/components/storefront/catalog";

export const Route = createFileRoute("/wishlist")({
  component: WishlistPage,
});

function WishlistPage() {
  const { ids } = useWishlist();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["wishlist-products", ids],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id,slug,name_ar,name_en,is_new,is_bestseller,category_id,product_images(url,alt_ar,sort_order),product_variants(id,retail_price,compare_at_price,color_name_ar,color_value,size_label,sku)")
        .in("id", ids)
        .eq("status", "published");
      if (error) throw error;
      return (data ?? []) as CatalogProduct[];
    },
    enabled: ids.length > 0
  });

  return (
    <div className="turbo-container section-space">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">المفضلة</h1>
        <span className="text-muted-foreground">{ids.length} قطعة</span>
      </div>

      {ids.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 rounded-full bg-muted p-6">
            <Heart className="size-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold">مفيش حاجة في المفضلة</h2>
          <p className="mt-2 text-muted-foreground">تقدر تضيف القطع اللي عجبتك هنا عشان ترجعلها تاني بسهولة.</p>
          <Link to="/shop" className="mt-8 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            تصفح المتجر
          </Link>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-[10px] bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

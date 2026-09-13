import sys

content = open("src/components/storefront/catalog.tsx").read()

# Add imports
imports = 'import { Heart, PackageOpen, ShoppingBag, SlidersHorizontal } from "lucide-react";\nimport { useWishlist } from "@/hooks/use-wishlist";\nimport { toggleWishlist } from "@/lib/wishlist";\nimport { cn } from "@/lib/utils";'
content = content.replace('import { Heart, PackageOpen, ShoppingBag, SlidersHorizontal } from "lucide-react";', imports)

# Update ProductCard
old_btn = '<Button type="button" variant="outline" size="icon" aria-label="أضف للمفضلة" className="absolute end-3 top-3 rounded-lg bg-background/95 shadow-none"><Heart className="size-5"/></Button>'
new_btn = 'const { has } = useWishlist();\n  return <article className="group min-w-0"><div className="relative"><Link to="/products/" params={{slug:product.slug}} className="relative block aspect-[4/5] overflow-hidden rounded-[10px] border border-border bg-off-white">\n    {image?<><img src={image.url} alt={image.alt_ar} loading="lazy" className="size-full object-cover transition-opacity duration-300 group-hover:opacity-0"/>{alternate&&<img src={alternate.url} alt={alternate.alt_ar} loading="lazy" className="absolute inset-0 size-full object-cover opacity-0 transition-all duration-300 group-hover:scale-[1.02] group-hover:opacity-100"/></>:<img src={mark.url} alt="" className="absolute inset-0 m-auto w-1/2 opacity-[.08]"/>}\n    <div className="absolute start-3 top-3 flex flex-wrap gap-2">{product.is_new&&<Badge>جديد</Badge>}{product.is_bestseller&&<Badge variant="secondary">الأكثر طلباً</Badge>}</div>\n  </Link><Button type="button" variant="outline" size="icon" aria-label="أضف للمفضلة" onClick={() => toggleWishlist(product.id)} className="absolute end-3 top-3 rounded-lg bg-background/95 shadow-none"><Heart className={cn("size-5", has(product.id) && "fill-primary text-primary")}/></Button>'

# Note: The search for old_btn might need to be more precise due to the complex return statement.
# Let's find the line and replace it.

content = content.replace(old_btn, '<Button type="button" variant="outline" size="icon" aria-label="أضف للمفضلة" onClick={() => toggleWishlist(product.id)} className="absolute end-3 top-3 rounded-lg bg-background/95 shadow-none"><Heart className={cn("size-5", has(product.id) && "fill-primary text-primary")}/></Button>')

# Add the hook call at the start of ProductCard
content = content.replace('export function ProductCard({product}:{product:CatalogProduct}){', 'export function ProductCard({product}:{product:CatalogProduct}){\n  const { has } = useWishlist();')

with open("src/components/storefront/catalog.tsx", "w") as f:
    f.write(content)

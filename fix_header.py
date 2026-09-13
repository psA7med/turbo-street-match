import sys

content = open("src/components/storefront/site-shell.tsx").read()

# Add imports
content = content.replace(
    'import { ChevronDown, LogIn, Menu, Search, ShoppingBag, Store, UserRound } from "lucide-react";',
    'import { ChevronDown, Heart, LogIn, Menu, Search, ShoppingBag, Store, UserRound } from "lucide-react";\nimport { useWishlist } from "@/hooks/use-wishlist";'
)

# Add useWishlist hook call in SiteHeader
content = content.replace('export function SiteHeader() {', 'export function SiteHeader() {\n  const { count: wishlistCount } = useWishlist();')

# Add Wishlist link next to cart link
old_cart = '<Link className="relative grid size-11 place-items-center" to="/cart"'
new_wishlist = '<Link className="relative grid size-11 place-items-center" to="/wishlist" aria-label={`المفضلة، ${wishlistCount} قطع`}><Heart className="size-5" />{wishlistCount>0&&<span className="absolute end-0 top-0 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{wishlistCount}</span>}</Link>\n          <Link className="relative grid size-11 place-items-center" to="/cart"'

content = content.replace(old_cart, new_wishlist)

with open("src/components/storefront/site-shell.tsx", "w") as f:
    f.write(content)

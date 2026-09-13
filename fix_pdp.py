import sys

content = open("src/routes/products/.tsx").read()

# Add imports
imports = 'import { ChevronLeft, Heart, Minus, Plus, Ruler, ShieldCheck, Truck } from "lucide-react";\nimport { useWishlist } from "@/hooks/use-wishlist";\nimport { toggleWishlist } from "@/lib/wishlist";\nimport { cn } from "@/lib/utils";'
content = content.replace('import { ChevronLeft, Heart, Minus, Plus, Ruler, ShieldCheck, Truck } from "lucide-react";', imports)

# Add hook call in Page component
content = content.replace('function Page(){', 'function Page(){\n  const { has } = useWishlist();')

# Update Heart button
old_heart = '<Button size="icon" variant="outline" aria-label="أضف للمفضلة"><Heart/></Button>'
new_heart = '<Button size="icon" variant="outline" aria-label="أضف للمفضلة" onClick={() => toggleWishlist(p.id)}><Heart className={cn(has(p.id) && "fill-primary text-primary")}/></Button>'
content = content.replace(old_heart, new_heart)

with open("src/routes/products/.tsx", "w") as f:
    f.write(content)

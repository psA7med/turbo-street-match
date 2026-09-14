# Street Match Studio

Build TURBO as a production-ready Arabic-first Egyptian sportswear ecommerce platform. Treat this as a complete brand/product build, not a generic store. Inspect the existing repository, stack, assets, Supabase connection/schema and reuse working code before changing anything. Do not rewrite working architecture unnecessarily.

BRAND: TURBO | Egypt | mass-market/general public | affordable but never visually cheap | Football Culture 50% + Egyptian Street 50% + Everyday Life. Personality: young, energetic, sporty, confident, accessible, Egyptian, street-aware. NOT luxury, SaaS, gaming, automotive, racing, tires, oil, garage or mechanical. Core concept: STREET MATCH = football culture + Egyptian street + everyday sportswear. Create original visuals; never copy a brand, club, campaign or website.

LOGO: use the supplied full TURBO SVG + supplied standalone T SVG as mandatory brand assets. Direction B: preserve the existing logo concept; only controlled spacing/proportion/alignment/detail refinement is allowed. Never redesign from zero. Locked logo colors: Lightning #FF4D00, TUR #111111, BO #FF4D00. Never change them. Use the orange as the signature accent, but prevent automotive/racing associations. The standalone T is the approved secondary brand mark/motif; use it consistently for controlled decoration, loading, badges, section markers, watermark/crops and responsive placements where useful. Never redraw/recreate either SVG.

VISUAL SYSTEM: football 50% + street/Egyptian 50%; dynamic but commercially usable. Visual references may be abstracted from football match graphics, street posters, sports editorial layouts, scoreboard/data language, directional movement, bold type and controlled asymmetry. Do not use literal clichés such as car parts, tire textures, carbon fiber, racing stripes, generic speed lines, random graffiti or excessive flags/symbols. Egyptian identity should come from composition, photography, tone and street/football context, not tourist clichés.

COLOR TOKENS:

brand-orange #FF4D00

brand-black #111111

white #FFFFFF

off-white #F5F3EE

gray-100 #E9E8E5

gray-500 #737373

gray-700 #3A3A3A

Default visual ratio: 60% neutral/background, 30% black/dark content, 10% orange accent. Orange is primarily CTA/active/selected/highlight/offer/status/brand-detail; never flood full pages with orange. Dark sections use black as dominant background, white text and orange accents. Light sections use off-white/white backgrounds, black text and orange accents. Do not invent additional brand colors unless required for semantic states; semantic success/error/warning colors must remain subdued and functional.

SHAPE SYSTEM: use one consistent geometry language: medium-small radii, sharp/athletic composition, no excessive pills. Default radius: 8px; card radius: 10px; modal/drawer radius: 12px; buttons 8px. Avoid random rounded corners. Use consistent 1px borders. No neumorphism. No glassmorphism unless a very specific component benefits from it, and never as the primary visual language.

SPACING: use an 8px base spacing scale: 4,8,12,16,24,32,40,48,64,80,96. Section spacing desktop 80-96; tablet 56-72; mobile 40-56. Component internal spacing should use the same scale. Do not create arbitrary spacing values unless necessary.

GRID: desktop max content width 1280px; 12-column grid; gutters 24px. Tablet 8 columns; mobile 4 columns; mobile horizontal padding 16px, tablet 24px, desktop 32px. Break layout intentionally; never simply scale desktop down.

TYPE: Arabic-first modern sans. Evaluate IBM Plex Sans Arabic against suitable modern Arabic sans alternatives before finalizing; IBM Plex Sans Arabic is a valid candidate, not an automatic decision. Core hierarchy: Hero 56-80px desktop / 36-48px mobile; H1 40-56 / 30-36; H2 32-40 / 24-30; H3 24-30 / 20-24; body 16-18 / 15-16; caption 12-14. Use strong weights for sports/marketing headlines and readable regular/medium weights for commerce. English/logo text may remain LTR where appropriate. Never use decorative Arabic type for core UI.

RTL: <html lang="ar" dir="rtl">; use logical CSS properties (margin/padding/inset-inline-*), not unnecessary left/right hardcoding. Correctly isolate LTR content such as URLs, emails, SKUs and technical codes. RTL must be structural, not cosmetic.

LAYOUT/UX PRINCIPLE: brand impact first, shopping clarity second, interaction simplicity always. Never sacrifice navigation, product comprehension, checkout or performance for visual effects. Apparel UX must prioritize visible size selection, coherent color-size dependencies, useful size guidance and strong product imagery. Baymard research across apparel/sportswear sites supports these priorities and reports heavy dependence on navigation/browsing, size filtering and product reviews/fit information. Cite these principles only in internal documentation, not as visible site copy.

PRIMARY RETAIL FLOW:

Visitor → Home → Shop/Category or Search → PLP → Filter/Sort → PDP → Color → visible Size buttons → Size Guide/Finder when useful → Quantity → Add to Cart → immediate confirmation → Cart → Checkout → Customer details → Address → Shipping → Payment/COD → Review → Confirmation → Track Order.

Do not force account creation before purchase. Offer account creation after/around purchase where useful. Keep the path optimized for a customer buying 1–2 pieces.

NAVIGATION: desktop: Logo + Shop + Categories + New + Offers + About + Search + Account + Cart + Wholesale. Keep compact. Mobile: Menu + Search + Cart + Account. Wholesale can be an entry point but never reveal protected wholesale pricing/data publicly.

HOMEPAGE: Announcement → Header → Hero → Featured Categories → New Arrivals → Football/Street campaign → Best Sellers → Value/Offers → Brand/Editorial → Reviews/Social Proof → CTA → Footer. Homepage is a brand experience, not a grid of products. Hero must communicate movement + football + Egyptian street + confidence. No generic “Welcome to TURBO”. Possible copy direction only: “اتحرك. العب. كمل.” Do not overuse slang. Prefer supplied real photography; if unavailable, use clearly replaceable placeholders. Never invent product photography/models.

PRODUCT CARD: image, name, price, sale/discount where applicable, available colors, stock state, wishlist, quick action and limited badges. Desktop may show alternate image/quick add/subtle hover; mobile cannot depend on hover. Do not overcrowd cards.

PLP/CATEGORY: make browsing primary and search secondary; clear taxonomy, strong category discovery, sort + filter controls. Filters: category, size, color, price, availability, new, sale, bestseller. Size filter must clearly group/label options. Never make users decode unexplained numeric/size values. On mobile use a deliberate filter drawer/sheet with visible applied filters and clear reset/apply behavior.

PDP: breadcrumbs → gallery → title → price/sale → availability → color selector → visible size buttons → Size Guide → optional Size Finder → quantity → Add to Cart → optional Buy Now → shipping/returns reassurance → description → fit → material/specs → reviews → related → recently viewed. Size options must be button-like and visibility-first, not hidden in a dropdown. Color and size availability must update coherently. Reviews should surface useful fit/size information when present. Product imagery should include human-model context whenever real assets exist.

SIZE: never hardcode S/M/L/XL globally. Product defines its own sizes, measurements and availability. Store real measurements and size-guide data. The Size Guide is admin-configurable. If a color has different size availability, communicate it immediately. Optional Size Finder must remain simple and non-blocking.

SEARCH: Arabic-first; English where useful; typo/synonym tolerance if supported; useful zero-results state; category/size/color/price/availability aware where technically appropriate.

CART: clear items + image + variant + color + size + quantity + availability + subtotal + discount + shipping + final total. Preserve selected product state. Show useful reassurance without clutter. Provide clear edit/remove actions.

CHECKOUT: simple, short and transparent. Customer info → address → shipping → payment → final review. Clear labels and errors; visible final total; no heavy animation. Payment status must be separate from fulfillment/order status.

PAYMENTS: architect provider-agnostic. Support future Egyptian cards, COD, wallets/payment gateways. Do not lock the architecture to Stripe. Never trust client-side payment confirmation. Store payment state separately from order state.

ORDER MODEL: support retail + wholesale. Store order/customer/items/variants/sizes/prices/discounts/shipping/total/payment/fulfillment/timestamps. Fulfillment: pending, confirmed, processing, shipped, delivered, cancelled. Payment: pending, paid, failed, refunded, cod.

SHIPPING: configurable by admin; support governorates/zones, fees, thresholds, methods, ETA and COD availability. No hardcoded business rules.

WHOLESALE: distinct protected B2B experience. Public user may see “Wholesale / Become a Dealer” entry point only. Retail customers cannot see wholesale prices/catalog/order controls. Flow: Wholesale entry → login/register → wholesale application → business/merchant information → pending status → admin review → approved/rejected → approved wholesale portal. Pending/rejected users remain retail users and cannot access wholesale data. This mirrors established B2B access patterns where authenticated/authorized customers receive B2B-specific products/pricing/order capabilities. Server-side authorization + Supabase RLS are mandatory; frontend hiding alone is insufficient.

WHOLESALE PORTAL: protected catalog → wholesale pricing → MOQ → stock → product/variant/color/size/quantity selection → live total units + pricing → wholesale cart → order submission → order history/status. Support retail price, wholesale price, future tier pricing and MOQ without hardcoding business thresholds. Admin controls all thresholds. Reorder/history architecture should be possible later.

AUTH/ROLES: customer, wholesale_pending, wholesale, admin, super_admin. New signup = customer. Use Supabase Auth. Protect every privileged route and database operation server-side. Never expose service-role keys.

SUPABASE: use connected Supabase for PostgreSQL, Auth, Storage, RLS and server-side functions where appropriate. Use migrations. Inspect existing schema first and avoid duplicate structures. Suggested domains only where needed: profiles/roles, wholesale_applications, products/variants/categories/collections/images/inventory/size_guides, carts/cart_items, orders/order_items/payments/addresses/shipping, coupons/discounts/reviews/wishlist, homepage_sections/banners, notifications, admin/audit logs. Keep business data relational, extensible and data-driven.

ADMIN PANEL: same design system as storefront, not a generic disconnected dashboard. Support Dashboard, Products, Categories, Collections, Inventory, Retail Orders, Wholesale Orders, Customers, Wholesale Merchants, Merchant Approval, Wholesale Pricing, Coupons, Discounts, Banners, Homepage Content, Campaigns, Reviews, Shipping, Payments, Analytics, Notifications, Admins, Roles/Permissions, Settings. All sensitive actions protected by RBAC/RLS. Build the architecture now so the full panel can grow without rebuilding the backend.

CMS: admin controls hero image/copy/CTA, categories, banners, campaigns, product collections, section content, order and visibility. Routine marketing changes must not require source-code edits.

MEDIA: full supplied TURBO SVG and standalone T SVG are authoritative brand assets. Product photography should use supplied/real assets. Never automatically generate products, models, logos, decorative SVGs or branded illustrations. Use replaceable placeholders when assets are missing.

PHOTOGRAPHY: authentic Egyptian streets, football courts, everyday sportswear, real movement, natural light, human context, group/team energy, useful product visibility. Avoid generic fitness stock, luxury-fashion styling and fake/AI-looking product imagery.

MOTION: motion is purposeful brand behavior, not decoration. Use subtle/high-energy transitions only where they communicate TURBO: page/section entrances, product image transitions, campaign transitions, selected states, controlled hover effects. Suggested durations: micro 120-180ms, standard 180-280ms, emphasis 300-500ms; use consistent easing, not random values. No perpetual animation, excessive parallax, heavy 3D, scroll hijacking or checkout animation. Respect prefers-reduced-motion. CSS first; one main animation library only when needed.

INTERACTION LANGUAGE: buttons have clear default/hover/focus/active/disabled/loading states. Orange is the primary action; black is secondary/structural; neutral is informational. Do not create five visually equal CTA types. Use clear visual priority: primary = orange, secondary = black/outline, tertiary = text/icon.

ICONOGRAPHY: one coherent system (Lucide candidate); do not mix random icon libraries or recreate standard icons manually.

ACCESSIBILITY: semantic HTML, keyboard navigation, visible focus, labels, validation/error messaging, adequate contrast, accessible dialogs/drawers, touch-friendly controls, reduced motion, no meaning conveyed by color alone.

PERFORMANCE: responsive images, optimized assets, lazy loading where useful, code splitting, efficient rendering, minimal unnecessary JS, limited third-party dependencies. Visual richness must not block content or shopping.

DATA/HARDCODING: products, categories, prices, stock, discounts, shipping, wholesale rules/prices, banners, campaigns and homepage content come from backend/CMS; never hardcode business data inside UI components.

COMPONENT SYSTEM: reusable Button, IconButton, Input, Select, Modal, Drawer, Badge, Tabs, Accordion, Card, ProductCard, ProductGallery, Price, Rating, QuantitySelector, SizeSelector, ColorSelector, SizeGuide, Filter, FilterDrawer, Navbar, MobileNavbar, Breadcrumbs, Footer, Toast, Skeleton, EmptyState, ErrorState, Pagination. Use variants/tokens, not duplicated one-off implementations.

DESIGN TOKENS: centralize color, spacing, typography, radius, shadow, breakpoint and motion tokens. No arbitrary visual values scattered through the code.

STATES: every important commerce component needs loading, empty, error, disabled, out-of-stock and success states. Product variants must clearly communicate unavailable combinations without breaking the flow.

TRUST UX: make Shipping, Returns/Exchange, Payment, Sizing, Contact and FAQ easy to access. Product pages should reduce fit/shipping uncertainty without overwhelming users.

SECURITY: RLS, server-side authorization, RBAC, secure backend functions, protected admin/wholesale operations, validated input, safe uploads, no client service-role secrets. Never trust price/discount/stock/payment values supplied by the browser.

DEVELOPMENT ORDER:

1 Design tokens + typography + global geometry + brand rules

2 Global shell/header/footer/navigation

3 Homepage

4 PLP/category/search/filter

5 PDP/size/variants

6 Cart

7 Checkout/order model

8 Customer auth/account/order tracking

9 Wholesale auth/application/approval

10 Wholesale portal/order builder

11 Backend/RLS/security hardening

12 Admin/CMS

13 Analytics/operations

14 responsive/accessibility/performance/QA

IMPLEMENTATION RULE: first inspect and explain existing architecture internally, then implement systematically. Do not invent unspecified brand rules. When business logic is unspecified, make it configurable rather than guessing. When a design decision is unspecified, stay inside the established STREET MATCH system instead of introducing a new visual language.

NON-NEGOTIABLES:

preserve logo concept; preserve locked logo colors; use both supplied SVG assets; Arabic-first RTL; Football 50% + Egyptian Street 50%; Everyday Life; consistent orange/black/neutral system; systematic grid/spacing/type/shape/motion; research-backed apparel UX; simple retail checkout; protected wholesale access; server-side authorization/RLS; data-driven commerce; future-ready Admin; no automatic image/SVG generation; no automotive/racing aesthetics; no generic template look; no unnecessary dependencies; no arbitrary visual inventions.

FINAL GOAL: TURBO must look and behave like a real Egyptian mass-market sportswear brand, not a template store: distinctive football/street identity, strong mobile-first commerce UX, trustworthy product/size experience, protected wholesale system and scalable technical foundation.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://turbo-street-match.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2bd82060-338d-4c72-a307-cc46f95bfa5c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

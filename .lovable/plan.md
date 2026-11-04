# Cut repeated data requests (no visual changes)

## What's wrong now
- Every page re-requests its data when you come back to it, because the app treats all data as instantly outdated.
- Categories are fetched twice under different names (homepage vs shop).
- Two separate wishlist systems each fetch the wishlist.
- Product page asks for the signed-in user separately just to read favorite size.
- Hovering links doesn't prepare the next page's data.

## What changes
1. **Global sensible defaults**: data stays fresh 60s, kept in memory 10 min, no refetch on window focus, one retry.
2. **Per-data freshness**
   - Categories, homepage sections, shipping zones, size guides: 20 min
   - Catalog list and product details: 3 min
   - Search: 2 min
   - Wishlist, profile, favorite size, wholesale access: 1 min, keyed by user so accounts never share cache
   - Orders/account and admin screens: 15–30s (stay accurate)
   - Checkout: prices/stock still verified server-side when placing the order (unchanged).
3. **Shared query definitions** in one file so homepage, shop, and product page reuse the same cache (one categories request instead of two).
4. **Instant product page from the list**: opening a product seeds its data from the already-loaded catalog, then refreshes quietly in the background.
5. **Prefetch on hover/touch** for shop links and product cards (router intent preload).
6. **Merge the two wishlist hooks** into one shared query.
7. **Clear user-specific cache on sign-out** so the next person doesn't see the previous account's data.

## Not doing
- No persistent browser storage of cache (catalog changes rarely matter less than stale prices risk).
- No new libraries, no UI/database changes.

## Technical details
- `src/router.tsx`: QueryClient defaultOptions + `defaultPreload: "intent"`.
- New `src/lib/queries.ts` with `queryOptions` factories (categories, catalog, product(slug), shippingZones, homepageSections, preferredSize(userId), wishlist(userId)).
- `products/$slug.tsx`: `initialData` from `["catalog-products"]` cache + loader `ensureQueryData`.
- `__root.tsx` auth listener: on SIGNED_OUT `queryClient.removeQueries` for user keys.
- Verify with Playwright: count network requests on shop → product → back to shop (expect zero repeat catalog fetch).

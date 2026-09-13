# Redesign the Shop page

## Result
- Redesign only `/shop` as a restrained TURBO football/streetwear storefront.
- Keep all existing product data, wishlist behavior, drawer, buttons, routes, and application architecture.
- Preserve current product assets and avoid new packages or generated media.

## Implementation
- Replace the current Arabic catalog introduction with the specified `TURBO STORE`, `SHOP`, and description hierarchy.
- Add prominent, horizontally scrollable category navigation for All, Football, Training, and Streetwear, mapped to available category data without changing the backend.
- Replace the permanent desktop sidebar with a lightweight filter drawer and a minimal sort control in the toolbar.
- Refine the Shop product grid to four columns on desktop, three on tablet where space permits, and two on mobile.
- Add a Shop-specific compact product-card presentation showing only image, name, price, and subtle wishlist control while retaining alternate-image hover on pointer devices.
- Keep the shared ProductCard behavior unchanged on other pages by exposing an optional Shop presentation mode.

## Verification
- Check the Shop page at desktop and mobile widths for hierarchy, overflow, drawer/sort behavior, and two-column mobile layout.
- Verify filters, category navigation, sorting, product links, and wishlist interactions.
- Check TypeScript/imports, accessibility labels, route integrity, and browser console errors.

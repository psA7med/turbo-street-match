The proposed optimization plan is approved in principle, but update the implementation plan with these additional technical requirements before proceeding.

**1. Fix the staleTime / gcTime relationship**

- Ensure gcTime is never shorter than the intended staleTime for each query.
- In particular, categories and other 20-minute queries must not be garbage-collected after only 10 minutes of inactivity.
- Define appropriate per-query gcTime values.

**2. Coordinate TanStack Router and TanStack Query**

- Configure `defaultPreload: "intent"`.
- Set `defaultPreloadStaleTime: 0` because TanStack Query must be the single source of truth for server-data caching.
- Ensure route preloading and navigation reuse the same query keys and in-flight requests.

**3. Correct product initial-data behavior**

- Use existing catalog data to display product information immediately.
- Do not treat incomplete catalog data as complete product details.
- Correctly implement `initialDataUpdatedAt` when using initialData.
- Use placeholderData where appropriate for incomplete product summaries.
- Ensure full product details are fetched or quietly refreshed in the background without unnecessary blocking.

**4. Strengthen account isolation**

- Include userId in every user-specific query key.
- Clear previous-user cached data on SIGNED_OUT.
- Handle account switching safely.
- Ensure protected API endpoints independently validate authentication and authorization. Client-side cache isolation is not a security boundary.

**5. Preserve freshness for sensitive screens**

- Orders and admin data should refresh appropriately when returning to an inactive tab.
- Override the global `refetchOnWindowFocus: false` for queries that require this behavior.

**6. Expand Playwright verification**

Test these scenarios:

A. Shop → Product → Back to Shop:

- No duplicate catalog API request within the configured freshness window.
- Product information appears immediately.
- Full details are eventually loaded correctly.

B. Revisit after cache expiration:

- Verify that stale data is refreshed correctly.

C. Navigate between Homepage and Shop:

- Categories should be fetched only once while cached.

D. Wishlist and account isolation:

- Sign out and switch users.
- Verify that no previous user's private data is displayed.

E. Checkout:

- Confirm that product prices, stock availability, and totals are always verified server-side when placing an order.

Do not introduce new dependencies, alter the UI, change database schemas, or modify existing business logic.

Before implementation, inspect the actual codebase and adapt the plan to the existing architecture. Do not assume the current hooks, routes, or query keys work exactly as described.

After implementation, report the changed files, explain the caching strategy, and provide actual Playwright test results.

The objective is fewer redundant API requests without compromising data accuracy, account isolation, or checkout security.
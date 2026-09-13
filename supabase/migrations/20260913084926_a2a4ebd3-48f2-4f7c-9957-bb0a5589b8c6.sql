create extension if not exists pgcrypto;

create type public.app_role as enum ('customer','wholesale_pending','wholesale','admin','super_admin');
create type public.publication_status as enum ('draft','published','archived');
create type public.application_status as enum ('pending','approved','rejected');
create type public.order_kind as enum ('retail','wholesale');
create type public.order_status as enum ('pending','confirmed','processing','shipped','delivered','cancelled');
create type public.payment_status as enum ('pending','paid','failed','refunded','cod');
create type public.review_status as enum ('pending','published','rejected');

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;

create table public.profiles (
  id uuid primary key,
  full_name text,
  phone text,
  avatar_url text,
  preferred_size text,
  locale text not null default 'ar-EG',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_own_read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_own_insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles_own_update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "roles_own_read" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
revoke all on function public.has_role(uuid, public.app_role) from public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id, 'admin') or public.has_role(_user_id, 'super_admin')
$$;
revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated, service_role;

create policy "admins_read_profiles" on public.profiles for select to authenticated using (public.is_admin(auth.uid()));
create policy "admins_manage_roles" on public.user_roles for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table public.wholesale_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  business_name text not null,
  contact_name text not null,
  phone text not null,
  governorate text not null,
  address text not null,
  tax_registration text,
  business_type text,
  notes text,
  status public.application_status not null default 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);
grant select, insert, update on public.wholesale_applications to authenticated;
grant all on public.wholesale_applications to service_role;
alter table public.wholesale_applications enable row level security;
create policy "applications_own_read" on public.wholesale_applications for select to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "applications_own_create" on public.wholesale_applications for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "applications_admin_update" on public.wholesale_applications for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create trigger wholesale_applications_updated_at before update on public.wholesale_applications for each row execute function public.set_updated_at();

create or replace function public.is_approved_wholesale(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id, 'wholesale') and exists(select 1 from public.wholesale_applications where user_id = _user_id and status = 'approved')
$$;
revoke all on function public.is_approved_wholesale(uuid) from public;
grant execute on function public.is_approved_wholesale(uuid) to authenticated, service_role;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  slug text not null unique,
  name_ar text not null,
  name_en text,
  description_ar text,
  image_url text,
  status public.publication_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories_public_read" on public.categories for select to anon, authenticated using (status = 'published' or public.is_admin(auth.uid()));
create policy "categories_admin_manage" on public.categories for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create trigger categories_updated_at before update on public.categories for each row execute function public.set_updated_at();

create table public.size_guides (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  category_id uuid references public.categories(id) on delete set null,
  measurements jsonb not null default '[]'::jsonb,
  instructions_ar text,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.size_guides to anon, authenticated;
grant insert, update, delete on public.size_guides to authenticated;
grant all on public.size_guides to service_role;
alter table public.size_guides enable row level security;
create policy "size_guides_public_read" on public.size_guides for select to anon, authenticated using (status = 'published' or public.is_admin(auth.uid()));
create policy "size_guides_admin_manage" on public.size_guides for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create trigger size_guides_updated_at before update on public.size_guides for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  size_guide_id uuid references public.size_guides(id) on delete set null,
  slug text not null unique,
  name_ar text not null,
  name_en text,
  description_ar text,
  fit_ar text,
  materials_ar text,
  status public.publication_status not null default 'draft',
  is_new boolean not null default false,
  is_bestseller boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products_public_read" on public.products for select to anon, authenticated using (status = 'published' or public.is_admin(auth.uid()));
create policy "products_admin_manage" on public.products for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create index products_category_idx on public.products(category_id);
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  color_name_ar text not null,
  color_value text,
  size_label text not null,
  retail_price numeric(12,2) not null check (retail_price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= retail_price),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.product_variants to anon, authenticated;
grant insert, update, delete on public.product_variants to authenticated;
grant all on public.product_variants to service_role;
alter table public.product_variants enable row level security;
create policy "variants_public_read" on public.product_variants for select to anon, authenticated using (active and exists(select 1 from public.products p where p.id = product_id and p.status = 'published') or public.is_admin(auth.uid()));
create policy "variants_admin_manage" on public.product_variants for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create index variants_product_idx on public.product_variants(product_id);
create trigger variants_updated_at before update on public.product_variants for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  url text not null,
  alt_ar text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.product_images to anon, authenticated;
grant insert, update, delete on public.product_images to authenticated;
grant all on public.product_images to service_role;
alter table public.product_images enable row level security;
create policy "images_public_read" on public.product_images for select to anon, authenticated using (exists(select 1 from public.products p where p.id = product_id and p.status = 'published') or public.is_admin(auth.uid()));
create policy "images_admin_manage" on public.product_images for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create index product_images_product_idx on public.product_images(product_id, sort_order);

create table public.inventory (
  variant_id uuid primary key references public.product_variants(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0 and reserved_quantity <= quantity),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.inventory to authenticated;
grant all on public.inventory to service_role;
alter table public.inventory enable row level security;
create policy "inventory_admin_manage" on public.inventory for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create trigger inventory_updated_at before update on public.inventory for each row execute function public.set_updated_at();

create table public.wholesale_prices (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  tier text not null default 'standard',
  unit_price numeric(12,2) not null check (unit_price >= 0),
  minimum_quantity integer not null default 1 check (minimum_quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(variant_id, tier)
);
grant select on public.wholesale_prices to authenticated;
grant insert, update, delete on public.wholesale_prices to authenticated;
grant all on public.wholesale_prices to service_role;
alter table public.wholesale_prices enable row level security;
create policy "wholesale_prices_approved_read" on public.wholesale_prices for select to authenticated using (public.is_approved_wholesale(auth.uid()) or public.is_admin(auth.uid()));
create policy "wholesale_prices_admin_manage" on public.wholesale_prices for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create trigger wholesale_prices_updated_at before update on public.wholesale_prices for each row execute function public.set_updated_at();

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  label text,
  recipient_name text not null,
  phone text not null,
  governorate text not null,
  city text not null,
  street_address text not null,
  building_details text,
  landmark text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.addresses to authenticated;
grant all on public.addresses to service_role;
alter table public.addresses enable row level security;
create policy "addresses_own_manage" on public.addresses for all to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid())) with check (user_id = auth.uid() or public.is_admin(auth.uid()));
create index addresses_user_idx on public.addresses(user_id);
create trigger addresses_updated_at before update on public.addresses for each row execute function public.set_updated_at();

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  guest_token uuid,
  currency text not null default 'EGP',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or guest_token is not null)
);
grant select, insert, update, delete on public.carts to authenticated;
grant all on public.carts to service_role;
alter table public.carts enable row level security;
create policy "carts_own_manage" on public.carts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create index carts_user_idx on public.carts(user_id);
create trigger carts_updated_at before update on public.carts for each row execute function public.set_updated_at();

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cart_id, variant_id)
);
grant select, insert, update, delete on public.cart_items to authenticated;
grant all on public.cart_items to service_role;
alter table public.cart_items enable row level security;
create policy "cart_items_own_manage" on public.cart_items for all to authenticated using (exists(select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())) with check (exists(select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
create index cart_items_cart_idx on public.cart_items(cart_id);
create trigger cart_items_updated_at before update on public.cart_items for each row execute function public.set_updated_at();

create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  governorates text[] not null default '{}',
  fee numeric(12,2) not null default 0 check (fee >= 0),
  free_shipping_threshold numeric(12,2),
  eta_min_days integer not null default 1,
  eta_max_days integer not null default 5,
  cod_available boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.shipping_zones to anon, authenticated;
grant insert, update, delete on public.shipping_zones to authenticated;
grant all on public.shipping_zones to service_role;
alter table public.shipping_zones enable row level security;
create policy "shipping_zones_public_read" on public.shipping_zones for select to anon, authenticated using (active or public.is_admin(auth.uid()));
create policy "shipping_zones_admin_manage" on public.shipping_zones for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create trigger shipping_zones_updated_at before update on public.shipping_zones for each row execute function public.set_updated_at();

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid,
  guest_email text,
  guest_phone text,
  kind public.order_kind not null default 'retail',
  fulfillment_status public.order_status not null default 'pending',
  currency text not null default 'EGP',
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount_total numeric(12,2) not null default 0 check (discount_total >= 0),
  shipping_total numeric(12,2) not null default 0 check (shipping_total >= 0),
  grand_total numeric(12,2) not null check (grand_total >= 0),
  shipping_address jsonb not null,
  customer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or (guest_email is not null and guest_phone is not null))
);
grant select on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders_own_read" on public.orders for select to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "orders_admin_manage" on public.orders for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create index orders_user_status_idx on public.orders(user_id, fulfillment_status, created_at desc);
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name_ar text not null,
  sku text not null,
  color_name_ar text not null,
  size_label text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "order_items_own_read" on public.order_items for select to authenticated using (exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin(auth.uid()))));
create index order_items_order_idx on public.order_items(order_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  provider_reference text,
  status public.payment_status not null default 'pending',
  amount numeric(12,2) not null check (amount >= 0),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "payments_own_read" on public.payments for select to authenticated using (exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin(auth.uid()))));
create policy "payments_admin_manage" on public.payments for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create index payments_order_idx on public.payments(order_id);
create trigger payments_updated_at before update on public.payments for each row execute function public.set_updated_at();

create table public.fulfillments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  carrier text,
  tracking_number text,
  status public.order_status not null default 'pending',
  estimated_delivery_date date,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.fulfillments to authenticated;
grant all on public.fulfillments to service_role;
alter table public.fulfillments enable row level security;
create policy "fulfillments_own_read" on public.fulfillments for select to authenticated using (exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin(auth.uid()))));
create policy "fulfillments_admin_manage" on public.fulfillments for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create trigger fulfillments_updated_at before update on public.fulfillments for each row execute function public.set_updated_at();

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  fit_feedback text,
  status public.review_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, user_id)
);
grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "reviews_public_read" on public.reviews for select to anon, authenticated using (status = 'published' or user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "reviews_own_create" on public.reviews for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "reviews_own_update" on public.reviews for update to authenticated using ((user_id = auth.uid() and status = 'pending') or public.is_admin(auth.uid())) with check ((user_id = auth.uid() and status = 'pending') or public.is_admin(auth.uid()));
create index reviews_product_status_idx on public.reviews(product_id, status);
create trigger reviews_updated_at before update on public.reviews for each row execute function public.set_updated_at();

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);
grant select, insert, delete on public.wishlist_items to authenticated;
grant all on public.wishlist_items to service_role;
alter table public.wishlist_items enable row level security;
create policy "wishlist_own_manage" on public.wishlist_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  title_ar text,
  eyebrow_ar text,
  body_ar text,
  cta_label_ar text,
  cta_url text,
  image_url text,
  content jsonb not null default '{}'::jsonb,
  status public.publication_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.homepage_sections to anon, authenticated;
grant insert, update, delete on public.homepage_sections to authenticated;
grant all on public.homepage_sections to service_role;
alter table public.homepage_sections enable row level security;
create policy "homepage_public_read" on public.homepage_sections for select to anon, authenticated using (status = 'published' or public.is_admin(auth.uid()));
create policy "homepage_admin_manage" on public.homepage_sections for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create trigger homepage_sections_updated_at before update on public.homepage_sections for each row execute function public.set_updated_at();
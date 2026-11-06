import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Freshness tiers. gcTime is always >= staleTime so cached data outlives its freshness window. */
const MIN = 60_000;
export const TIER = {
  static: { staleTime: 20 * MIN, gcTime: 40 * MIN },
  catalog: { staleTime: 3 * MIN, gcTime: 15 * MIN },
  user: { staleTime: 1 * MIN, gcTime: 10 * MIN },
} as const;

/** Query key prefixes that hold one user's private data — removed on sign-out / account switch. */
export const USER_KEYS = ["wishlist", "preferred-size", "my-profile", "my-avatar", "my-addresses", "my-orders", "my-wholesale", "wholesale-access", "wholesale-application"] as const;

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    ...TIER.static,
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id,slug,name_ar,name_en,description_ar,image_url").eq("status", "published").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

export const homepageSectionsQuery = () =>
  queryOptions({
    queryKey: ["homepage-sections"],
    ...TIER.static,
    queryFn: async () => {
      const { data, error } = await supabase.from("homepage_sections").select("section_key,eyebrow_ar,title_ar,body_ar,image_url,cta_label_ar,cta_url,content").eq("status", "published").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

export const shippingZonesQuery = () =>
  queryOptions({
    queryKey: ["shipping-zones"],
    ...TIER.static,
    queryFn: async () => {
      const { data, error } = await supabase.from("shipping_zones").select("id,name_ar,governorates,fee,eta_min_days,eta_max_days,cod_available").eq("active", true).order("fee");
      if (error) throw error;
      return data ?? [];
    },
  });

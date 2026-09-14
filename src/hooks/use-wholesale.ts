import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const WHOLESALE_MIN_QUANTITY = 7;

export type WholesaleTier = { variant_id: string; unit_price: number; minimum_quantity: number };
export type WholesaleStatus = "pending" | "approved" | "rejected" | null;

/**
 * حالة تاجر الجملة للحساب الحالي + أسعار الجملة المتاحة له.
 * الأسعار محمية على مستوى قاعدة البيانات، والسعر النهائي بيتحسب على السيرفر وقت الطلب.
 */
export function useWholesale() {
  const { data, isLoading } = useQuery({
    queryKey: ["wholesale-access"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return { approved: false, status: null as WholesaleStatus, tiers: [] as WholesaleTier[] };
      const [{ data: roles }, { data: application }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", auth.user.id),
        supabase.from("wholesale_applications").select("status").eq("user_id", auth.user.id).maybeSingle(),
      ]);
      const names = (roles ?? []).map((row) => row.role);
      const approved = names.includes("wholesale");
      const tiers = approved
        ? (await supabase.from("wholesale_prices").select("variant_id,unit_price,minimum_quantity")).data ?? []
        : [];
      const status: WholesaleStatus = approved ? "approved" : (application?.status as WholesaleStatus) ?? null;
      return { approved, status, tiers: tiers as WholesaleTier[] };
    },
  });

  const approved = data?.approved ?? false;
  const tiers = data?.tiers ?? [];

  const price = (variantId: string, quantity: number, retailPrice: number) => {
    if (!approved) return retailPrice;
    const match = tiers
      .filter((tier) => tier.variant_id === variantId && tier.minimum_quantity <= quantity)
      .sort((a, b) => b.minimum_quantity - a.minimum_quantity || Number(a.unit_price) - Number(b.unit_price))[0];
    return match ? Number(match.unit_price) : retailPrice;
  };

  return { approved, status: data?.status ?? null, isLoading, price, minQuantity: WHOLESALE_MIN_QUANTITY };
}

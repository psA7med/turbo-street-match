import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getLocal } from "@/lib/wishlist";
import { TIER } from "@/lib/queries";
import { useSessionUserId } from "@/hooks/use-session-user";

/** One shared wishlist query keyed by user — all mounted instances share a single request. */
export function useWishlist() {
  const userId = useSessionUserId();
  const queryClient = useQueryClient();
  const [localIds, setLocalIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setLocalIds(getLocal());
    const changed = () => { sync(); void queryClient.invalidateQueries({ queryKey: ["wishlist"] }); };
    sync();
    window.addEventListener("turbo-wishlist", changed);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("turbo-wishlist", changed);
      window.removeEventListener("storage", sync);
    };
  }, [queryClient]);

  const { data: dbIds = [] } = useQuery({
    queryKey: ["wishlist", userId],
    enabled: Boolean(userId),
    ...TIER.user,
    queryFn: async () => {
      const { data, error } = await supabase.from("wishlist_items").select("product_id").eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((item) => item.product_id);
    },
  });

  const ids = new Set([...localIds, ...(userId ? dbIds : [])]);
  return { ids: Array.from(ids), has: (id: string) => ids.has(id), count: ids.size };
}

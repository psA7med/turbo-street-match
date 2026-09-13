import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getLocal } from "@/lib/wishlist";

export function useWishlist() {
  const queryClient = useQueryClient();
  const [localIds, setLocalIds] = useState<string[]>(getLocal());

  useEffect(() => {
    const sync = () => setLocalIds(getLocal());
    window.addEventListener("turbo-wishlist", sync);
    window.addEventListener("storage", sync);
    const { data: listener } = supabase.auth.onAuthStateChange(() => queryClient.invalidateQueries({ queryKey: ["wishlist"] }));
    return () => {
      window.removeEventListener("turbo-wishlist", sync);
      window.removeEventListener("storage", sync);
      listener.subscription.unsubscribe();
    };
  }, [queryClient]);

  const { data: dbIds = [] } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from("wishlist_items").select("product_id");
      return (data ?? []).map(item => item.product_id);
    }
  });

  const ids = new Set([...localIds, ...dbIds]);
  return {
    ids: Array.from(ids),
    has: (id: string) => ids.has(id),
    count: ids.size
  };
}

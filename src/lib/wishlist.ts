import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const LOCAL_KEY = "turbo-wishlist-v1";

function getLocal(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]") as string[]; } catch { return []; }
}

function setLocal(ids: string[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("turbo-wishlist"));
}

export function useWishlist() {
  const queryClient = useQueryClient();
  const [localIds, setLocalIds] = useState<string[]>([]);
  const [changingId, setChangingId] = useState<string | null>(null);
  useEffect(() => {
    const sync = () => setLocalIds(getLocal());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("turbo-wishlist", sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("turbo-wishlist", sync); };
  }, []);
  const { data = { userId: null as string | null, productIds: [] as string[] } } = useQuery({
    queryKey: ["my-wishlist"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return { userId: null, productIds: [] };
      const guestProductIds = getLocal();
      if (guestProductIds.length) {
        const { error: mergeError } = await supabase.from("wishlist_items").upsert(guestProductIds.map((productId) => ({ user_id: auth.user.id, product_id: productId })), { onConflict: "user_id,product_id", ignoreDuplicates: true });
        if (!mergeError) setLocal([]);
      }
      const { data: rows, error } = await supabase.from("wishlist_items").select("product_id").eq("user_id", auth.user.id);
      if (error) throw error;
      return { userId: auth.user.id, productIds: (rows ?? []).map((row) => row.product_id) };
    },
  });
  const productIds = data.userId ? data.productIds : localIds;
  const toggle = async (productId: string) => {
    const active = productIds.includes(productId);
    if (!data.userId) { setLocal(active ? localIds.filter((id) => id !== productId) : [...localIds, productId]); return !active; }
    setChangingId(productId);
    const response = active ? await supabase.from("wishlist_items").delete().eq("user_id", data.userId).eq("product_id", productId) : await supabase.from("wishlist_items").insert({ user_id: data.userId, product_id: productId });
    setChangingId(null);
    if (response.error) throw response.error;
    await queryClient.invalidateQueries({ queryKey: ["my-wishlist"] });
    return !active;
  };
  return { productIds, toggle, changingId };
}

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const guestKey = "turbo-wishlist-v1";

function readGuestWishlist() {
  if (typeof window === "undefined") return [] as string[];
  try {
    return JSON.parse(window.localStorage.getItem(guestKey) ?? "[]") as string[];
  } catch {
    return [] as string[];
  }
}

function writeGuestWishlist(productIds: string[]) {
  window.localStorage.setItem(guestKey, JSON.stringify(productIds));
  window.dispatchEvent(new Event("turbo-wishlist"));
}

export function useWishlist() {
  const queryClient = useQueryClient();
  const [guestIds, setGuestIds] = useState<string[]>([]);
  const [changingId, setChangingId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setGuestIds(readGuestWishlist());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("turbo-wishlist", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("turbo-wishlist", sync);
    };
  }, []);

  const { data = { userId: null as string | null, productIds: [] as string[] } } = useQuery({
    queryKey: ["my-wishlist"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return { userId: null, productIds: [] };
      const { data: rows, error } = await supabase.from("wishlist_items").select("product_id").eq("user_id", auth.user.id);
      if (error) throw error;
      return { userId: auth.user.id, productIds: (rows ?? []).map((row) => row.product_id) };
    },
  });

  const productIds = data.userId ? data.productIds : guestIds;

  const toggle = async (productId: string) => {
    const active = productIds.includes(productId);
    if (!data.userId) {
      writeGuestWishlist(active ? guestIds.filter((id) => id !== productId) : [...guestIds, productId]);
      return !active;
    }

    setChangingId(productId);
    const response = active
      ? await supabase.from("wishlist_items").delete().eq("user_id", data.userId).eq("product_id", productId)
      : await supabase.from("wishlist_items").insert({ user_id: data.userId, product_id: productId });
    setChangingId(null);
    if (response.error) throw response.error;
    await queryClient.invalidateQueries({ queryKey: ["my-wishlist"] });
    return !active;
  };

  return { productIds, toggle, changingId };
}
import { supabase } from "@/integrations/supabase/client";

const LOCAL_KEY = "turbo-wishlist-v1";

function getLocal(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]"); } catch { return []; }
}

function setLocal(ids: string[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("turbo-wishlist"));
}

export async function toggleWishlist(productId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    const ids = getLocal();
    const next = ids.includes(productId) ? ids.filter(id => id !== productId) : [...ids, productId];
    setLocal(next);
    return;
  }

  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase.from("wishlist_items").delete().eq("id", existing.id);
  } else {
    await supabase.from("wishlist_items").insert({ user_id: user.id, product_id: productId });
  }
  window.dispatchEvent(new Event("turbo-wishlist"));
}

export { getLocal };

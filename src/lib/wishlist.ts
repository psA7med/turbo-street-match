import { supabase } from "@/integrations/supabase/client";

const LOCAL_KEY = "turbo-wishlist-v1";

export function getLocal(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]") as string[]; } catch { return []; }
}

function setLocal(ids: string[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("turbo-wishlist"));
}

export async function toggleWishlist(productId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const ids = getLocal();
    setLocal(ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId]);
    return;
  }
  const { data: existing, error: readError } = await supabase.from("wishlist_items").select("id").eq("user_id", user.id).eq("product_id", productId).maybeSingle();
  if (readError) throw readError;
  const response = existing ? await supabase.from("wishlist_items").delete().eq("id", existing.id) : await supabase.from("wishlist_items").insert({ user_id: user.id, product_id: productId });
  if (response.error) throw response.error;
  window.dispatchEvent(new Event("turbo-wishlist"));
}


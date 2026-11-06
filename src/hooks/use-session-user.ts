import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Current signed-in user id from the local session (no network round-trip). */
export function useSessionUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => { if (alive) setUserId(data.session?.user.id ?? null); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUserId(session?.user.id ?? null));
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);
  return userId;
}

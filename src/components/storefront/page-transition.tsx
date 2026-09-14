import { useEffect, useState } from "react";
import mark from "@/assets/turbo-mark.svg.asset.json";

// انتقال TURBO مخصص للعمليات اللي بتاخد وقت (تأكيد الطلب، إلغاء الطلب…)
// ومش بيشتغل على التنقل العادي بين الصفحات.

const FADE_OUT = 220;
const MIN_VISIBLE = 420;

type State = "idle" | "enter" | "exit";
const listeners = new Set<(state: State) => void>();
let current: State = "idle";
let shownAt = 0;
let exitTimer: number | undefined;

function set(state: State) {
  current = state;
  listeners.forEach((listener) => listener(state));
}

/** يفتح الشاشة الانتقالية ويرجّع دالة لإغلاقها. */
export function startTurboOverlay() {
  if (exitTimer !== undefined) {
    window.clearTimeout(exitTimer);
    exitTimer = undefined;
  }
  if (current !== "enter") {
    shownAt = Date.now();
    set("enter");
  }
  let closed = false;
  return () => {
    if (closed) return;
    closed = true;
    const wait = Math.max(0, MIN_VISIBLE - (Date.now() - shownAt));
    window.setTimeout(() => {
      set("exit");
      exitTimer = window.setTimeout(() => {
        exitTimer = undefined;
        set("idle");
      }, FADE_OUT);
    }, wait);
  };
}

/** يشغّل عملية طويلة والشاشة الانتقالية ظاهرة طول مدتها. */
export async function withTurboOverlay<T>(action: () => Promise<T>): Promise<T> {
  const stop = startTurboOverlay();
  try {
    return await action();
  } finally {
    stop();
  }
}

export function PageTransition() {
  const [state, setState] = useState<State>(current);

  useEffect(() => {
    listeners.add(setState);
    setState(current);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  useEffect(() => {
    if (state === "idle") document.documentElement.removeAttribute("data-turbo-transition");
    else document.documentElement.setAttribute("data-turbo-transition", state);
  }, [state]);

  if (state === "idle") return null;

  return (
    <div
      className="turbo-page-transition"
      data-state={state}
      role="status"
      aria-live="polite"
      aria-label="جاري التنفيذ"
      data-testid="turbo-page-transition"
    >
      <img className="turbo-page-transition-mark" src={mark.url} alt="" />
    </div>
  );
}


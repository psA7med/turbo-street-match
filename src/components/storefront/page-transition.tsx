import { useEffect, useState } from "react";
import mark from "@/assets/turbo-mark.svg.asset.json";
import navLogo from "@/assets/turbo-logo.svg.asset.json";

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

// ---------- انتقال سريع للقائمة العلوية: الشعار يدخل من الشمال ويخرج لليمين ----------

type NavState = "idle" | "enter" | "exit";
const navListeners = new Set<(state: NavState) => void>();
let navCurrent: NavState = "idle";
let navTimers: number[] = [];
let navRunning = false;

function setNav(state: NavState) {
  navCurrent = state;
  navListeners.forEach((listener) => listener(state));
}

/** يشغّل انتقال TURBO السريع عند الضغط على روابط القائمة العلوية. */
export function startNavTransition(navigate: () => void) {
  if (navRunning) return;
  navRunning = true;
  navTimers.forEach((id) => window.clearTimeout(id));
  navTimers = [];

  setNav("enter");

  // ننقل المستخدم فورًا عشان الأنيميشن يكمل فوق الصفحة الجديدة
  const go = window.setTimeout(() => {
    navigate();
  }, 80);

  const exit = window.setTimeout(() => {
    setNav("exit");
  }, 360);

  // نرجع للحالة الطبيعية بعد ما الانتقال يخلص
  const idle = window.setTimeout(() => {
    setNav("idle");
    navRunning = false;
    navTimers = [];
  }, 700);

  navTimers = [go, exit, idle];
}


export function NavTransition() {
  const [state, setState] = useState<NavState>(navCurrent);

  useEffect(() => {
    navListeners.add(setState);
    setState(navCurrent);
    return () => {
      navListeners.delete(setState);
    };
  }, []);

  return (
    <div
      className="turbo-nav-transition"
      data-state={state}
      aria-hidden={state === "idle"}
      role="status"
      aria-live="polite"
      aria-label="جاري التنقل"
      data-testid="turbo-nav-transition"
    >
      <img className="turbo-nav-transition-logo" src={navLogo.url} alt="TURBO" />
    </div>
  );
}

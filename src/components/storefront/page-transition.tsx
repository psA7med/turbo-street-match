import { useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import mark from "@/assets/turbo-mark.svg.asset.json";

const STANDARD_DURATION = 520;
const REDUCED_DURATION = 140;

function isStorefrontPath(pathname: string) {
  return pathname !== "/admin" && !pathname.startsWith("/admin/");
}

export function PageTransition() {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);
  const timeoutRef = useRef<number | undefined>(undefined);
  const lastPathRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    lastPathRef.current = window.location.pathname;

    const finish = () => {
      activeRef.current = false;
      setActive(false);
      document.documentElement.removeAttribute("data-turbo-transition");
    };

    const start = (fromPath: string | undefined, toPath: string) => {
      if (
        !fromPath ||
        fromPath === toPath ||
        !isStorefrontPath(fromPath) ||
        !isStorefrontPath(toPath) ||
        activeRef.current
      ) {
        return;
      }

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      activeRef.current = true;
      setActive(true);
      document.documentElement.setAttribute("data-turbo-transition", reducedMotion ? "reduced" : "active");
      timeoutRef.current = window.setTimeout(finish, reducedMotion ? REDUCED_DURATION : STANDARD_DURATION);
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      const anchor = target instanceof Element ? target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target || anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      start(window.location.pathname, destination.pathname);
    };

    const unsubscribe = router.subscribe("onBeforeNavigate", (event) => {
      const fromPath = event.fromLocation?.pathname ?? lastPathRef.current;
      const toPath = event.toLocation.pathname;
      lastPathRef.current = toPath;
      if (event.pathChanged) start(fromPath, toPath);
    });
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      unsubscribe();
      document.removeEventListener("click", handleDocumentClick, true);
      if (timeoutRef.current !== undefined) window.clearTimeout(timeoutRef.current);
      document.documentElement.removeAttribute("data-turbo-transition");
    };
  }, [router]);

  if (!active) return null;

  return (
    <div className="turbo-page-transition" aria-hidden="true" data-testid="turbo-page-transition">
      <img className="turbo-page-transition-mark" src={mark.url} alt="" />
    </div>
  );
}
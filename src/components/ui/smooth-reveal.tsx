import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

const revealSelector = [
  "main > div",
  "main > section",
  "main section .turbo-container > header",
  "main section .turbo-container > article",
  "main section .turbo-container > div",
  "main article",
  "main form",
  "main aside",
  "main [data-reveal]",
].join(",");

export function SmoothReveal() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observed = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("motion-reveal-visible");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -7%", threshold: 0.08 },
    );

    const register = (root: ParentNode = document) => {
      const elements = root.querySelectorAll(revealSelector);
      elements.forEach((element, index) => {
        if (observed.has(element) || element.closest("[data-motion-skip]")) return;
        observed.add(element);
        element.classList.add("motion-reveal");
        if (index % 4) element.setAttribute("data-motion-step", String(index % 4));
        observer.observe(element);
      });
    };

    // Nested route content hydrates after the root effect. Waiting briefly keeps
    // motion attributes from changing server-rendered markup during hydration.
    const timer = window.setTimeout(() => register(), 450);
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement) register(node.parentElement ?? node);
        }
      }
    });
    const main = document.querySelector("main");
    if (main) mutations.observe(main, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(timer);
      mutations.disconnect();
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SpotlightProps = {
  children: ReactNode;
  className?: string;
};

export function Spotlight({ children, className }: SpotlightProps) {
  const x = useMotionValue(50);
  const y = useMotionValue(50);
  const background = useMotionTemplate`radial-gradient(28rem circle at ${x}px ${y}px, var(--spotlight), transparent 68%)`;

  function follow(event: MouseEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - bounds.left);
    y.set(event.clientY - bounds.top);
  }

  return (
    <section className={cn("spotlight-shell", className)} onMouseMove={follow}>
      <motion.div aria-hidden className="spotlight-glow" style={{ background }} />
      <div className="relative z-10">{children}</div>
    </section>
  );
}
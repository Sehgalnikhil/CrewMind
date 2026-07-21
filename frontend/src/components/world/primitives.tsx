import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";

/* ---------------------------------------------------------------- */
/* Scroll-reveal wrapper with cinematic rise + depth                  */
/* ---------------------------------------------------------------- */
export function Reveal({
  children,
  delay = 0,
  y = 48,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, scale: 0.97, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------------------- */
/* Section chrome: eyebrow + headline + sub                          */
/* ---------------------------------------------------------------- */
export function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "center",
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={clsx("relative z-10 mb-14", align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl")}>
      <Reveal>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-crew-300 backdrop-blur-md">
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-crew-400 status-ping" />
          {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={0.08}>
        <h2 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-white md:text-5xl lg:text-[3.4rem]">
          {title}
        </h2>
      </Reveal>
      {sub && (
        <Reveal delay={0.16}>
          <p className="mt-5 text-base leading-relaxed text-slate-400 md:text-lg">{sub}</p>
        </Reveal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Mouse-tracked 3D tilt card                                        */
/* ---------------------------------------------------------------- */
export function TiltCard({
  children,
  className,
  maxTilt = 8,
  glare = true,
  style,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 180, damping: 20 });
  const sry = useSpring(ry, { stiffness: 180, damping: 20 });
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glareBg = useTransform(
    [glareX, glareY] as [MotionValue<number>, MotionValue<number>],
    ([x, y]: number[]) =>
      `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.14), transparent 55%)`,
  );

  return (
    <motion.div
      ref={ref}
      className={clsx("preserve-3d relative", className)}
      style={{ rotateX: srx, rotateY: sry, ...style }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        ry.set((px - 0.5) * maxTilt * 2);
        rx.set((0.5 - py) * maxTilt * 2);
        glareX.set(px * 100);
        glareY.set(py * 100);
      }}
      onMouseLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
    >
      {children}
      {glare && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ background: glareBg }}
        />
      )}
    </motion.div>
  );
}

/* ---------------------------------------------------------------- */
/* Count-up number that runs when scrolled into view                 */
/* ---------------------------------------------------------------- */
export function CountUp({
  to,
  duration = 1.8,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  to: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(to * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref} className={clsx("tabular-nums", className)}>
      {prefix}
      {value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

/* ---------------------------------------------------------------- */
/* Magnetic CTA button                                               */
/* ---------------------------------------------------------------- */
export function MagneticButton({
  children,
  className,
  href,
  variant = "primary",
}: {
  children: ReactNode;
  className?: string;
  href: string;
  variant?: "primary" | "ghost";
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 16 });
  const sy = useSpring(y, { stiffness: 200, damping: 16 });

  return (
    <motion.a
      ref={ref}
      href={href}
      style={{ x: sx, y: sy }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - r.left - r.width / 2) * 0.25);
        y.set((e.clientY - r.top - r.height / 2) * 0.25);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className={clsx(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-7 py-3.5 text-sm font-bold transition-shadow",
        variant === "primary"
          ? "bg-white text-black shadow-[0_0_50px_-10px_rgba(138,123,239,0.6)] hover:shadow-[0_0_70px_-8px_rgba(138,123,239,0.85)]"
          : "glass text-white hover:border-white/25",
        className,
      )}
    >
      {variant === "primary" && (
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-crew-200/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      )}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </motion.a>
  );
}

/* ---------------------------------------------------------------- */
/* Aurora backdrop blobs for a section                               */
/* ---------------------------------------------------------------- */
export function Aurora({
  variant = "violet",
  className,
}: {
  variant?: "violet" | "cyan" | "pink" | "emerald" | "amber";
  className?: string;
}) {
  const tones: Record<string, [string, string]> = {
    violet: ["rgba(108,92,231,0.35)", "rgba(8,145,207,0.22)"],
    cyan: ["rgba(8,145,207,0.3)", "rgba(108,92,231,0.2)"],
    pink: ["rgba(236,72,153,0.24)", "rgba(108,92,231,0.22)"],
    emerald: ["rgba(5,150,105,0.26)", "rgba(8,145,207,0.18)"],
    amber: ["rgba(217,119,6,0.22)", "rgba(236,72,153,0.16)"],
  };
  const [a, b] = tones[variant];
  return (
    <div aria-hidden className={clsx("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div
        className="aurora-blob left-[-10%] top-[-15%] h-[520px] w-[520px]"
        style={{ background: a }}
      />
      <div
        className="aurora-blob bottom-[-20%] right-[-8%] h-[460px] w-[460px]"
        style={{ background: b, animationDelay: "-9s" }}
      />
    </div>
  );
}

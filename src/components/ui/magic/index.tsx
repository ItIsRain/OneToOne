"use client";

import React, { useEffect, useId, useRef, useState } from "react";

// ============================================
// Dot Pattern Background
// ============================================
interface DotPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
  cr?: number;
  className?: string;
}

export function DotPattern({
  width = 16,
  height = 16,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  ...props
}: DotPatternProps) {
  const id = useId();

  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full fill-neutral-400/30 ${className || ""}`}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
          x={0}
          y={0}
        >
          <circle cx={cx} cy={cy} r={cr} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

// ============================================
// Shine Border Card
// ============================================
interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  borderWidth?: number;
  duration?: number;
  shineColor?: string | string[];
}

export function ShineBorder({
  borderWidth = 1,
  duration = 14,
  shineColor = "#ffffff",
  className,
  style,
  children,
  ...props
}: ShineBorderProps) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden ${className || ""}`}
      {...props}
    >
      <div
        style={{
          ...style,
          "--border-width": `${borderWidth}px`,
          "--duration": `${duration}s`,
          backgroundImage: `radial-gradient(transparent, transparent, ${
            Array.isArray(shineColor) ? shineColor.join(",") : shineColor
          }, transparent, transparent)`,
          backgroundSize: "300% 300%",
          animation: `shine-border var(--duration) linear infinite`,
        } as React.CSSProperties}
        className="pointer-events-none absolute inset-0 rounded-[inherit] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] p-[var(--border-width)]"
      />
      {children}
    </div>
  );
}

// ============================================
// Border Beam
// ============================================
interface BorderBeamProps {
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  className?: string;
}

export function BorderBeam({
  size = 200,
  duration = 12,
  delay = 0,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  className,
}: BorderBeamProps) {
  return (
    <div
      style={{
        "--size": size,
        "--duration": `${duration}s`,
        "--delay": `-${delay}s`,
        "--color-from": colorFrom,
        "--color-to": colorTo,
      } as React.CSSProperties}
      className={`pointer-events-none absolute inset-0 rounded-[inherit] [border:1px_solid_transparent] ![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)] after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:animate-border-beam after:[animation-delay:var(--delay)] after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] after:[offset-anchor:calc(var(--size)*1px)_50%] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))] ${className || ""}`}
    />
  );
}

// ============================================
// Shimmer Button
// ============================================
interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = "#ffffff",
      shimmerSize = "0.1em",
      shimmerDuration = "2s",
      borderRadius = "12px",
      background,
      className,
      children,
      style,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        style={{
          "--shimmer-color": shimmerColor,
          "--radius": borderRadius,
          "--speed": shimmerDuration,
          "--cut": shimmerSize,
          "--bg": background,
          ...style,
        } as React.CSSProperties}
        className={`group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden rounded-[var(--radius)] px-6 py-3 text-white font-medium [background:var(--bg)] transition-transform duration-300 ease-in-out active:scale-[0.98] ${className || ""}`}
        {...props}
      >
        <div className="absolute inset-0 overflow-hidden rounded-[var(--radius)]">
          <div className="absolute inset-[-100%] animate-shimmer-slide [background:linear-gradient(90deg,transparent,var(--shimmer-color),transparent)]" />
        </div>
        <div className="absolute inset-0 rounded-[var(--radius)] shadow-[inset_0_-8px_10px_rgba(255,255,255,0.15)] transition-all duration-300 group-hover:shadow-[inset_0_-6px_10px_rgba(255,255,255,0.2)]" />
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);
ShimmerButton.displayName = "ShimmerButton";

// ============================================
// Glow Card
// ============================================
interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: string;
}

export function GlowCard({
  glowColor = "rgba(120, 119, 198, 0.3)",
  className,
  children,
  ...props
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden transition-all duration-300 ${className || ""}`}
      {...props}
    >
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${glowColor}, transparent 40%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ============================================
// Animated Gradient Text
// ============================================
interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  colors?: string[];
  animationSpeed?: number;
}

export function GradientText({
  colors = ["#ffaa40", "#9c40ff", "#ffaa40"],
  animationSpeed = 8,
  className,
  children,
  ...props
}: GradientTextProps) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(90deg, ${colors.join(", ")})`,
    backgroundSize: "200% auto",
    animation: `gradient-shift ${animationSpeed}s linear infinite`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  return (
    <span className={className} style={gradientStyle} {...props}>
      {children}
    </span>
  );
}

// ============================================
// Bento Grid
// ============================================
interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function BentoGrid({ className, children, ...props }: BentoGridProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  colSpan?: 1 | 2 | 3;
  rowSpan?: 1 | 2;
  gradient?: string;
}

export function BentoCard({
  icon,
  title,
  description,
  colSpan = 1,
  rowSpan = 1,
  gradient,
  className,
  children,
  ...props
}: BentoCardProps) {
  const colSpanClass = colSpan === 2 ? "md:col-span-2" : colSpan === 3 ? "md:col-span-3" : "";
  const rowSpanClass = rowSpan === 2 ? "md:row-span-2" : "";

  return (
    <div
      className={`group relative rounded-2xl border border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 overflow-hidden transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg ${colSpanClass} ${rowSpanClass} ${className || ""}`}
      {...props}
    >
      {gradient && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: gradient }}
        />
      )}
      <div className="relative z-10">
        {icon && (
          <div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        )}
        {children}
      </div>
    </div>
  );
}

// ============================================
// Spotlight Effect
// ============================================
interface SpotlightProps {
  className?: string;
  fill?: string;
}

export function Spotlight({ className, fill = "white" }: SpotlightProps) {
  return (
    <svg
      className={`animate-spotlight pointer-events-none absolute z-[1] h-[169%] w-[138%] lg:w-[84%] opacity-0 ${className || ""}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3787 2842"
      fill="none"
    >
      <g filter="url(#filter)">
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
          fill={fill}
          fillOpacity="0.21"
        />
      </g>
      <defs>
        <filter
          id="filter"
          x="0.860352"
          y="0.838989"
          width="3785.16"
          height="2840.26"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="151" result="effect1_foregroundBlur_1065_8" />
        </filter>
      </defs>
    </svg>
  );
}

// ============================================
// Number Ticker (Animated Counter)
// ============================================
interface NumberTickerProps {
  value: number;
  duration?: number;
  className?: string;
}

export function NumberTicker({ value, duration = 1000, className }: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);

      setDisplayValue(Math.floor(progress * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    return () => {
      startTime.current = null;
    };
  }, [value, duration]);

  return <span className={className}>{displayValue}</span>;
}

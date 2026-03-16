"use client";

import { motion, useScroll, useTransform, useSpring, useInView, type Variants, type MotionProps } from "framer-motion";
import { useRef, type ReactNode, type CSSProperties } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// Animation Variants - Reusable animation definitions
// ═══════════════════════════════════════════════════════════════════════════════

export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
    filter: "blur(10px)"
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      ease: [0.25, 0.4, 0.25, 1]
    }
  }
};

export const fadeInDown: Variants = {
  hidden: {
    opacity: 0,
    y: -30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1]
    }
  }
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.4, 0.25, 1]
    }
  }
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1]
    }
  }
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1]
    }
  }
};

// Stagger container for children animations
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  }
};

// Badge float animation
export const badgeFloat: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.8
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// Animation Components
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}

// Scroll-triggered section animation
export function AnimatedSection({
  children,
  className = "",
  delay = 0,
  once = true
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInUp}
      transition={{ delay }}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}

interface StaggeredGridProps {
  children: ReactNode;
  className?: string;
  fast?: boolean;
}

// Staggered grid container
export function StaggeredGrid({ children, className = "", fast = false }: StaggeredGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fast ? staggerContainerFast : staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggeredItemProps {
  children: ReactNode;
  className?: string;
  index?: number;
}

// Staggered grid item
export function StaggeredItem({ children, className = "" }: StaggeredItemProps) {
  return (
    <motion.div
      variants={fadeInUp}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Hero Animations
// ═══════════════════════════════════════════════════════════════════════════════

interface HeroTextProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function HeroText({ children, className = "", delay = 0 }: HeroTextProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.25, 0.4, 0.25, 1]
      }}
      className={className}
      style={{ willChange: "transform, opacity, filter" }}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedBadgeProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedBadge({ children, className = "", delay = 0 }: AnimatedBadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay
      }}
      whileHover={{
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
      className={className}
      style={{ willChange: "transform" }}
    >
      {children}
    </motion.span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Parallax Components
// ═══════════════════════════════════════════════════════════════════════════════

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  speed?: number;
  style?: CSSProperties;
}

export function Parallax({ children, className = "", speed = 0.5, style }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 100 * speed]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      ref={ref}
      style={{ y: smoothY, ...style }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface FloatingGradientProps {
  className?: string;
  color?: string;
  size?: string;
  blur?: string;
  duration?: number;
}

export function FloatingGradient({
  className = "",
  color = "violet-600/20",
  size = "600px",
  blur = "120px",
  duration = 8
}: FloatingGradientProps) {
  return (
    <motion.div
      className={`absolute rounded-full bg-${color} ${className}`}
      style={{
        width: size,
        height: size,
        filter: `blur(${blur})`,
        willChange: "transform"
      }}
      animate={{
        x: [0, 30, -20, 0],
        y: [0, -40, 20, 0],
        scale: [1, 1.1, 0.95, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Interactive Components
// ═══════════════════════════════════════════════════════════════════════════════

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  tiltAmount?: number;
}

export function TiltCard({ children, className = "", tiltAmount = 10 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -tiltAmount;
    const rotateY = ((x - centerX) / centerX) * tiltAmount;

    ref.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        transition: "transform 0.1s ease-out",
        transformStyle: "preserve-3d",
        willChange: "transform"
      }}
    >
      {children}
    </div>
  );
}

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
}

export function MagneticButton({ children, className = "", strength = 0.3 }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    ref.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = "translate(0px, 0px)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        transition: "transform 0.2s ease-out",
        willChange: "transform"
      }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Counter Animation
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedCounterProps {
  value: string;
  className?: string;
  duration?: number;
}

export function AnimatedCounter({ value, className = "", duration = 2 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  // Extract number and suffix (e.g., "1,284" -> 1284, or "23" -> 23)
  const numericValue = parseInt(value.replace(/,/g, ""), 10);
  const hasComma = value.includes(",");

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
    >
      {isInView && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Counter
            from={0}
            to={numericValue}
            duration={duration}
            formatWithComma={hasComma}
          />
        </motion.span>
      )}
    </motion.span>
  );
}

function Counter({
  from,
  to,
  duration,
  formatWithComma
}: {
  from: number;
  to: number;
  duration: number;
  formatWithComma: boolean;
}) {
  const count = useSpring(from, { duration: duration * 1000 });

  // Start the animation
  count.set(to);

  return (
    <motion.span>
      {Math.round(count.get()).toLocaleString(formatWithComma ? "en-US" : undefined)}
    </motion.span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Star Animation
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedStarsProps {
  count?: number;
  className?: string;
  starClassName?: string;
}

export function AnimatedStars({ count = 5, className = "", starClassName = "" }: AnimatedStarsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      className={`flex gap-1 ${className}`}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
    >
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, scale: 0, rotate: -180 },
            visible: {
              opacity: 1,
              scale: 1,
              rotate: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 15
              }
            }
          }}
          className={starClassName}
        />
      ))}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Text Reveal Animation
// ═══════════════════════════════════════════════════════════════════════════════

interface TextRevealProps {
  children: string;
  className?: string;
  delay?: number;
}

export function TextReveal({ children, className = "", delay = 0 }: TextRevealProps) {
  const words = children.split(" ");

  return (
    <motion.span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: delay + i * 0.05,
            ease: [0.25, 0.4, 0.25, 1]
          }}
          style={{ display: "inline-block", marginRight: "0.25em" }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Glow Effect
// ═══════════════════════════════════════════════════════════════════════════════

interface GlowProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export function Glow({ children, className = "", glowColor = "violet-500" }: GlowProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      whileHover="hover"
    >
      <motion.div
        className={`absolute inset-0 rounded-inherit bg-${glowColor}/0 blur-xl`}
        variants={{
          hover: {
            backgroundColor: `var(--${glowColor})`,
            opacity: 0.4,
            transition: { duration: 0.3 }
          }
        }}
      />
      {children}
    </motion.div>
  );
}

// Re-export motion for convenience
export { motion, useInView, useScroll, useTransform, useSpring };

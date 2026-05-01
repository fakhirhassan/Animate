"use client";

import { motion } from "framer-motion";

interface AnimatedBackgroundProps {
  variant?: "default" | "subtle" | "intense";
  className?: string;
}

export function AnimatedBackground({
  variant = "default",
  className = "",
}: AnimatedBackgroundProps) {
  const blobs = {
    default: [
      { color: "bg-neon-violet/[0.06]", size: "w-96 h-96", position: "top-0 -left-48", delay: 0 },
      { color: "bg-neon-cyan/[0.06]", size: "w-80 h-80", position: "top-1/3 -right-40", delay: 5 },
      { color: "bg-neon-pink/[0.04]", size: "w-72 h-72", position: "bottom-0 left-1/3", delay: 10 },
    ],
    subtle: [
      { color: "bg-neon-violet/[0.04]", size: "w-72 h-72", position: "top-10 -left-36", delay: 0 },
      { color: "bg-neon-cyan/[0.03]", size: "w-64 h-64", position: "bottom-10 -right-32", delay: 8 },
    ],
    intense: [
      { color: "bg-neon-violet/[0.08]", size: "w-[500px] h-[500px]", position: "-top-20 -left-60", delay: 0 },
      { color: "bg-neon-cyan/[0.08]", size: "w-96 h-96", position: "top-1/4 -right-48", delay: 4 },
      { color: "bg-neon-pink/[0.06]", size: "w-80 h-80", position: "bottom-10 left-1/4", delay: 8 },
      { color: "bg-neon-violet/[0.04]", size: "w-72 h-72", position: "bottom-1/3 right-1/4", delay: 12 },
    ],
  };

  return (
    <div
      className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Dot grid overlay */}
      <div className="absolute inset-0 dot-grid opacity-50" />

      {/* Drifting blobs */}
      {blobs[variant].map((blob, i) => (
        <motion.div
          key={i}
          className={`absolute ${blob.size} ${blob.position} ${blob.color} rounded-full blur-3xl`}
          animate={{
            x: [0, 30, -20, 40, 0],
            y: [0, -50, 20, 10, 0],
            scale: [1, 1.1, 0.9, 1.05, 1],
          }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: blob.delay,
          }}
        />
      ))}
    </div>
  );
}

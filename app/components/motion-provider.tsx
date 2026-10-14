"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import { settle } from "@/lib/motion";

// Motion for the whole app. LazyMotion with `m.*` components keeps the bundle
// small, and `strict` refuses a full `motion.*` component that would undo
// that. With the system set to reduce motion, Motion drops movement and keeps
// fades, so things still appear, quietly.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={settle}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

import type { Transition, Variants } from "motion/react";

// The notebook's motion, from DESIGN.md: things settle rather than bounce,
// in 200–520ms, and the stamp is the one thing that overshoots. Shared here so
// every animated part of the app moves the same way.

export const SETTLE = [0.16, 1, 0.3, 1] as const;
export const STAMP = [0.2, 1.4, 0.4, 1] as const;

/** The default: a short settle. */
export const settle: Transition = { duration: 0.26, ease: SETTLE };

/** Rises into place and fades in. `custom` is its place in a sequence. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 16 },
  shown: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.52, ease: SETTLE, delay: i * 0.07 } }),
};

/** Only fades: for things whose position mustn't move. */
export const fade: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.26, ease: SETTLE } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: SETTLE } },
};

/** A sheet laid on the desk from the side, as in the film. */
export const sheet: Variants = {
  hidden: { opacity: 0, x: 28 },
  shown: { opacity: 1, x: 0, transition: { duration: 0.42, ease: SETTLE } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.18, ease: SETTLE } },
};

/** A card that comes up to meet the hand: palettes and quick dialogs. */
export const card: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  shown: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.26, ease: SETTLE } },
  exit: { opacity: 0, y: 6, scale: 0.99, transition: { duration: 0.14, ease: SETTLE } },
};

/** The stamp: lands a little large and settles, the one overshoot. */
export const stamp: Variants = {
  hidden: { opacity: 0, scale: 1.18 },
  shown: (i: number = 0) => ({ opacity: 1, scale: 1, transition: { duration: 0.42, ease: STAMP, delay: i * 0.07 } }),
};

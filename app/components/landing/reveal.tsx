"use client";

import type React from "react";
import * as m from "motion/react-m";
import { rise, sheet, stamp } from "@/lib/motion";

const VARIANTS = { rise, sheet, stamp };
type Tag = "div" | "section" | "li" | "figure" | "article" | "h2" | "p" | "span" | "ol" | "pre" | "dl";

/**
 * Part of the landing page that moves into place the first time it's
 * scrolled to, the way things arrive in the film: rising and settling, a
 * sheet laid down from the side, or a stamp pressed on. `i` is its place in a
 * sequence, which staggers it. The page stays a server component; only these
 * wrappers run on the client.
 */
export function Reveal({
  as = "div",
  variant = "rise",
  i = 0,
  className,
  children,
  ...rest
}: {
  as?: Tag;
  variant?: keyof typeof VARIANTS;
  i?: number;
  className?: string;
  children: React.ReactNode;
} & React.AriaAttributes & { id?: string; role?: string }) {
  const Component = (m as unknown as Record<Tag, React.ElementType>)[as];
  return (
    <Component
      className={className}
      variants={VARIANTS[variant]}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.2 }}
      custom={i}
      data-reveal=""
      {...rest}
    >
      {children}
    </Component>
  );
}

/**
 * A headline whose words rise into place one after another, as the film's
 * last line does.
 */
export function RiseWords({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <m.span className={className} initial="hidden" whileInView="shown" viewport={{ once: true }} data-reveal="">
      {words.map((word, i) => (
        <m.span
          key={i}
          style={{ display: "inline-block", whiteSpace: "pre" }}
          variants={{
            hidden: { opacity: 0, y: "0.35em", filter: "blur(6px)" },
            shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.07 } },
          }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </m.span>
      ))}
    </m.span>
  );
}

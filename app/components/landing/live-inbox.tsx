"use client";

import { useEffect, useState } from "react";
import { FolderInput, Inbox, PenLine } from "lucide-react";
import s from "./landing.module.css";

// An example notebook on the landing page: three agents' notes arrive in the
// Inbox, stamped, and the visitor can witness them or file them under a
// subject. Nothing here touches the server.

const SUBJECTS = [
  { key: "dist", name: "Distributed Systems", color: "var(--dist)" },
  { key: "la", name: "Linear Algebra", color: "var(--la)" },
  { key: "os", name: "Operating Systems", color: "var(--os)" },
  { key: "rust", name: "Rust", color: "var(--rust)" },
] as const;
type Subject = (typeof SUBJECTS)[number];

const ARRIVALS = [
  {
    agent: "Claude Code",
    cli: "claude-code",
    title: "Postgres advisory locks behind pgbouncer",
    text: "Use pg_advisory_xact_lock: transaction-scoped locks survive transaction pooling; session locks don't.",
    subject: "Distributed Systems",
  },
  {
    agent: "Codex",
    cli: "codex",
    title: "Why Cloud Run cold starts hit 3 seconds",
    text: "Loading the ONNX model dominates start-up. Keep min-instances=1, or ship a smaller image.",
    subject: "Distributed Systems",
  },
  {
    agent: "Cursor",
    cli: "cursor",
    title: "CLS pooling for snowflake-arctic-embed",
    text: "Take the [CLS] vector, then L2-normalise it. Mean pooling drifts from the reference.",
    subject: "Linear Algebra",
  },
] as const;
type Arrival = (typeof ARRIVALS)[number];

type Slip = {
  arrival: Arrival;
  witnessed: boolean;
  menu: boolean;
  leaving: Subject | null;
  filed: Subject | null;
};

const TERM_LINES = 7;

export function LiveInbox() {
  const [slips, setSlips] = useState<Slip[]>([]);
  const [arrived, setArrived] = useState(0);

  // One note every 1.7s once the page settles. Reduced motion skips the
  // animations in CSS, and the notes are all there at once.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = ARRIVALS.map((arrival, i) =>
      window.setTimeout(
        () => {
          setSlips((prev) => [{ arrival, witnessed: false, menu: false, leaving: null, filed: null }, ...prev]);
          setArrived((n) => n + 1);
        },
        reduce ? 0 : 900 + i * 1700,
      ),
    );
    return () => timers.forEach(window.clearTimeout);
  }, []);

  const update = (arrival: Arrival, patch: Partial<Slip>) =>
    setSlips((prev) => prev.map((slip) => (slip.arrival === arrival ? { ...slip, ...patch } : slip)));

  const file = (arrival: Arrival, subject: Subject) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The slip slides out first; its animationend files it. Without motion
    // there's no animation to wait for.
    update(arrival, reduce ? { filed: subject, menu: false } : { leaving: subject, menu: false });
  };

  const waiting = slips.filter((slip) => !slip.witnessed && !slip.filed && !slip.leaving).length;
  const filed = slips.filter((slip) => slip.filed || slip.leaving).length;

  // The terminal: an intro line, then two lines per saved note, newest last.
  const term = ARRIVALS.slice(0, arrived).flatMap((a) => [
    <div key={`${a.cli}-call`}>
      <span className={s.who}>{a.cli}</span> <span className={s.dim}>›</span>{" "}
      {`save_note({ title: "${a.title}", subject: "${a.subject}" })`}
    </div>,
    <div key={`${a.cli}-ok`}>
      <span className={s.ok}>Saved to the Inbox.</span> <span className={s.dim}>Waits for you to witness it.</span>
    </div>,
  ]);
  const intro = (
    <div key="intro" className={s.dim}>
      Three agents, connected over MCP with their own tokens.
    </div>
  );

  return (
    <div className={s.desk}>
      <div className={s.app} role="group" aria-label="Example Inbox">
        <div className={`lk-cloth ${s.spine}`} aria-hidden="true">
          <span className={s.plate}>L</span>
          <span className={s.inboxIcon}>
            <Inbox className={s.icon} />
            {waiting > 0 && <span className={s.badge}>{waiting}</span>}
          </span>
          {SUBJECTS.map((subject) => (
            <span key={subject.key} className={s.chip} style={{ background: subject.color }} />
          ))}
        </div>
        <div className={s.tray}>
          <dl className={s.boxes}>
            <div>
              <dt className={s.k}>Tray</dt>
              <dd className={s.v}>Inbox</dd>
            </div>
            <div>
              <dt className={s.k}>To witness</dt>
              <dd className={s.v}>{waiting}</dd>
            </div>
            <div>
              <dt className={s.k}>Filed today</dt>
              <dd className={s.v}>{filed}</dd>
            </div>
          </dl>
          <div className={s.slips} aria-live="polite">
            {slips.length === 0 && <p className={s.empty}>Waiting for your agents…</p>}
            {slips.map((slip) =>
              slip.filed ? (
                <div key={slip.arrival.cli} className={s.filed}>
                  <span className={s.dot} style={{ background: slip.filed.color }} />
                  <span>
                    Filed “{slip.arrival.title}” under {slip.filed.name}
                  </span>
                </div>
              ) : (
                <SlipRow
                  key={slip.arrival.cli}
                  slip={slip}
                  onWitness={() => update(slip.arrival, { witnessed: true })}
                  onToggleMenu={() => update(slip.arrival, { menu: !slip.menu })}
                  onFile={(subject) => file(slip.arrival, subject)}
                  onLeft={() => update(slip.arrival, { filed: slip.leaving, leaving: null })}
                />
              ),
            )}
          </div>
        </div>
      </div>
      <div className={s.term} role="log" aria-label="What the agents ran">
        {[intro, ...term].slice(-TERM_LINES)}
      </div>
      <p className={s.caption}>An example notebook. Witness a note, or file it under a subject.</p>
    </div>
  );
}

function SlipRow({
  slip,
  onWitness,
  onToggleMenu,
  onFile,
  onLeft,
}: {
  slip: Slip;
  onWitness: () => void;
  onToggleMenu: () => void;
  onFile: (subject: Subject) => void;
  onLeft: () => void;
}) {
  const { arrival } = slip;
  return (
    <article
      className={`${s.slip} ${s.arrive} ${slip.leaving ? s.leave : ""}`}
      onAnimationEnd={(e) => {
        // The stamp's own animation bubbles up here too; only the slip leaving counts.
        if (e.target === e.currentTarget && slip.leaving) onLeft();
      }}
    >
      <div>
        <h3>{arrival.title}</h3>
        <p>{arrival.text}</p>
      </div>
      <div className={s.meta}>
        <span>
          Recorded by <b>{arrival.agent}</b>
        </span>
        <span>just now</span>
        {slip.witnessed ? (
          <span className={s.signed}>witnessed by you</span>
        ) : (
          <span className="lk-stamp">Awaiting witness</span>
        )}
      </div>
      <div className={s.acts}>
        {!slip.witnessed && (
          <button type="button" className={`${s.sbtn} ${s.sbtnInk}`} onClick={onWitness}>
            <PenLine className={s.icon} aria-hidden />
            Witness
          </button>
        )}
        <button type="button" className={s.sbtn} onClick={onToggleMenu} aria-expanded={slip.menu}>
          <FolderInput className={s.icon} aria-hidden />
          File
        </button>
      </div>
      {slip.menu && (
        <div className={s.fileMenu} role="group" aria-label={`File “${arrival.title}” under`}>
          {SUBJECTS.map((subject) => (
            <button key={subject.key} type="button" onClick={() => onFile(subject)} disabled={!!slip.leaving}>
              <span className={s.dot} style={{ background: subject.color }} />
              {subject.name}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

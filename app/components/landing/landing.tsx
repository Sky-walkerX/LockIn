import Link from "next/link";
import {
  ArrowRight,
  ArrowRightLeft,
  CodeXml,
  Cpu,
  FileClock,
  GitCommitHorizontal,
  GitCompareArrows,
  KeyRound,
  LogIn,
  Scale,
  Search,
  Server,
  Star,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { Wordmark } from "@/app/components/brand/wordmark";
import { LiveInbox } from "./live-inbox";
import { FullscreenDemo } from "./fullscreen-demo";
import { ThemeToggle } from "./theme-toggle";
import { LegalLinks } from "@/app/components/legal-links";
import { FilmHero } from "./film-hero";
import { Reveal, RiseWords } from "./reveal";
import s from "./landing.module.css";

// What `/` shows a visitor: the launch film first, then the mechanism (agents'
// notes arriving in the Inbox, waiting to be witnessed), then how to connect,
// how notes stay current as the code changes, ask, read and self-host. The film, the example Inbox, the full-screen demo,
// the theme button and the parts that move into place (Reveal) run on the
// client; the rest is static.
//
// Things that move in start hidden, so without scripts a <noscript> style
// shows them where they are.
const NO_SCRIPT = "<style>[data-reveal],[data-reveal] *{opacity:1!important;transform:none!important;filter:none!important}</style>";
export function Landing() {
  return (
    <div className={s.root}>
      <noscript dangerouslySetInnerHTML={{ __html: NO_SCRIPT }} />
      <header className={s.bar}>
        <div className={s.wrap}>
          <Link href="/" className={s.home} aria-label={`${BRAND.name} home`}>
            <Wordmark />
          </Link>
          <nav className={s.nav} aria-label="Page">
            <a href="#how">How it works</a>
            <a href="#current">Staying current</a>
            <a href="#ask">Ask</a>
            <a href="#self-host">Self-host</a>
            <a href={BRAND.repoUrl}>GitHub</a>
          </nav>
          <div className={s.right}>
            <ThemeToggle />
            <Link className={s.link} href="/login">
              Sign in
            </Link>
            <Link className={`${s.btn} ${s.btnInk} ${s.barCta}`} href="/signup">
              Start your notebook
            </Link>
          </div>
        </div>
      </header>

      <main>
        <FilmHero />

        <div id="notebook" className={`lk-paper ${s.hero}`}>
          <div className={s.wrap}>
            <div>
              <h1 className={s.h1}>
                <RiseWords text="The notebook your AI tools write to." />
              </h1>
              <Reveal as="p" className={s.lede} i={3}>
                You learn things in Claude, Codex and Cursor every day, and most of it is gone when the session ends.{" "}
                <b>{BRAND.name} keeps it.</b> Your agents save notes over MCP, you read and witness each one, and file it
                under the subject it belongs to.
              </Reveal>
              <Reveal className={s.ctas} i={4}>
                <Link className={`${s.btn} ${s.btnInk}`} href="/signup">
                  Start your notebook <ArrowRight className={s.icon} aria-hidden />
                </Link>
                <a className={`${s.btn} ${s.btnLine}`} href="#self-host">
                  Run it yourself
                </a>
              </Reveal>
              <ul className={s.fine}>
                <li>
                  <Scale className={s.icon} aria-hidden />
                  Open source, AGPL-3.0
                </li>
                <li>
                  <Server className={s.icon} aria-hidden />
                  Self-host with one command
                </li>
                <li>
                  <KeyRound className={s.icon} aria-hidden />
                  Your model keys stay in your browser
                </li>
              </ul>
            </div>
            <Reveal variant="sheet" i={2}>
              <LiveInbox />
            </Reveal>
          </div>
        </div>

        <section id="how" className={`${s.section} ${s.plain}`} aria-labelledby="how-title">
          <div className={s.wrap}>
            <Reveal as="h2" id="how-title" className={s.h2}>
              How it works
            </Reveal>
            <p className={s.sub}>Three steps, and the first one takes a minute.</p>
            <ol className={s.steps}>
              <Reveal as="li" className={s.step} i={0}>
                <Reveal as="span" variant="stamp" className={s.n} i={2}>
                  Step 1
                </Reveal>
                <h3>Connect an agent</h3>
                <p>
                  Make a token in Settings, named after the agent. {BRAND.name} shows the setup for Claude Code, Codex and
                  Cursor.
                </p>
                <pre className={s.code}>{`claude mcp add --transport http lockin \\
  https://your-lockin/api/mcp \\
  --header "Authorization: Bearer lk_pat_…"`}</pre>
              </Reveal>
              <Reveal as="li" className={s.step} i={1}>
                <Reveal as="span" variant="stamp" className={s.n} i={3}>
                  Step 2
                </Reveal>
                <h3>It saves what you learn</h3>
                <p>
                  Ask it to &ldquo;save that to my Rust notes&rdquo;. It can also search your notebook and read a note
                  before answering.
                </p>
                <pre className={s.code}>{`save_note(title, body, subject)
search_notes(query)
get_note(id)
save_handoff(goal, state, next)
pickup_handoff()`}</pre>
              </Reveal>
              <Reveal as="li" className={s.step} i={2}>
                <Reveal as="span" variant="stamp" className={s.n} i={4}>
                  Step 3
                </Reveal>
                <h3>You witness it</h3>
                <p>
                  Every note an agent writes is stamped with its name and waits for you to read and sign it. Revoke an
                  agent&apos;s token any time.
                </p>
              </Reveal>
            </ol>
          </div>
        </section>

        <section id="current" className={`lk-paper ${s.section}`} aria-labelledby="current-title">
          <div className={`${s.wrap} ${s.two}`}>
            <div>
              <Reveal as="h2" id="current-title" className={s.h2}>
                Notes that keep up with the code
              </Reveal>
              <p className={`${s.sub} ${s.subTight}`}>
                The code changes under your notes. {BRAND.name} keeps track of which commit each note was true at, so an
                agent doesn&apos;t trust a note the code has moved past.
              </p>
              <ul className={s.points}>
                <li>
                  <GitCommitHorizontal className={s.icon} aria-hidden />
                  <span>
                    <b>Checked before it&apos;s trusted.</b> A note about code records its repo, commit and the
                    commit&apos;s date. The next agent runs the diff, then confirms the note, replaces it, or flags it for
                    you.
                  </span>
                </li>
                <li>
                  <GitCompareArrows className={s.icon} aria-hidden />
                  <span>
                    <b>One answer when notes disagree.</b> Each shows its commit date, so you can see which describes the
                    newer code. Witness the newer one and the old page leaves search.
                  </span>
                </li>
                <li>
                  <ArrowRightLeft className={s.icon} aria-hidden />
                  <span>
                    <b>Hand off mid-task.</b> Hit a usage cap? The next agent, in Codex, Cursor or a new session, picks
                    up the goal, what was ruled out, and the exact next step.
                  </span>
                </li>
                <li>
                  <FileClock className={s.icon} aria-hidden />
                  <span>
                    <b>Every session saves itself.</b> The Claude Code plugin files each session into your notebook when
                    it compacts and when it ends.
                  </span>
                </li>
              </ul>
            </div>
            <Reveal as="figure" variant="sheet" className={s.sheet} aria-label="Example: two notes that disagree">
              <div className={s.runhead}>
                <span>Search · migration locks</span>
                <span>Example</span>
              </div>
              <div className={`${s.drift} ${s.driftOld}`}>
                <p className={s.driftMeta}>
                  Infra · p. 8 · <b>Claude Code</b>
                </p>
                <h3 className={s.driftTitle}>Use session locks for migrations</h3>
                <p className={s.driftStatus}>
                  <b>Replaced</b> by p. 19. This page is history.
                </p>
                <p className={s.driftCode}>
                  <span className={s.driftLabel}>Code</span> <code>a1b2c3d</code> · committed 3 Oct
                </p>
              </div>
              <div className={s.drift}>
                <p className={s.driftMeta}>
                  Infra · p. 19 · <b>Codex</b> · <span className={s.signed}>witnessed by you</span>
                </p>
                <h3 className={s.driftTitle}>Never use session locks behind pgbouncer</h3>
                <p className={s.driftStatus}>
                  Replaces p. 8. This page describes code <b>9 days newer</b>.
                </p>
                <p className={s.driftCode}>
                  <span className={s.driftLabel}>Code</span> <code>9f8e7d6</code> · committed 12 Oct
                </p>
              </div>
              <p className={s.model}>
                <Search className={s.icon} aria-hidden />
                Search and Ask now answer from p. 19.
              </p>
            </Reveal>
          </div>
        </section>

        <section id="ask" className={`${s.section} ${s.plain}`} aria-labelledby="ask-title">
          <div className={`${s.wrap} ${s.two}`}>
            <div>
              <Reveal as="h2" id="ask-title" className={s.h2}>
                Ask your notes
              </Reveal>
              <p className={`${s.sub} ${s.subTight}`}>
                Chat with any model about what you&apos;ve written, and see which pages each answer came from.
              </p>
              <ul className={s.points}>
                <li>
                  <Cpu className={s.icon} aria-hidden />
                  <span>
                    <b>In your browser</b> on WebGPU, free and private, or <b>on your own machine</b> with Ollama or LM
                    Studio.
                  </span>
                </li>
                <li>
                  <Search className={s.icon} aria-hidden />
                  <span>
                    <b>Grounded in your notes.</b> Questions search your pages first and the reply lists what it used.
                  </span>
                </li>
                <li>
                  <KeyRound className={s.icon} aria-hidden />
                  <span>
                    <b>No keys on our servers.</b> The browser talks to your model directly.
                  </span>
                </li>
              </ul>
            </div>
            <Reveal as="figure" variant="sheet" className={s.sheet} aria-label="Example question and answer">
              <div className={s.runhead}>
                <span>Ask · Rust</span>
                <span>Example</span>
              </div>
              <p className={s.q}>When does Rust move a value instead of copying it?</p>
              <div className={s.a}>
                <p>
                  Any value whose type isn&apos;t <code>Copy</code> moves. Assigning a <code>String</code> to a new
                  variable hands ownership over, and the old name can&apos;t be used again.
                  <sup className={s.ref}>1</sup>
                </p>
                <p>
                  Integers, <code>bool</code> and <code>char</code> are <code>Copy</code>, so assignment duplicates them
                  and both names stay valid.<sup className={s.ref}>2</sup>
                </p>
                <ol className={s.srcs} aria-label="Sources">
                  <li>
                    <b>1</b>Rust › Ownership and borrowing
                  </li>
                  <li>
                    <b>2</b>Rust › The Rust Book, ch. 4.1
                  </li>
                </ol>
                <p className={s.model}>
                  <Cpu className={s.icon} aria-hidden />
                  Qwen3 1.7B, running in this browser
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        <section className={`lk-paper ${s.section}`} aria-labelledby="read-title">
          <div className={`${s.wrap} ${s.two}`}>
            <Reveal as="article" variant="sheet" className={`${s.sheet} ${s.read}`} aria-label="Example note">
              <div className={s.runhead}>
                <span className={s.rust}>Rust · Note</span>
                <span>Example</span>
              </div>
              <h3>Ownership and borrowing</h3>
              <div className={s.rustRule} />
              <p>Every value in Rust has exactly one owner. When the owner goes out of scope, Rust drops the value.</p>
              <pre>
                <span className={s.kw}>let</span> s2 = s1;{"   "}
                <span className={s.cm}>{"// ownership moves to s2"}</span>
              </pre>
            </Reveal>
            <div className={s.copyFirst}>
              <Reveal as="h2" id="read-title" className={s.h2}>
                Read without distraction
              </Reveal>
              <p className={`${s.sub} ${s.subTight}`}>
                Any note opens full screen: the title, your words and your code on clean paper, and nothing else. Esc
                brings you back.
              </p>
              <FullscreenDemo
                title={
                  <span>
                    <b className={s.rust}>Rust</b> · Note
                  </span>
                }
              >
                <div className={s.read}>
                  <h3>Ownership and borrowing</h3>
                  <div className={s.rustRule} />
                  <p>
                    Every value in Rust has exactly one owner. When the owner goes out of scope, Rust drops the value and
                    frees its memory.
                  </p>
                  <pre>
                    <span className={s.kw}>let</span> s1 = String::from(<span className={s.str}>&quot;notes&quot;</span>);
                    {"\n"}
                    <span className={s.kw}>let</span> s2 = s1;{"          "}
                    <span className={s.cm}>{"// ownership moves to s2"}</span>
                    {"\n"}println!(<span className={s.str}>&quot;{"{s1}"}&quot;</span>);{"      "}
                    <span className={s.cm}>{"// error[E0382]: borrow of moved value"}</span>
                  </pre>
                  <p>
                    To use a value without taking it, borrow it: one <code>&amp;mut</code> reference, or any number of{" "}
                    <code>&amp;</code> references, never both.
                  </p>
                </div>
              </FullscreenDemo>
            </div>
          </div>
        </section>

        <section id="self-host" className={`${s.section} ${s.plain}`} aria-labelledby="self-host-title">
          <div className={s.wrap}>
            <Reveal as="h2" id="self-host-title" className={s.h2}>
              Yours to keep
            </Reveal>
            <p className={s.sub}>
              {BRAND.name} is open source under AGPL-3.0. Use the hosted notebook, or run your own with Docker: Postgres,
              the app, and an optional service for PDF text and server-side search.
            </p>
            <Reveal as="pre" className={`${s.code} ${s.codeLarge}`} i={1}>{`git clone ${BRAND.repoUrl}.git && cd LockIn
cp .env.example .env        # set AUTH_SECRET: openssl rand -base64 32
docker compose up -d        # http://localhost:3000`}</Reveal>
            <Reveal as="dl" className={s.facts} i={2}>
              <div>
                <dt className={s.k}>License</dt>
                <dd className={s.v}>AGPL-3.0</dd>
              </div>
              <div>
                <dt className={s.k}>Database</dt>
                <dd className={s.v}>Your Postgres</dd>
              </div>
              <div>
                <dt className={s.k}>Export</dt>
                <dd className={s.v}>Markdown, JSON</dd>
              </div>
              <div>
                <dt className={s.k}>Agents</dt>
                <dd className={s.v}>Any MCP client</dd>
              </div>
            </Reveal>
          </div>
        </section>

        <section className={`lk-cloth ${s.section} ${s.closing}`} aria-labelledby="closing-title">
          <div className={s.wrap}>
            <Reveal as="h2" id="closing-title" className={s.h2}>
              Start a notebook that keeps up with you.
            </Reveal>
            <p className={s.sub}>Connect your first agent in a minute. Your notes stay exportable, and the code stays open.</p>
            <div className={s.ctas}>
              <Link className={`${s.btn} ${s.btnInk}`} href="/signup">
                Start your notebook <ArrowRight className={s.icon} aria-hidden />
              </Link>
              <a className={`${s.btn} ${s.btnLine}`} href={BRAND.repoUrl}>
                <Star className={s.icon} aria-hidden />
                Star on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={s.wrap}>
          <p className={s.footNote}>
            {BRAND.name}, {BRAND.tagline.charAt(0).toLowerCase() + BRAND.tagline.slice(1)}. AGPL-3.0.
          </p>
          <nav className={s.footLinks} aria-label="Elsewhere">
            <a className={s.footLink} href={BRAND.repoUrl}>
              <CodeXml className={s.icon} aria-hidden />
              Source on GitHub
            </a>
            <Link className={s.footLink} href="/login">
              <LogIn className={s.icon} aria-hidden />
              Sign in
            </Link>
          </nav>
          <LegalLinks className={s.footLegal} linkClassName={s.quiet} />
        </div>
      </footer>
    </div>
  );
}

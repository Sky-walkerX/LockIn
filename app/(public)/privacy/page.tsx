import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { operator } from "@/lib/operator";
import { Contact, LegalPage } from "@/app/components/legal-page";

// Rendered per request: who runs the instance is set where it runs
// (OPERATOR_EMAIL), not when the app was built, and without it there is no page.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: `Privacy · ${BRAND.name}` };

// What this instance keeps about the people who use it. Every statement here
// is about what the code does: change the code, change the page.
export default function PrivacyPage() {
  const who = operator();
  if (!who) notFound();
  const runner = who.name ?? "its operator";

  return (
    <LegalPage title="Privacy" updated="14 October 2026" operator={who} other={{ href: "/terms", label: "Terms" }}>
      <p>
        This notebook is a copy of {BRAND.name}, which is <a href={BRAND.repoUrl}>open-source software</a>, run by{" "}
        {runner}. This page says what it keeps about you, who else can see it, and how to take it away. Questions go
        to <Contact operator={who} />.
      </p>

      <h2>What is kept</h2>
      <ul>
        <li>
          <strong>Your account.</strong> Your email address, your name if you gave one or Google passed it on, and
          when you signed up. A password is kept only as a bcrypt hash, never as you typed it.
        </li>
        <li>
          <strong>Your notebook.</strong> Subjects, notes, tasks, the links and PDFs you save and the text read out of
          them, images you paste, focus sessions, and your conversations in Ask. So that notes can be searched by
          meaning, passages of them are also kept as lists of numbers (embeddings).
        </li>
        <li>
          <strong>Your connections.</strong> The names of the agents and apps you connected and when each was last
          used. Their tokens are kept only as hashes.
        </li>
        <li>
          <strong>Sign-in tries.</strong> To slow down password guessing, tries are counted against the email address
          typed and the network address they came from. A count is dropped about a day after it stops being used.
        </li>
      </ul>

      <h2>In your browser</h2>
      <p>
        The only cookies are the ones signing in needs (they keep you signed in and protect the sign-in form) and one
        holding your time zone, so that dates are right. Your theme and your Ask settings are kept in the
        browser&apos;s own storage. That includes any model API key you enter:
        it stays in the browser and is never sent to this server. There are no advertising cookies, no analytics and
        no trackers.
      </p>

      <h2>What it is used for</h2>
      <p>
        To run your notebook, and nothing else. It isn&apos;t sold, shared for advertising or used to train a model.
        Notes are not encrypted against the person running the server, so {runner} is able to read them, and
        doesn&apos;t, except to fix a fault you have reported or where the law requires it.
      </p>

      <h2>Who else sees it</h2>
      <ul>
        <li>
          <strong>Agents and apps you connect.</strong> Each can read your notes and add to them, until you disconnect
          it in Settings.
        </li>
        <li>
          <strong>The model you choose in Ask.</strong> With a model in your browser or on your own machine, nothing
          leaves. With a provider&apos;s key (Anthropic, OpenAI, Gemini, OpenRouter), your browser sends the question
          and the passages of your notes used to answer it straight to that provider, under their terms.
        </li>
        <li>
          <strong>Model downloads.</strong> A model that runs in your browser is downloaded by your browser from where
          it is published, mostly Hugging Face. That host sees your network address, as any website you visit does.
        </li>
        <li>
          <strong>Google,</strong> if you use Continue with Google. Google learns that you signed in here, and this
          notebook receives your email address and name from it.
        </li>
        <li>
          <strong>An email service,</strong> where this notebook sends email: it carries the confirmation and
          password-reset messages, so it sees your address and those messages.
        </li>
        <li>
          <strong>Sites you save a link to.</strong> The server fetches the page to read its text. The site sees the
          server&apos;s address, not yours.
        </li>
        <li>
          <strong>Anyone you give a link to.</strong> A shared page can be read by whoever has its link until you turn
          the link off. Images and PDFs you upload are served from long addresses that can&apos;t be guessed but need
          no sign-in, so anyone handed such an address can open that file.
        </li>
      </ul>
      {who.hosting && (
        <>
          <h2>Where it is kept</h2>
          <p>{who.hosting}</p>
        </>
      )}

      <h2>Keeping and deleting</h2>
      <p>
        Everything is kept until you delete it. Settings exports the whole notebook as one JSON file, and each
        subject exports as Markdown or JSON. &ldquo;Delete account&rdquo; in Settings removes the account, the
        notebook, its files and every agent&apos;s access at once. Backups made before then still hold a copy until
        they are themselves deleted.
      </p>
      <p>
        To ask for a copy of what is kept about you, to have something corrected, or to have your account removed for
        you, write to <Contact operator={who} />.
      </p>

      <h2>Changes</h2>
      <p>This page changes when what it describes does. The date at the top says when it last did.</p>
    </LegalPage>
  );
}

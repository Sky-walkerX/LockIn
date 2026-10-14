import { describe, expect, it, vi } from "vitest";

// The pure parts; the queries run against a database in the verify skill.
vi.mock("@/lib/prisma", () => ({ default: {} }));
vi.mock("@/lib/rag/ingest", () => ({}));
vi.mock("@/lib/rag/sources", () => ({}));
const { sharesEnough, titleTerms } = await import("./related");

describe("titleTerms", () => {
  it("keeps the distinct words of three letters or more", () => {
    expect(titleTerms("Use session locks for migrations; session locks!")).toEqual(["use", "session", "locks", "for", "migrations"]);
    expect(titleTerms("a b")).toEqual([]);
  });
});

describe("sharesEnough", () => {
  const terms = titleTerms("Never use session locks behind pgbouncer");
  it("needs two shared words and half of them", () => {
    expect(sharesEnough(terms, "Use session locks for migrations. We use pgbouncer.")).toBe(true);
    expect(sharesEnough(terms, "Advisory locks in general")).toBe(false);
  });
  it("needs the word itself for a one-word title", () => {
    expect(sharesEnough(["pgbouncer"], "pgbouncer pools")).toBe(true);
    expect(sharesEnough(["pgbouncer"], "pooling")).toBe(false);
  });
});

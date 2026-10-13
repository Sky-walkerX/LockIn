import { z } from "zod";

// How long the things a request sends may be. Every route's schema takes its
// fields from here, so nothing reaches the database, or a loop over it, at a
// size nobody meant to allow. The numbers are generous for writing and small
// next to what a request body could otherwise carry.

/** A record's id: a uuid, or an older account's Google id. */
export const id = z.string().min(1).max(64);

/** A subject's, note's, task's or resource's name. */
export const title = z.string().min(1).max(300);

/** A note's body, or a task's or subtask's notes: markdown, up to about 400 pages. */
export const body = z.string().max(1_000_000);

/** A short description: a subject's, or a resource's own note. */
export const blurb = z.string().max(20_000);

/**
 * A link, to a web page only. It ends up in an href, on a shared page too, so
 * `javascript:` and `data:` addresses are refused here and not left to the
 * browser.
 */
export const url = z.url({ protocol: /^https?$/ }).max(2_000);

/** A colour as the picker gives it. */
export const color = z.string().max(32);

/** A list of ids in a new order: every note in a subject, or every task in a list. */
export const ids = z.array(id).min(1).max(2_000);

// Keys for the queries the server prefetches into a page (lib/prefetch.ts).
// The hooks that fetch the same data in the browser use these too, so a
// prefetched result lands under exactly the key the page will ask for.
export const queryKeys = {
  subjects: ["subjects"],
  subject: (id: string | undefined) => ["subject", id],
  inbox: ["inbox"],
  tasks: (params: { subjectId?: string; milestoneId?: string } = {}) => ["tasks", params],
  // `day` is the user's local date: the lists roll over at their midnight.
  todayTasks: (day: string) => ["tasks", { today: true, day }],
  dueReviews: (day: string) => ["reviews", { day }],
  recentNotes: (limit: number) => ["notes", "recent", limit],
  tokens: ["tokens"],
  connectedApps: ["oauth-grants"],
} as const;

// How many recent notes the contents page lists, so its hook and the server's
// prefetch ask for the same query.
export const CONTENTS_RECENT_NOTES = 14;

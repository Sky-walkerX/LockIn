/** How a page is written wherever it's shown or cited. Kept apart from
 *  page.ts, which reaches the database, so the browser can use it. */
export function pageLabel(page: number): string {
  return `p. ${page}`;
}

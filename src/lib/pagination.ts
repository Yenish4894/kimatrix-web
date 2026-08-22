/**
 * Rows per page for every paginated list in the app.
 *
 * One constant rather than a number typed into each page. It was 20 in four separate
 * files, which is both too many rows to scan comfortably and four chances for the
 * screens to drift apart from each other.
 *
 * The API defaults to 10 as well (`paginationSchema` in the backend) and caps at 100,
 * so this stays inside what the server will accept.
 */
export const PAGE_SIZE = 10;

/**
 * "Showing 1–10 of 11", for the top of a paginated list.
 *
 * With ten rows a page, the pagination control sits below the fold — you scroll past
 * every row to find out which page you are on. This puts that where the total count
 * already is, so page state is readable without scrolling.
 *
 * Returns null when there is nothing to describe, so a caller can render nothing at
 * all rather than "Showing 0–0 of 0".
 */
export function formatPageRange(
  page: number,
  limit: number,
  total: number,
  /**
   * Both forms, because English plurals cannot be derived. Appending "s" turned
   * "company" into "companys" — caught by the test, not by review.
   */
  noun: { one: string; many: string } = { one: "item", many: "items" },
): string | null {
  if (!Number.isFinite(total) || total <= 0) return null;

  const word = total === 1 ? noun.one : noun.many;
  const first = (page - 1) * limit + 1;

  // Clamped: a stale page number after a filter change would otherwise read
  // "Showing 21-30 of 11".
  if (first > total) return `Showing ${total} of ${total} ${word}`;

  const last = Math.min(page * limit, total);

  // One page holds everything - a range adds nothing over the plain count.
  if (first === 1 && last === total) return `Showing all ${total} ${word}`;

  return `Showing ${first}–${last} of ${total} ${word}`;
}

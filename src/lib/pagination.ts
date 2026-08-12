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

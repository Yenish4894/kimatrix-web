/**
 * Converting between a date `<input>` ("2027-03-15") and a stored instant.
 *
 * Both comp forms used to send `${date}T23:59:59.000Z` — the end of the day in UTC.
 * But `formatDate` renders in the viewer's local timezone, and every user of this
 * platform is east of UTC (South Africa +2, India +5:30), where 23:59 UTC is already
 * the next morning. So an admin who picked 15 March was shown "Until 16 Mar", and the
 * access genuinely ran into the 16th. Working in local time on both sides — what is
 * saved and what is shown — is what makes the date the admin picked the date they see.
 */

/** "2027-03-15" → the last millisecond of that day in the viewer's timezone, as ISO. */
export function endOfLocalDayIso(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y!, m! - 1, d!, 23, 59, 59, 999).toISOString();
}

/**
 * A stored instant → the "yyyy-mm-dd" a date input should show, in the viewer's
 * timezone. Not `iso.slice(0, 10)`: that is the UTC calendar date, which is the wrong
 * day for part of every day anywhere that isn't UTC.
 */
export function toLocalDateInput(value: string | Date): string {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

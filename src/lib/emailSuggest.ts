/**
 * "Did you mean …?" for mistyped email domains.
 *
 * Why this exists: typo addresses such as `name@gmai.com` bounced, and the bounces got
 * the sending mailbox suspended. This catches the common slips at the keyboard. It is
 * advisory only — the server makes the real decision — so it is tuned to stay quiet
 * rather than risk nagging a business about its own domain.
 *
 * Pure and dependency-free so it can be unit tested with node:test.
 */

/** Providers we will steer people towards. */
const POPULAR = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "rediffmail.com",
] as const;

/** Frequent typos that are mapped directly, whatever the edit distance. */
const KNOWN_TYPOS: Record<string, string> = {
  // gmail
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.om": "gmail.com",
  "gmail.cmo": "gmail.com",
  "gmail.comm": "gmail.com",
  "gmail.in": "gmail.com",
  "gmailcom": "gmail.com",
  // hotmail / outlook / yahoo / icloud
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yhaoo.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlook.con": "outlook.com",
  "iclod.com": "icloud.com",
  "icoud.com": "icloud.com",
  "icloud.con": "icloud.com",
  // rediffmail (India)
  "redifmail.com": "rediffmail.com",
  "rediffmal.com": "rediffmail.com",
  "rediffmial.com": "rediffmail.com",
  "rediffmail.con": "rediffmail.com",
  "rediffmail.co": "rediffmail.com",
  "rediffmai.com": "rediffmail.com",
  "reddifmail.com": "rediffmail.com",
  "redffmail.com": "rediffmail.com",
  "rediffimail.com": "rediffmail.com",
};

/**
 * Real domains that happen to sit close to a popular one. Never suggest for these —
 * `mail.com` is one edit from `gmail.com`, `ymail.com` is Yahoo's own, and the regional
 * variants are exactly what South African and Indian customers legitimately use.
 */
const LEGITIMATE = new Set<string>([
  ...POPULAR,
  "googlemail.com",
  "mail.com",
  "email.com",
  "ymail.com",
  "gmx.com",
  "gmx.net",
  "aol.com",
  "msn.com",
  "me.com",
  "mac.com",
  "live.in",
  "live.co.za",
  "live.co.uk",
  "outlook.in",
  "outlook.co.za",
  "hotmail.co.za",
  "hotmail.co.uk",
  "hotmail.in",
  "yahoo.in",
  "yahoo.co.in",
  "yahoo.co.za",
  "yahoo.co.uk",
  "rediff.com",
  "rediffmail.co.in",
  "zoho.com",
  "zohomail.in",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "tutanota.com",
  "webmail.co.za",
  "mweb.co.za",
  "telkomsa.net",
  "vodamail.co.za",
]);

/**
 * Optimal string alignment distance: Levenshtein plus adjacent transposition, so
 * `gmial` → `gmail` costs 1, not 2.
 */
export function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i++) d[i][0] = i;
  for (let j = 0; j < cols; j++) d[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/**
 * Returns a corrected address when the domain looks like a typo of a popular provider,
 * otherwise null. The local part is preserved exactly as typed.
 */
export function suggestEmail(email: string): string | null {
  if (typeof email !== "string") return null;
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return null;
  const local = trimmed.slice(0, at);
  if (local.includes("@") || /\s/.test(trimmed)) return null;

  const domain = trimmed.slice(at + 1).toLowerCase().replace(/\.+$/, "");
  if (!domain) return null;

  const mapped = KNOWN_TYPOS[domain];
  if (mapped) return `${local}@${mapped}`;

  // From here on, a dotless domain is not worth guessing about.
  if (!domain.includes(".") || LEGITIMATE.has(domain)) return null;

  let best: string | null = null;
  let bestDistance = Infinity;
  let tied = false;
  for (const candidate of POPULAR) {
    const distance = editDistance(domain, candidate);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
      tied = false;
    } else if (distance === bestDistance) {
      tied = true;
    }
  }
  if (!best || tied) return null;

  if (bestDistance === 0 || bestDistance > 2) return null;

  // Short targets (live.com) sit one edit away from real company domains (lime.com,
  // love.com), so for them only a slip in the TLD counts: `live.cmo`, not `livr.com`.
  if (best.length <= 8) {
    const label = best.slice(0, best.indexOf(".") + 1);
    if (!domain.startsWith(label) || bestDistance > 1) return null;
  }
  return `${local}@${best}`;
}

/**
 * Pulls the address out of a server message such as
 * "That email domain looks wrong. Did you mean name@gmail.com?" so the UI can offer a
 * one-click fix for the server's suggestion as well as its own.
 */
export function suggestionFromMessage(message: string | null | undefined): string | null {
  if (!message) return null;
  const match = /did you mean\s+["'“]?([^\s"'”?]+@[^\s"'”?]+?)["'”]?\s*\?/i.exec(message);
  return match ? match[1] : null;
}

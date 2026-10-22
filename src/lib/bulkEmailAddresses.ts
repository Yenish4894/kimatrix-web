/**
 * The "extra addresses" box on the admin bulk-email page.
 *
 * People paste address lists in every shape: comma/semicolon/newline separated, or
 * straight from a mail client as `Name <x@y.com>`, sometimes quoted or with a trailing
 * full stop. The old splitter kept `<x@y.com>` and `x@y.com.` as addresses, its own
 * check let them through, and the server's stricter check then refused the whole send
 * with only "Validation failed" on screen.
 */

/** Characters that wrap an address in a paste but are never part of one. */
const WRAPPERS = /^[<("'[]+|[>)"'\].,:;]+$/g;

/**
 * Close to the server's Joi `email({ tlds: false })`: no leading, trailing or doubled
 * dot in the local part; domain labels of letters, digits and inner hyphens, at least
 * two of them. The server stays the authority; this decides what to warn about.
 */
const VALID_EMAIL =
  /^(?!\.)(?!.*\.\.)[a-z0-9!#$%&'*+/=?^_`{|}~.-]+(?<!\.)@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

export function isValidEmailAddress(address: string): boolean {
  return address.length <= 255 && VALID_EMAIL.test(address);
}

/**
 * The addresses in a pasted block, lower-cased and de-duplicated, in paste order.
 * Words without an `@` (the "Name" in `Name <x@y.com>`) are ignored, not reported.
 */
export function parseExtraEmails(input: string): string[] {
  const out = new Set<string>();
  for (const raw of input.split(/[\s,;]+/)) {
    const token = raw.replace(WRAPPERS, "").trim().toLowerCase();
    if (token.includes("@")) out.add(token);
  }
  return Array.from(out);
}

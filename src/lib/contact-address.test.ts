import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fs from "node:fs";
import path from "node:path";

/**
 * Addresses on the kimates.com domain that actually exist as mailboxes.
 *
 * Verified by SMTP probe against mx1.hostinger.com: info@ answers 250, while
 * support@, admin@ and a deliberately fake address all answer 550. The site shipped
 * support@kimates.com in the public footer and in the privacy policy, so every
 * customer who wrote to the address we advertised got a bounce — and nothing in the
 * codebase could have told us, because a wrong-but-plausible address looks exactly
 * like a right one.
 *
 * Add to this list ONLY after confirming the mailbox receives mail.
 */
const REAL_MAILBOXES = new Set(["info@kimates.com"]);

/** Sample data and fixtures are allowed to invent addresses. */
const IGNORED_DOMAINS = [/@yopmail\.com$/i, /@example\.(com|org)$/i, /@gmail\.com$/i];

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, acc);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts")) acc.push(full);
  }
  return acc;
}

describe("contact addresses in the shipped UI", () => {
  it("only advertises mailboxes that exist", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles(path.join(process.cwd(), "src"))) {
      const text = fs.readFileSync(file, "utf8");
      for (const [address] of text.matchAll(/[\w.+-]+@kimates\.com/gi)) {
        const normalised = address.toLowerCase();
        if (REAL_MAILBOXES.has(normalised)) continue;
        if (IGNORED_DOMAINS.some((re) => re.test(normalised))) continue;
        offenders.push(`${path.relative(process.cwd(), file)} → ${address}`);
      }
    }

    assert.deepEqual(
      offenders,
      [],
      `These addresses are advertised but were never confirmed to receive mail:\n  ${offenders.join("\n  ")}`,
    );
  });
});

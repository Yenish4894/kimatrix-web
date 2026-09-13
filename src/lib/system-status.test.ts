import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SERVICE_HEALTH_LABEL,
  downServices,
  formatLatency,
  outageMessage,
  serviceMetaItems,
  smtpCheck,
  smtpDownMessage,
} from "./system-status";

const fmt = (iso: string) => `@${iso}`;

describe("outageMessage", () => {
  it("names the service, the cause and the impact", () => {
    assert.equal(
      outageMessage({ key: "smtp", name: "Email sending", detail: "Hostinger rejected the login." }),
      "Email sending is down — Hostinger rejected the login. Password resets, verification and notices are not being delivered.",
    );
  });
  it("copes with an empty detail", () => {
    assert.match(outageMessage({ key: "database", name: "Database", detail: "" }), /^Database is down\. /);
  });
});

describe("SMTP delivery", () => {
  const fmt = (iso: string) => `<${iso}>`;

  it("finds the smtp entry", () => {
    assert.equal(smtpCheck({ services: [{ key: "smtp" }] as never })?.key, "smtp");
    assert.equal(smtpCheck(undefined), undefined);
  });

  it("dates the down banner from the last successful send", () => {
    assert.equal(
      smtpDownMessage({ lastSuccessAt: "2026-09-12T08:00:00Z" }, fmt),
      "Emails are not being delivered — the mail server is rejecting outgoing email since <2026-09-12T08:00:00Z>. Check the Hostinger panel (Outbound sending).",
    );
  });

  it("omits 'since' when there has never been a success", () => {
    assert.match(smtpDownMessage({ lastSuccessAt: null }, fmt), /rejecting outgoing email\. Check/);
  });

  it("shows last success, failure and error, emphasising a failure after the last success", () => {
    const items = serviceMetaItems(
      {
        key: "smtp",
        lastSuccessAt: "2026-09-12T08:00:00Z",
        lastFailureAt: "2026-09-12T09:00:00Z",
        lastError: "550 Sender not allowed",
      },
      fmt,
    );
    assert.deepEqual(items, [
      { label: "Last success", value: "<2026-09-12T08:00:00Z>" },
      { label: "Last failure", value: "<2026-09-12T09:00:00Z>", emphasis: true },
      { label: "Last error", value: "550 Sender not allowed", emphasis: true },
    ]);
  });

  it("does not emphasise an old failure once mail is flowing again", () => {
    const items = serviceMetaItems(
      { key: "smtp", lastSuccessAt: "2026-09-12T10:00:00Z", lastFailureAt: "2026-09-12T09:00:00Z" },
      fmt,
    );
    assert.equal(items.find((i) => i.label === "Last failure")?.emphasis, false);
  });
});

describe("downServices", () => {
  it("returns only down services", () => {
    const s = [{ status: "ok" }, { status: "down" }, { status: "degraded" }] as const;
    assert.deepEqual(downServices([...s]), [{ status: "down" }]);
  });
  it("tolerates undefined", () => assert.deepEqual(downServices(undefined), []));
});

describe("labels", () => {
  it("every state has a text label, never colour alone", () => {
    assert.deepEqual(SERVICE_HEALTH_LABEL, { ok: "OK", up: "OK", degraded: "Degraded", down: "Down" });
  });
  it("latency", () => {
    assert.equal(formatLatency(12.6), "13 ms");
    assert.equal(formatLatency(null), "—");
  });
});

describe("serviceMetaItems", () => {
  it("email queue: failed, waiting and the last failure", () => {
    const items = serviceMetaItems(
      {
        key: "email_queue",
        meta: { failed: 3, waiting: 0, lastFailedReason: "535 auth failed", lastFailedAt: "2026-09-12T10:00:00Z" },
      },
      fmt,
    );
    assert.deepEqual(items, [
      { label: "Failed", value: "3", emphasis: true },
      { label: "Waiting", value: "0" },
      { label: "Last failure", value: "535 auth failed (@2026-09-12T10:00:00Z)" },
    ]);
  });
  it("paypal sandbox is flagged", () => {
    assert.deepEqual(serviceMetaItems({ key: "paypal", meta: { mode: "sandbox" } }, fmt), [
      { label: "Mode", value: "sandbox", emphasis: true },
    ]);
  });
  it("missing or malformed meta yields nothing", () => {
    assert.deepEqual(serviceMetaItems({ key: "email_queue" }, fmt), []);
    assert.deepEqual(serviceMetaItems({ key: "email_queue", meta: { failed: "lots" } }, fmt), []);
  });
});

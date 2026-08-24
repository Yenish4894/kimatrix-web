import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ATTACHMENT_MAX_BYTES, attachmentError, formatBytes } from "./attachments";

/** A stand-in for File — only name and size are read. */
const file = (name: string, size: number) => ({ name, size }) as File;

describe("attachmentError", () => {
  it("accepts an ordinary document under the cap", () => {
    assert.equal(attachmentError(file("notice.pdf", 2 * 1024 * 1024)), null);
  });

  it("accepts a file of exactly 10 MB", () => {
    // The boundary matters: an off-by-one here rejects a file the server would accept.
    assert.equal(attachmentError(file("big.pdf", ATTACHMENT_MAX_BYTES)), null);
  });

  it("rejects one byte over, and says by how much", () => {
    const msg = attachmentError(file("big.pdf", ATTACHMENT_MAX_BYTES + 1));
    assert.ok(msg?.includes("10.0 MB"), "must state the limit");
    assert.ok(msg?.includes("Try compressing"), "must say what to do instead");
  });

  it("rejects an executable regardless of size", () => {
    assert.match(attachmentError(file("setup.exe", 10))!, /can't be attached/);
  });

  it("judges on the final extension only", () => {
    // "invoice.pdf.exe" opens as an executable, whatever the middle says.
    assert.ok(attachmentError(file("invoice.pdf.exe", 100)));
    assert.equal(attachmentError(file("invoice.exe.pdf", 100)), null);
  });

  it("rejects an empty file rather than sending a 0-byte attachment", () => {
    assert.match(attachmentError(file("empty.pdf", 0))!, /empty/);
  });

  it("rejects a file with no extension", () => {
    assert.ok(attachmentError(file("README", 100)));
  });
});

describe("formatBytes", () => {
  it("reads naturally at each scale", () => {
    assert.equal(formatBytes(512), "512 B");
    assert.equal(formatBytes(2048), "2 KB");
    assert.equal(formatBytes(10 * 1024 * 1024), "10.0 MB");
  });
});

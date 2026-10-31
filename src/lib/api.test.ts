import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";

process.env.NEXT_PUBLIC_API_BASE_URL ??= "http://localhost:9420";

describe("api client", () => {
  const send = async (data: unknown) => {
    const { default: api } = await import("./api");
    let seen: InternalAxiosRequestConfig | undefined;
    const adapter: AxiosAdapter = async (config) => {
      seen = config;
      return { data: {}, status: 200, statusText: "OK", headers: {}, config };
    };
    await api.post("/x", data, { adapter });
    return seen!;
  };

  it("leaves FormData as FormData, so arrays and files reach the server as multipart", async () => {
    const form = new FormData();
    form.append("companyIds", '["a"]');
    const seen = await send(form);
    assert.ok(seen.data instanceof FormData);
    assert.doesNotMatch(String(seen.headers.getContentType()), /json/);
  });

  it("still sends plain objects as JSON", async () => {
    const seen = await send({ a: 1 });
    assert.equal(seen.data, '{"a":1}');
    assert.match(String(seen.headers.getContentType()), /application\/json/);
  });
});

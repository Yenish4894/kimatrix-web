import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { v, errorMap, newPasswordSchema } from "./validation";

describe("v.object", () => {
  const schema = v.object({
    name: v.string().min(2).required().messages({ "string.empty": "Name required", "string.min": "Too short" }),
    email: v.string().email().required().messages({ "string.email": "Bad email" }),
    postal: v.string().max(4).allow("").optional(),
    password: newPasswordSchema("Password required"),
    confirm: v.string().valid(v.ref("password")).required().messages({ "any.only": "No match" }),
    terms: v.boolean().valid(true).required().messages({ "any.only": "Accept terms" }),
    promo: v.boolean().optional(),
  });

  it("passes a valid form", () => {
    const r = schema.validate({
      name: "Jo", email: "a@b.co", postal: "", password: "Abcdef1!", confirm: "Abcdef1!", terms: true,
    });
    assert.equal(r.error, undefined);
  });

  it("reports one message per field with abortEarly false", () => {
    const r = schema.validate(
      { name: "", email: "nope", postal: "12345", password: "short", confirm: "x", terms: false },
      { abortEarly: false },
    );
    assert.deepEqual(errorMap(r), {
      name: "Name required",
      email: "Bad email",
      postal: '"postal" is invalid',
      password: "Password must be at least 8 characters",
      confirm: "No match",
      terms: "Accept terms",
    });
  });

  it("stops at the first error by default", () => {
    const r = schema.validate({ name: "", email: "" });
    assert.equal(r.error?.details.length, 1);
  });

  it("allows passwords up to 128 characters", () => {
    const ok = "Aa1!" + "x".repeat(124);
    const tooLong = ok + "x";
    const s = v.object({ p: newPasswordSchema("req") });
    assert.equal(s.validate({ p: ok }).error, undefined);
    assert.equal(errorMap(s.validate({ p: tooLong })).p, "Password must be at most 128 characters");
  });
});

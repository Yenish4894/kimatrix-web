/**
 * A tiny form validator with the subset of Joi's API the auth and settings forms use.
 *
 * Joi is about 53 KB gzipped and was shipped in the login, register, password-reset
 * and settings bundles only to check a handful of string lengths and patterns (FE-15).
 * This keeps the call sites almost unchanged — `v.object({...}).validate(form,
 * { abortEarly: false })` returns `{ error: { details: [{ path, message }] } }` just as
 * Joi did — at a few hundred bytes.
 *
 * Semantics kept from Joi, because the forms rely on them:
 * - An empty string is "string.empty" unless `.allow("")` is set.
 * - An absent value is "any.required" only when `.required()` is set.
 * - `.valid(...)` reports "any.only"; `v.ref("field")` compares against a sibling.
 * Unlike Joi, each field reports only its first failing rule — every form here shows
 * one message per field anyway.
 */

export interface ValidationDetail {
  path: string[];
  message: string;
  type: string;
}

export interface ValidationResult {
  error?: { details: ValidationDetail[] };
}

interface Ref {
  __ref: string;
}

type Messages = Record<string, string>;
type Rule = { type: string; test: (value: unknown, siblings: Record<string, unknown>) => boolean };

// Deliberately permissive, like Joi's `email({ tlds: { allow: false } })`: one "@",
// something on both sides, a dot in the domain, no spaces. The server re-validates.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

abstract class BaseSchema<T extends BaseSchema<T>> {
  protected rules: Rule[] = [];
  protected msgs: Messages = {};
  protected isRequired = false;
  protected allowed: unknown[] = [];

  required(): T {
    this.isRequired = true;
    return this as unknown as T;
  }

  optional(): T {
    this.isRequired = false;
    return this as unknown as T;
  }

  allow(...values: unknown[]): T {
    this.allowed.push(...values);
    return this as unknown as T;
  }

  valid(...values: Array<unknown | Ref>): T {
    this.rules.push({
      type: "any.only",
      test: (value, siblings) =>
        values.some((expected) =>
          expected && typeof expected === "object" && "__ref" in expected
            ? value === siblings[(expected as Ref).__ref]
            : value === expected,
        ),
    });
    return this as unknown as T;
  }

  messages(messages: Messages): T {
    this.msgs = { ...this.msgs, ...messages };
    return this as unknown as T;
  }

  protected abstract typeCheck(value: unknown): string | null;
  protected isEmpty(value: unknown): boolean {
    return value === undefined || value === null;
  }

  /** The error type for this value, or null when it passes. */
  check(value: unknown, siblings: Record<string, unknown>): string | null {
    if (value === undefined) return this.isRequired ? "any.required" : null;
    if (this.allowed.includes(value)) return null;
    const typeError = this.typeCheck(value);
    if (typeError) return typeError;
    for (const rule of this.rules) {
      if (!rule.test(value, siblings)) return rule.type;
    }
    return null;
  }

  message(type: string, key: string): string {
    return this.msgs[type] ?? (type === "any.required" || type === "string.empty"
      ? `"${key}" is required`
      : `"${key}" is invalid`);
  }
}

class StringSchema extends BaseSchema<StringSchema> {
  protected typeCheck(value: unknown): string | null {
    if (typeof value !== "string") return "string.base";
    if (value === "") return "string.empty";
    return null;
  }

  min(n: number): StringSchema {
    this.rules.push({ type: "string.min", test: (v) => (v as string).length >= n });
    return this;
  }

  max(n: number): StringSchema {
    this.rules.push({ type: "string.max", test: (v) => (v as string).length <= n });
    return this;
  }

  pattern(re: RegExp): StringSchema {
    this.rules.push({ type: "string.pattern.base", test: (v) => re.test(v as string) });
    return this;
  }

  email(): StringSchema {
    this.rules.push({ type: "string.email", test: (v) => EMAIL.test(v as string) });
    return this;
  }
}

class BooleanSchema extends BaseSchema<BooleanSchema> {
  protected typeCheck(value: unknown): string | null {
    return typeof value === "boolean" ? null : "boolean.base";
  }
}

type AnySchema = StringSchema | BooleanSchema;

class ObjectSchema {
  constructor(private readonly shape: Record<string, AnySchema>) {}

  validate(value: Record<string, unknown>, options: { abortEarly?: boolean } = {}): ValidationResult {
    const abortEarly = options.abortEarly ?? true;
    const details: ValidationDetail[] = [];
    for (const [key, schema] of Object.entries(this.shape)) {
      const type = schema.check(value[key], value);
      if (!type) continue;
      details.push({ path: [key], type, message: schema.message(type, key) });
      if (abortEarly) break;
    }
    return details.length ? { error: { details } } : {};
  }
}

export const v = {
  string: () => new StringSchema(),
  boolean: () => new BooleanSchema(),
  object: (shape: Record<string, AnySchema>) => new ObjectSchema(shape),
  ref: (key: string): Ref => ({ __ref: key }),
};

/** Maps a result to `{ field: firstMessage }`, the shape every form keeps in state. */
export function errorMap(result: ValidationResult): Record<string, string> {
  const out: Record<string, string> = {};
  for (const d of result.error?.details ?? []) {
    const key = d.path[0]!;
    if (!out[key]) out[key] = d.message;
  }
  return out;
}

// ─── Password rules (API-5 / FE-8) ─────────────────────────────────────────

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const PASSWORD_HELP = `${PASSWORD_MIN}–${PASSWORD_MAX} characters, with a lowercase and an uppercase letter, a number and a special character`;

/**
 * The rule for a NEW password (register, reset, change). Never used on the login form:
 * login must accept whatever the account already has, including passwords set before
 * these rules existed.
 */
export function newPasswordSchema(emptyMessage: string): StringSchema {
  return v
    .string()
    .min(PASSWORD_MIN)
    .max(PASSWORD_MAX)
    .pattern(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/)
    .required()
    .messages({
      "string.empty": emptyMessage,
      "any.required": emptyMessage,
      "string.min": `Password must be at least ${PASSWORD_MIN} characters`,
      "string.max": `Password must be at most ${PASSWORD_MAX} characters`,
      "string.pattern.base": "Must include lowercase, uppercase, number, and special character",
    });
}

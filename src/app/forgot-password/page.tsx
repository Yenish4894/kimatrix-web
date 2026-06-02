"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button, Input } from "@/components/ui";
import { authService } from "@/services";
import { parseApiError, errorMessageWithId } from "@/lib/errors";
import Joi from "joi";

const schema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    "string.empty": "Email is required",
    "string.email": "Enter a valid email address",
  }),
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const { error: validationError } = schema.validate({ email });
    if (validationError) {
      setError(validationError.details[0]?.message || "Invalid email");
      return;
    }
    setError("");
    setGeneralError("");
    setIsSubmitting(true);

    try {
      await authService.requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      const parsed = parseApiError(err);
      // 429 rate-limited
      if (parsed.status === 429) {
        setGeneralError(`Too many requests. Try again in ${parsed.retryAfterSeconds ?? 60}s.`);
      } else {
        setGeneralError(errorMessageWithId(parsed));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="Check Your Email" subtitle="We've sent a password reset link">
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-success-100 flex items-center justify-center">
            <svg className="h-8 w-8 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-600">
            If an account exists for <strong>{email}</strong>, a reset link has been sent.
            The link expires in 15 minutes.
          </p>
          <Link href="/login">
            <Button variant="secondary" className="mt-4">Back to Login</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email to receive a reset link">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="company@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
          error={error}
        />

        {generalError && (
          <p className="text-sm text-error-500 bg-error-50 border border-error-100 rounded-lg p-3">
            {generalError}
          </p>
        )}

        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Send Reset Link
        </Button>

        <p className="text-center text-sm text-slate-500">
          Remember your password?{" "}
          <Link href="/login" className="text-primary-600 hover:underline font-medium">Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

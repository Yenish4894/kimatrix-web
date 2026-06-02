"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button, Input } from "@/components/ui";
import { authService } from "@/services";
import { parseApiError, errorMessageWithId } from "@/lib/errors";
import Joi from "joi";

const schema = Joi.object({
  newPassword: Joi.string().min(8).max(128).pattern(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters",
    "string.pattern.base": "Must include lowercase, uppercase, and number",
  }),
  confirmNewPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages({
    "string.empty": "Please confirm your password",
    "any.only": "Passwords do not match",
  }),
});

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ newPassword: "", confirmNewPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <AuthLayout title="Invalid Link" subtitle="This password reset link is missing its token">
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-error-100 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-error-500" />
          </div>
          <p className="text-slate-600">The reset link is invalid. Request a new one.</p>
          <Link href="/forgot-password">
            <Button variant="primary" className="mt-2">Request New Link</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const validate = () => {
    const { error } = schema.validate(form, { abortEarly: false });
    if (!error) { setErrors({}); return true; }
    const newErrors: Record<string, string> = {};
    error.details.forEach((d) => {
      const key = d.path[0] as string;
      newErrors[key] = d.message;
    });
    setErrors(newErrors);
    return false;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setGeneralError("");
    setIsSubmitting(true);

    try {
      await authService.confirmPasswordReset({
        token,
        newPassword: form.newPassword,
        confirmNewPassword: form.confirmNewPassword,
      });
      setSuccess(true);
      toast.success("Password reset successfully");
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.status === 401) {
        setGeneralError("This reset link is invalid or has expired. Please request a new one.");
      } else if (parsed.message.toLowerCase().includes("breach")) {
        setErrors({ newPassword: "This password has appeared in a known data breach. Choose another." });
      } else {
        setGeneralError(errorMessageWithId(parsed));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  if (success) {
    return (
      <AuthLayout title="Password Reset" subtitle="Your password has been updated">
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-success-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-success-500" />
          </div>
          <p className="text-slate-600">Your password has been reset. Redirecting to login...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Your Password" subtitle="Choose a new strong password">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="New Password"
          name="newPassword"
          type="password"
          placeholder="8+ chars, upper, lower, digit"
          value={form.newPassword}
          onChange={handleChange}
          error={errors.newPassword}
          autoComplete="new-password"
        />
        <Input
          label="Confirm New Password"
          name="confirmNewPassword"
          type="password"
          placeholder="Re-enter new password"
          value={form.confirmNewPassword}
          onChange={handleChange}
          error={errors.confirmNewPassword}
          autoComplete="new-password"
        />

        {generalError && (
          <p className="text-sm text-error-500 bg-error-50 border border-error-100 rounded-lg p-3">
            {generalError}
          </p>
        )}

        <Button type="submit" fullWidth isLoading={isSubmitting}>Reset Password</Button>

        <p className="text-center text-sm text-slate-500">
          <Link href="/login" className="text-primary-600 hover:underline font-medium">Back to Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}

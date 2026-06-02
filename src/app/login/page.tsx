"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { ShieldOff } from "lucide-react";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button, Input } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login } from "@/store/slices/authSlice";
import { parseApiError, errorMessageWithId } from "@/lib/errors";
import Joi from "joi";

const schema = Joi.object({
  identifier: Joi.string().required().messages({
    "string.empty": "Email or username is required",
  }),
  password: Joi.string().min(8).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters",
  }),
});

export default function LoginPage() {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number>(0);
  const [deactivatedMessage, setDeactivatedMessage] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const router = useRouter();

  // Countdown for rate limit UI
  useEffect(() => {
    if (rateLimitRemaining <= 0) return;
    const t = setTimeout(() => setRateLimitRemaining((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [rateLimitRemaining]);

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
    if (isLoading || rateLimitRemaining > 0) return;
    if (!validate()) return;

    setDeactivatedMessage(null);

    try {
      const result = await dispatch(login(form)).unwrap();
      toast.success("Login successful");

      if (result.user.userType === "super_admin") {
        router.push("/admin/dashboard");
      } else if (result.companyIsActive === false) {
        // Pending company — has tokens, must subscribe before accessing data
        router.push("/company/billing");
      } else {
        router.push("/company/dashboard");
      }
    } catch (err) {
      const parsed = parseApiError(err);

      if (parsed.status === 429) {
        const seconds = parsed.retryAfterSeconds ?? 60;
        setRateLimitRemaining(seconds);
        toast.error(`Too many attempts. Try again in ${seconds}s.`);
        return;
      }

      // 403 means admin-deactivated (not pending — pending companies get 200 now)
      if (parsed.status === 403) {
        setDeactivatedMessage(parsed.message);
        return;
      }

      // Default: 401 (Invalid credentials) or anything else
      toast.error(errorMessageWithId(parsed));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (deactivatedMessage) setDeactivatedMessage(null);
  };

  const disabled = isLoading || rateLimitRemaining > 0;

  return (
    <AuthLayout title="Welcome Back" subtitle="Login to your account">
      <form onSubmit={handleSubmit} className="space-y-5">
        {deactivatedMessage && (
          <div className="rounded-xl border border-error-100 bg-error-50/60 p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-error-100 flex items-center justify-center shrink-0">
                <ShieldOff className="h-4 w-4 text-error-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-error-800">Account deactivated</p>
                <p className="text-sm text-error-700/90 mt-1 leading-relaxed">{deactivatedMessage}</p>
              </div>
            </div>
          </div>
        )}

        <Input
          label="Email or Username"
          name="identifier"
          placeholder="admin@example.com or username"
          value={form.identifier}
          onChange={handleChange}
          error={errors.identifier}
          autoComplete="username"
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth isLoading={isLoading} disabled={disabled}>
          {rateLimitRemaining > 0 ? `Try again in ${rateLimitRemaining}s` : "Login"}
        </Button>

        <p className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary-600 hover:underline font-medium">
            Register
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

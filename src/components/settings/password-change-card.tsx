"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Lock } from "lucide-react";
import Joi from "joi";
import { Card, CardContent, CardHeader, Input, Button } from "@/components/ui";
import { authService } from "@/services";
import { TokenStorage } from "@/lib/tokens";
import { useAppDispatch } from "@/store/hooks";
import { clearAuth } from "@/store/slices/authSlice";
import { parseApiError, fieldErrorsFromDetails, errorMessageWithId } from "@/lib/errors";

const schema = Joi.object({
  currentPassword: Joi.string().min(1).max(128).required().messages({
    "string.empty": "Enter your current password",
  }),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      "string.empty": "Enter a new password",
      "string.min": "Password must be at least 8 characters",
      "string.pattern.base": "Must include lowercase, uppercase, and a number",
    }),
  confirmNewPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages({
    "any.only": "Passwords do not match",
    "string.empty": "Re-enter your new password",
  }),
});

const initialForm = { currentPassword: "", newPassword: "", confirmNewPassword: "" };

export function PasswordChangeCard() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const validate = () => {
    const { error } = schema.validate(form, { abortEarly: false });
    if (!error) { setErrors({}); return true; }
    const next: Record<string, string> = {};
    error.details.forEach((d) => {
      const k = d.path[0] as string;
      if (!next[k]) next[k] = d.message;
    });
    setErrors(next);
    return false;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await authService.changePassword(form);
      toast.success("Password changed. Please log in again.");
      // BE revoked all refresh tokens — clear local state and route to login
      TokenStorage.clear();
      dispatch(clearAuth());
      router.replace("/login");
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.details?.length) {
        setErrors(fieldErrorsFromDetails(parsed.details));
        toast.error(parsed.message);
      } else if (/current password/i.test(parsed.message)) {
        setErrors({ currentPassword: parsed.message });
        toast.error(parsed.message);
      } else if (/breach/i.test(parsed.message)) {
        setErrors({ newPassword: "This password has appeared in a known data breach. Choose another." });
        toast.error("Password is not secure. Please choose another.");
      } else {
        toast.error(errorMessageWithId(parsed));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-h4 font-heading font-semibold text-slate-800 flex items-center gap-2">
          <Lock className="h-4 w-4 text-slate-400" />
          Change Password
        </h3>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Current Password"
            name="currentPassword"
            type="password"
            value={form.currentPassword}
            onChange={handleChange}
            error={errors.currentPassword}
            autoComplete="current-password"
          />
          <Input
            label="New Password"
            name="newPassword"
            type="password"
            value={form.newPassword}
            onChange={handleChange}
            error={errors.newPassword}
            helperText="8+ chars, lowercase, uppercase, and a digit"
            autoComplete="new-password"
          />
          <Input
            label="Confirm New Password"
            name="confirmNewPassword"
            type="password"
            value={form.confirmNewPassword}
            onChange={handleChange}
            error={errors.confirmNewPassword}
            autoComplete="new-password"
          />

          <div className="text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-lg p-3">
            For security, you&apos;ll be signed out of all devices and asked to log in again.
          </div>

          <Button type="submit" isLoading={isSubmitting}>
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

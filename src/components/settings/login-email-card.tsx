"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { AtSign, MailCheck } from "lucide-react";
import { Button, Card, CardContent, CardHeader, Input, Modal } from "@/components/ui";
import { authService } from "@/services";
import { useAppSelector } from "@/store/hooks";
import { parseApiError, errorMessageWithId, fieldErrorsFromDetails } from "@/lib/errors";

// Deliberately loose: the server is the judge of what an address is. This only catches
// the typo that would otherwise cost a round trip.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialForm = { newEmail: "", currentPassword: "" };

/**
 * The login email, and changing it.
 *
 * The change is two-step: the request sends a link to the NEW address, and nothing
 * changes until it is opened (see /confirm-email-change). That is why success here says
 * "check your new inbox" instead of showing the new address as current — it is not yet.
 * The current password is required so a borrowed, unlocked session cannot move the
 * account to someone else's inbox.
 */
export function LoginEmailCard() {
  const currentEmail = useAppSelector((state) => state.auth.user?.email);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setForm(initialForm);
    setErrors({});
    setSentTo(null);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const email = form.newEmail.trim();
    if (!email) next.newEmail = "Enter your new email address";
    else if (!EMAIL.test(email)) next.newEmail = "Enter a valid email address";
    else if (currentEmail && email.toLowerCase() === currentEmail.toLowerCase()) {
      next.newEmail = "That is already your login email";
    }
    if (!form.currentPassword) next.currentPassword = "Enter your current password";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    try {
      await authService.requestEmailChange({
        newEmail: form.newEmail.trim(),
        currentPassword: form.currentPassword,
      });
      setSentTo(form.newEmail.trim());
      setForm(initialForm);
    } catch (err) {
      const parsed = parseApiError(err);
      const fields = fieldErrorsFromDetails(parsed.details);
      if (Object.keys(fields).length) {
        setErrors(fields);
      } else if (/password/i.test(parsed.message)) {
        setErrors({ currentPassword: parsed.message });
      } else if (parsed.status === 409 || /email/i.test(parsed.message)) {
        // e.g. the address belongs to another account.
        setErrors({ newEmail: parsed.message });
      } else {
        toast.error(errorMessageWithId(parsed));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-h4 font-heading font-semibold text-slate-800 flex items-center gap-2">
          <AtSign className="h-4 w-4 text-slate-400" aria-hidden="true" />
          Login email
        </h3>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">You sign in with</p>
          <p className="text-sm font-medium text-slate-800 break-all">{currentEmail ?? "—"}</p>
        </div>
        <Button variant="secondary" onClick={() => setOpen(true)} className="shrink-0">
          Change
        </Button>
      </CardContent>

      <Modal
        open={open}
        onClose={close}
        title={sentTo ? "Check your new inbox" : "Change login email"}
        footer={
          sentTo ? (
            <Button onClick={close}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={close} disabled={submitting}>Cancel</Button>
              <Button type="submit" form="login-email-form" isLoading={submitting}>
                Send confirmation link
              </Button>
            </>
          )
        }
      >
        {sentTo ? (
          <div className="text-center space-y-3 py-2" role="status">
            <div className="mx-auto h-14 w-14 rounded-full bg-success-100 flex items-center justify-center" aria-hidden="true">
              <MailCheck className="h-7 w-7 text-success-600" />
            </div>
            <p className="text-slate-700">
              Check your new inbox to confirm. We sent a link to{" "}
              <strong className="break-all">{sentTo}</strong>.
            </p>
            <p className="text-sm text-slate-500">
              Until you open it, you keep signing in with{" "}
              <span className="break-all">{currentEmail}</span>. Once confirmed, you&apos;ll be
              signed out everywhere and log in with the new address.
            </p>
          </div>
        ) : (
          <form id="login-email-form" onSubmit={submit} noValidate className="space-y-4">
            <Input
              label="New email"
              name="newEmail"
              type="email"
              autoComplete="email"
              value={form.newEmail}
              onChange={onChange}
              error={errors.newEmail}
            />
            <Input
              label="Current password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={onChange}
              error={errors.currentPassword}
              helperText="Required to confirm it's you."
            />
          </form>
        )}
      </Modal>
    </Card>
  );
}

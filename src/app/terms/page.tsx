import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900">Terms of Service</h1>
        <p className="text-sm text-slate-500 mt-2">Last updated: April 2026</p>

        <div className="mt-8 prose prose-slate max-w-none">
          <p className="text-slate-600">
            These terms govern your use of KIMates (the &ldquo;Service&rdquo;). By registering a
            business account or submitting purchase information via a KIMates QR code, you agree
            to these terms.
          </p>

          <h2 className="text-xl font-heading font-semibold text-slate-800 mt-8 mb-3">1. Service Description</h2>
          <p className="text-slate-600">
            KIMates is a QR-based customer purchase tracking platform for businesses. Businesses
            subscribe, receive a unique QR code, and collect anonymized purchase records from customers.
          </p>

          <h2 className="text-xl font-heading font-semibold text-slate-800 mt-8 mb-3">2. Accounts & Responsibilities</h2>
          <p className="text-slate-600">
            You are responsible for keeping your login credentials secure and for all activity
            performed under your account. Notify us immediately of any unauthorized use.
          </p>

          <h2 className="text-xl font-heading font-semibold text-slate-800 mt-8 mb-3">3. Acceptable Use</h2>
          <p className="text-slate-600">
            You must not misuse the Service (e.g., submitting false purchase data, attempting to
            access other businesses&apos; records, or abusing rate limits).
          </p>

          <h2 className="text-xl font-heading font-semibold text-slate-800 mt-8 mb-3">4. Data & Privacy</h2>
          <p className="text-slate-600">
            See our <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link> for
            details on what we collect and how we use it.
          </p>

          <h2 className="text-xl font-heading font-semibold text-slate-800 mt-8 mb-3">5. Termination</h2>
          <p className="text-slate-600">
            We may suspend or deactivate your account for violations of these terms. You may stop
            using the Service at any time.
          </p>

          <div className="mt-12 p-4 bg-warning-50 border border-warning-100 rounded-lg text-sm text-warning-700">
            <strong>Placeholder:</strong> This is a placeholder document. The final, legally-reviewed
            Terms of Service will be published before public launch.
          </div>
        </div>
      </div>
    </div>
  );
}

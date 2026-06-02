import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mt-2">Last updated: April 2026</p>

        <div className="mt-8 prose prose-slate max-w-none">
          <p className="text-slate-600">
            This policy explains what KIMates collects, why we collect it, and how we handle it.
          </p>

          <h2 className="text-xl font-heading font-semibold text-slate-800 mt-8 mb-3">1. Information We Collect</h2>
          <p className="text-slate-600"><strong>From Businesses:</strong></p>
          <ul className="list-disc list-inside text-slate-600 space-y-1">
            <li>Company name, address, registration number</li>
            <li>Contact email, phone, WhatsApp number</li>
            <li>Login email and username</li>
            <li>Password (hashed, never stored in plaintext)</li>
          </ul>
          <p className="text-slate-600 mt-4"><strong>From Customers (via QR submission):</strong></p>
          <ul className="list-disc list-inside text-slate-600 space-y-1">
            <li>Mobile number, full name</li>
            <li>Vehicle registration (fuel stations only)</li>
            <li>Invoice number and amount</li>
            <li>Optional: geolocation (only with explicit consent)</li>
            <li>Technical metadata: IP address, browser user-agent, timestamp</li>
          </ul>

          <h2 className="text-xl font-heading font-semibold text-slate-800 mt-8 mb-3">2. How We Use It</h2>
          <ul className="list-disc list-inside text-slate-600 space-y-1">
            <li>Provide purchase tracking to businesses</li>
            <li>Authenticate user accounts and protect against fraud</li>
            <li>Send promotional emails (only if explicitly opted in)</li>
            <li>Debug issues and improve the Service</li>
          </ul>

          <h2 className="text-xl font-heading font-semibold text-slate-800 mt-8 mb-3">3. Data Sharing</h2>
          <p className="text-slate-600">
            We do not sell or rent your data. Customer purchase data is visible only to the business
            that owns the QR code the customer scanned.
          </p>

          <h2 className="text-xl font-heading font-semibold text-slate-800 mt-8 mb-3">4. Security</h2>
          <p className="text-slate-600">
            Passwords are hashed. Tokens rotate on refresh. Suspicious refresh-token reuse triggers
            automatic session revocation. HTTPS is required in production.
          </p>

          <h2 className="text-xl font-heading font-semibold text-slate-800 mt-8 mb-3">5. Your Rights</h2>
          <p className="text-slate-600">
            You may request deletion of your account and associated data at any time by contacting{" "}
            <a href="mailto:support@kimates.com" className="text-primary-600 hover:underline">support@kimates.com</a>.
          </p>

          <div className="mt-12 p-4 bg-warning-50 border border-warning-100 rounded-lg text-sm text-warning-700">
            <strong>Placeholder:</strong> This is a placeholder document. The final, legally-reviewed
            Privacy Policy will be published before public launch.
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy",
};

const h2 = "text-xl font-heading font-semibold text-slate-800 mt-8 mb-3";
const p = "text-slate-600";
const ul = "list-disc pl-5 space-y-1 text-slate-600";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 mb-8">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mt-2">Last updated: 8 November 2026</p>

        <div className="mt-8 prose prose-slate max-w-none">
          <p className={p}>
            This policy explains what KIMates collects, why, who it is shared with, how long it is kept,
            and the choices you have. It covers businesses that use KIMates and the customers who submit
            purchases through a business&apos;s QR code.
          </p>

          <h2 className={h2}>1. Who is responsible</h2>
          <p className={p}>
            For business accounts, KIMates decides how that data is used. For customer purchase details,
            the business whose QR code was scanned decides what the data is for; KIMates stores and
            processes it on the business&apos;s behalf. Customers who want to exercise their rights can
            contact the business directly, or us at{" "}
            <a href="mailto:info@kimates.com" className="text-primary-700 hover:underline">info@kimates.com</a>.
          </p>

          <h2 className={h2}>2. What we collect</h2>
          <p className={p}><strong>From businesses:</strong></p>
          <ul className={ul}>
            <li>Company name, registration number, business type and address</li>
            <li>Contact email, phone and optional WhatsApp number</li>
            <li>Login email, username and password (stored only as a one-way hash)</li>
            <li>Plan, trial and payment history, and whether you agreed to promotional email</li>
          </ul>
          <p className={`${p} mt-4`}><strong>From customers submitting a purchase:</strong></p>
          <ul className={ul}>
            <li>Mobile number and full name</li>
            <li>Vehicle registration (fuel stations only)</li>
            <li>Invoice number and amount</li>
            <li>Location, only if you choose to attach it</li>
            <li>IP address and browser details, used to prevent fraud and never shared with the business</li>
          </ul>
          <p className={`${p} mt-4`}><strong>Everyone:</strong></p>
          <ul className={ul}>
            <li>
              Your browser stores your login session and a few preferences (such as sound on or off) on
              your device. We do not use advertising or tracking cookies.
            </li>
            <li>We count daily website visits as a single number; no visitor is identified.</li>
          </ul>

          <h2 className={h2}>3. How we use it</h2>
          <ul className={ul}>
            <li>To run the Service: record purchases, show businesses their customers and reports, and run lucky draws</li>
            <li>To create and secure accounts, confirm email addresses, and allow one trial per email and phone number</li>
            <li>To take payments and send receipts, invoices and account notices</li>
            <li>To send promotional email, only to businesses that agreed to it</li>
            <li>To prevent fraud and abuse, and to fix problems</li>
          </ul>

          <h2 className={h2}>4. What businesses can see</h2>
          <p className={p}>
            A business sees the purchases submitted through its own QR code and the customer details that
            came with them, and can export them. It cannot see other businesses&apos; data. When a
            business shows its lucky draw on a screen, the winner&apos;s name and a partly hidden phone
            number (for example ••••4567) are displayed.
          </p>

          <h2 className={h2}>5. Who we share it with</h2>
          <p className={p}>
            We do not sell or rent personal data. We use these service providers to run KIMates, each
            only for the purpose listed:
          </p>
          <ul className={ul}>
            <li><strong>PayPal</strong>: takes payments. Card details are entered with PayPal and never reach us.</li>
            <li><strong>Resend</strong>: sends our emails (verification, receipts, notices).</li>
            <li><strong>Cloudflare Turnstile</strong>: checks that a signup is made by a person, not a bot.</li>
            <li><strong>OVH</strong>: hosts our servers and database.</li>
          </ul>
          <p className={`${p} mt-4`}>
            These providers may process data outside your country. We may also disclose data where the
            law requires it.
          </p>

          <h2 className={h2}>6. How long we keep it</h2>
          <ul className={ul}>
            <li>
              Customer and purchase data is kept while the business has an active plan, trial or free
              access, and is permanently erased 7 days after that access ends.
            </li>
            <li>
              If a business closes its account, its customer and purchase data is erased 7 days after
              the request, and its account details are anonymised.
            </li>
            <li>Lucky-draw results keep the winner&apos;s name and partly hidden phone number as a record of the draw.</li>
            <li>Payment and invoice records are kept as required for accounting.</li>
            <li>Signups that never confirm their email are deleted automatically.</li>
            <li>Server logs are kept for up to 14 days, and database backups for 14 days.</li>
          </ul>

          <h2 className={h2}>7. Security</h2>
          <p className={p}>
            All traffic is encrypted (HTTPS). Passwords are stored only as hashes. Sessions are short-lived
            and are revoked if a stolen session is detected. Access to customer data is limited to the
            business it belongs to.
          </p>

          <h2 className={h2}>8. Your rights</h2>
          <p className={p}>
            Depending on where you live, you can ask to see the personal data we hold about you, correct
            it, have it deleted, or object to its use. Businesses can update their details and export or
            delete their data from Settings. Anyone can make a request by emailing{" "}
            <a href="mailto:info@kimates.com" className="text-primary-700 hover:underline">info@kimates.com</a>.
            You can also complain to the data protection authority in your country.
          </p>

          <h2 className={h2}>9. Changes</h2>
          <p className={p}>
            We may update this policy. The date at the top shows the latest version, and we will tell
            business account holders by email about significant changes. See also our{" "}
            <Link href="/terms" className="text-primary-700 hover:underline">Terms of Service</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

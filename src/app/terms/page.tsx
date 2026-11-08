import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service",
};

const h2 = "text-xl font-heading font-semibold text-slate-800 mt-8 mb-3";
const p = "text-slate-600";
const ul = "list-disc pl-5 space-y-1 text-slate-600";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 mb-8">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900">Terms of Service</h1>
        <p className="text-sm text-slate-500 mt-2">Last updated: 8 November 2026</p>

        <div className="mt-8 prose prose-slate max-w-none">
          <p className={p}>
            These terms govern your use of KIMates (the &ldquo;Service&rdquo;), operated by KIMates
            (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By registering a business account, or by submitting a
            purchase through a KIMates QR code, you agree to them. If you register on behalf of a
            business, you confirm you are authorised to bind that business.
          </p>

          <h2 className={h2}>1. The Service</h2>
          <p className={p}>
            KIMates lets businesses (such as fuel stations and shops) record their customers&apos;
            purchases. A business gets a QR code; its customers scan it and enter their purchase details
            without creating an account. The business sees those records, customer totals and reports,
            and can run a lucky draw among its customers.
          </p>

          <h2 className={h2}>2. Business accounts</h2>
          <ul className={ul}>
            <li>You must give accurate business and contact details and keep them up to date.</li>
            <li>
              You are responsible for keeping your login secure and for everything done under your
              account. Tell us at once at{" "}
              <a href="mailto:info@kimates.com" className="text-primary-700 hover:underline">info@kimates.com</a>{" "}
              if you suspect unauthorised use.
            </li>
            <li>Your account becomes usable once you confirm your email address.</li>
          </ul>

          <h2 className={h2}>3. Trial</h2>
          <p className={p}>
            Confirming your email starts a trial whose length is shown when you sign up. Each email
            address and phone number can receive one trial only, ever. When the trial ends, the
            dashboard is locked until you buy a plan; billing, payments, data export and account
            settings remain available.
          </p>

          <h2 className={h2}>4. Plans and payment</h2>
          <ul className={ul}>
            <li>
              Plans give access for a fixed number of days. Prices are shown in US dollars on the
              billing page before you pay, and are paid once through PayPal. Plans do not renew
              automatically.
            </li>
            <li>Buying a plan while one is still running adds the new days after the current period ends.</li>
            <li>
              Lucky-draw spins can be bought separately. Bought spins can only be used during the period
              they were bought for (the current plan, trial or free access) and expire with it.
            </li>
            <li>
              We send a receipt with an invoice after each payment. We may change prices for future
              purchases; a change never affects a period you have already paid for.
            </li>
          </ul>

          <h2 className={h2}>5. Refunds</h2>
          <p className={p}>
            Payments are not refundable once the plan or spins have been delivered, except where the law
            requires otherwise or where we agree to a refund. If you believe you were charged in error,
            contact us within 14 days. If a payment is refunded or reversed, the access or spins it paid
            for are removed.
          </p>

          <h2 className={h2}>6. Lucky draw</h2>
          <p className={p}>
            The lucky draw is a tool the business runs for its own customers. Each eligible purchase in
            the current period is one entry, and the winner is picked at random by our servers. The
            business decides the prizes, is responsible for awarding them, and must make sure its draw
            complies with the laws that apply to it (including any rules on promotional competitions).
            When a draw is shown on a screen, only the winner&apos;s name and a partly hidden phone
            number are displayed.
          </p>

          <h2 className={h2}>7. Customers submitting purchases</h2>
          <p className={p}>
            If you submit a purchase through a QR code, you confirm the details are true and that the
            purchase is yours. Your details are shared with the business whose QR code you scanned. Each
            invoice number can be recorded once, and submissions are rate-limited to prevent abuse.
          </p>

          <h2 className={h2}>8. Acceptable use</h2>
          <p className={p}>
            You must not submit false purchase data, try to access other businesses&apos; records, abuse
            rate limits or the trial, interfere with the Service, or use it for anything unlawful. We may
            suspend or close an account that breaks these terms.
          </p>

          <h2 className={h2}>9. Ending your account and your data</h2>
          <p className={p}>
            You can close your account at any time from Settings. Closing an account, or letting a plan
            or trial lapse, starts a 7-day period after which the customer and purchase data collected
            for your business is permanently erased. Download anything you need before then; export
            stays available during that period. See the{" "}
            <Link href="/privacy" className="text-primary-700 hover:underline">Privacy Policy</Link> for
            details.
          </p>

          <h2 className={h2}>10. Availability and liability</h2>
          <p className={p}>
            We work to keep the Service available and your data safe, but provide it &ldquo;as is&rdquo;
            without guarantees that it will be uninterrupted or error-free. To the extent the law allows,
            we are not liable for indirect or consequential losses, and our total liability for any claim
            is limited to the amount you paid us in the three months before it arose. Nothing in these
            terms limits rights you have under consumer law that cannot be excluded.
          </p>

          <h2 className={h2}>11. Changes</h2>
          <p className={p}>
            We may update these terms. The date at the top shows the latest version; for significant
            changes we will tell business account holders by email before they take effect.
          </p>

          <h2 className={h2}>12. Governing law</h2>
          <p className={p}>
            These terms are governed by the laws of the Republic of South Africa, without affecting any
            mandatory consumer protections of the country you live in.
          </p>

          <h2 className={h2}>13. Contact</h2>
          <p className={p}>
            Questions about these terms:{" "}
            <a href="mailto:info@kimates.com" className="text-primary-700 hover:underline">info@kimates.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

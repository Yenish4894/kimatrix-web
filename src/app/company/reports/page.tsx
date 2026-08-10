"use client";

import {memo, useState} from "react";

import {toast} from "react-toastify";
import {Trophy, Users, Download, FileText} from "lucide-react";
import {DashboardShell} from "@/components/layouts/dashboard-shell";
import {Button, Card, CardContent} from "@/components/ui";
import {useCurrencyFormatter} from "@/hooks/useCurrencyFormatter";
import {useCompanyProfile} from "@/hooks/useCompanyProfile";
import {companyService} from "@/services";
import {parseApiError} from "@/lib/errors";
// PDF generators are lazy-loaded on click — saves ~200KB from initial bundle.
// See handlers below for dynamic import().
import type { Customer } from "@/types";

// ─── Types ────────────────────────────────────────────────────

interface CustomerRow {
  customerId: string;
  fullName: string;
  mobile: string;
  vehicleNumber: string | null;
  totalSpend: number;
  purchaseCount: number;
  // ISO timestamp — most recent purchase. Used as tiebreaker when totals are equal.
  lastActivity: string;
}

// ─── Constants ────────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── Data fetchers ─────────────────────────────────────────────

/**
 * Hard ceiling on how many pages this report will pull.
 *
 * 100 pages x 100 rows = 10,000 customers. Beyond that the browser is the wrong tool
 * and the CSV export — which streams server-side in batches — is the right one. The
 * cap is surfaced to the user rather than silently truncating: a report that quietly
 * omits rows is worse than one that says it did.
 */
const MAX_REPORT_PAGES = 100;
const REPORT_PAGE_SIZE = 100;
/** Pages in flight at once. Enough to hide latency without flooding the API. */
const FETCH_CONCURRENCY = 6;

async function fetchAllCustomers(): Promise<{ customers: Customer[]; truncated: boolean }> {
  const fetchPage = (page: number) =>
    companyService.getCustomers({
      page,
      limit: REPORT_PAGE_SIZE,
      sortBy: "totalInvoiceAmount",
      sortOrder: "DESC",
    });

  // Page 1 tells us how many there are; everything after it can go out in parallel.
  // The previous version awaited each page before requesting the next, so a company
  // with 3,000 customers paid 30 sequential round trips of latency before the report
  // could render anything.
  const first = await fetchPage(1);
  const totalPages = Math.min(first.pagination.totalPages, MAX_REPORT_PAGES);
  const customers = [...first.items];

  for (let start = 2; start <= totalPages; start += FETCH_CONCURRENCY) {
    const batch: number[] = [];
    for (let p = start; p < start + FETCH_CONCURRENCY && p <= totalPages; p++) batch.push(p);
    const results = await Promise.all(batch.map(fetchPage));
    for (const r of results) customers.push(...r.items);
  }

  return { customers, truncated: first.pagination.totalPages > MAX_REPORT_PAGES };
}

// ─── Aggregation ──────────────────────────────────────────────

/**
 * Sort helper: by total spend DESC, then by latest activity DESC (tiebreaker).
 * Equal-spending customers are ordered by who purchased most recently.
 */
function compareRows(a: CustomerRow, b: CustomerRow): number {
  if (b.totalSpend !== a.totalSpend) return b.totalSpend - a.totalSpend;
  return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
}

// ─── Shared preview table ──────────────────────────────────────

/**
 * Memoized: the "All Customers" report loads every customer the company has, and this
 * table lives on a page with unrelated state (the month/year selects). Without memo,
 * changing the month re-rendered every row — 3,000 customers means 15,000 elements and
 * 3,000 `Intl.NumberFormat` calls for a dropdown that doesn't affect this table.
 *
 * Depends on `fmtCurrency` being referentially stable, which `useCurrencyFormatter`
 * now guarantees via `useCallback`.
 */
const PreviewTable = memo(function PreviewTable({ rows, ranked, fmtCurrency }: { rows: CustomerRow[]; ranked: boolean; fmtCurrency: (amount: string | number) => string }) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        <Users className="h-10 w-10 mx-auto mb-3 opacity-25" aria-hidden="true" />
        <p className="text-sm">No data available.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 w-10">#</th>
            <th className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</th>
            <th className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Mobile</th>
            <th className="py-2.5 px-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Purchases</th>
            <th className="py-2.5 px-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Total Spend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.customerId} className={`border-b border-slate-100 last:border-0 ${ranked && i < 3 ? "bg-primary-50/40" : ""}`}>
              <td className="py-3 px-3 text-base text-center">
                {ranked && i === 0 ? <span aria-hidden="true">🥇</span> : ranked && i === 1 ? <span aria-hidden="true">🥈</span> : ranked && i === 2 ? <span aria-hidden="true">🥉</span> : (
                  <span className="text-sm text-slate-500 font-mono">{i + 1}</span>
                )}
              </td>
              <td className="py-3 px-3 text-slate-700 font-medium">
                {row.fullName}
                {row.vehicleNumber && (
                  <span className="ml-2 text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                    {row.vehicleNumber}
                  </span>
                )}
              </td>
              <td className="py-3 px-3 text-slate-500 font-mono text-xs">{row.mobile}</td>
              <td className="py-3 px-3 text-right text-slate-600">{row.purchaseCount}</td>
              <td className="py-3 px-3 text-right font-semibold text-slate-800">{fmtCurrency(row.totalSpend)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

// ─── Page ──────────────────────────────────────────────────────

export default function ReportsPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  // Top 10 monthly state
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [top10Report, setTop10Report] = useState<CustomerRow[] | null>(null);
  const [top10Label, setTop10Label] = useState("");
  const [isGeneratingTop10, setIsGeneratingTop10] = useState(false);
  const [top10Error, setTop10Error] = useState<string | null>(null);

  // All customers state
  const [allReport, setAllReport] = useState<CustomerRow[] | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [allError, setAllError] = useState<string | null>(null);

  // Shared hook, not an inline useQuery on the same key: the hook sets
  // `retry: 1` because the access gate depends on this query, and an inline copy
  // silently inherits the default retry instead — whichever observer fetches
  // first decides, which made the gate\'s retry behaviour nondeterministic.
  const profileQ = useCompanyProfile();
  const companyName = profileQ.data?.name ?? "Your Company";
  const companyCountry = profileQ.data?.country ?? "";
  const fmtCurrency = useCurrencyFormatter();

  const handleGenerateTop10 = async () => {
    setIsGeneratingTop10(true);
    setTop10Error(null);
    setTop10Report(null);
    try {
      // One aggregated request. This used to page through every purchase in the month,
      // 100 rows at a time and sequentially, then sum them in the browser — a busy
      // month meant 100 round trips before anything rendered, with every row crossing
      // the wire only to be reduced to ten numbers. The database does the grouping now.
      //
      // Passing year/month rather than an ISO range also fixes a timezone bug: the old
      // code built `new Date(year, month, 1)` in LOCAL time and then called
      // .toISOString(), so in any timezone behind UTC the "1st" became the previous
      // month's last day and the report covered the wrong window.
      const report = await companyService.getMonthlyReport(selectedYear, selectedMonth + 1);
      setTop10Report(
        report.topCustomers.map((c) => ({
          customerId: c.customerId,
          fullName: c.fullName,
          mobile: c.mobile,
          vehicleNumber: c.vehicleNumber,
          totalSpend: Number.parseFloat(c.totalSpend),
          purchaseCount: c.purchaseCount,
          lastActivity: c.lastActivity,
        })),
      );
      setTop10Label(`${MONTHS[selectedMonth]} ${selectedYear}`);
    } catch (err) {
      setTop10Error(parseApiError(err).message);
    } finally {
      setIsGeneratingTop10(false);
    }
  };

  const handleGenerateAll = async () => {
    setIsGeneratingAll(true);
    setAllError(null);
    setAllReport(null);
    try {
      const { customers, truncated } = await fetchAllCustomers();
      if (truncated) {
        setAllError(
          `This report shows your top ${(MAX_REPORT_PAGES * REPORT_PAGE_SIZE).toLocaleString()} customers by spend. Use the CSV export in Settings to download all of them.`,
        );
      }
      // Re-sort client-side with tiebreaker — BE sorts by amount only, so
      // ties across page boundaries can land in arbitrary order.
      const rows = customers
        .map((c) => ({
          customerId: c.id,
          fullName: c.fullName,
          mobile: c.mobile,
          vehicleNumber: c.vehicleNumber,
          totalSpend: Number.parseFloat(c.totalInvoiceAmount),
          purchaseCount: c.submissionCount,
          lastActivity: c.lastSubmissionAt,
        }))
        .sort(compareRows);
      setAllReport(rows);
    } catch (err) {
      setAllError(parseApiError(err).message);
    } finally {
      setIsGeneratingAll(false);
    }
  };

  return (
    <DashboardShell title="Reports" requiredRole="company">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* ── Report 1: Top 10 monthly ── */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-heading font-semibold text-slate-800 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent-500" aria-hidden="true" />
              Top 10 Customers — Monthly
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Top 10 by spend within a selected month.
            </p>
          </div>

          <Card>
            <CardContent className="py-5">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Month</label>
                  <select
                    className="h-10 pl-3 pr-8 border border-slate-200 rounded-md text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  >
                    {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Year</label>
                  <select
                    className="h-10 pl-3 pr-8 border border-slate-200 rounded-md text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                  >
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <Button onClick={handleGenerateTop10} isLoading={isGeneratingTop10}>
                  <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                  Generate
                </Button>
              </div>
              {top10Error && <p className="mt-3 text-sm text-error-600">{top10Error}</p>}
            </CardContent>
          </Card>

          {top10Report && (
            <Card>
              <CardContent className="py-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      Top 10 — {top10Label}
                      {top10Report.length > 10 && (
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          ({top10Report.length} shown — includes {top10Report.length - 10} tied at the cutoff)
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{companyName}</p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      try {
                        const { generateTop10Pdf } = await import("@/lib/pdf/customer-reports");
                        await generateTop10Pdf(top10Report, top10Label, companyName, companyCountry);
                      } catch {
                        toast.error("Could not generate the PDF. Please try again.");
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                    Download PDF
                  </Button>
                </div>
                <PreviewTable rows={top10Report} ranked fmtCurrency={fmtCurrency} />
              </CardContent>
            </Card>
          )}
        </section>

        {/* ── Report 2: All customers ── */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-heading font-semibold text-slate-800 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary-600" aria-hidden="true" />
              All Customers — Full Report
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete customer list sorted by all-time total spend.
            </p>
          </div>

          <Card>
            <CardContent className="py-5">
              <div className="flex items-center gap-3">
                <Button onClick={handleGenerateAll} isLoading={isGeneratingAll}>
                  <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                  Generate Report
                </Button>
                <p className="text-xs text-slate-500">Fetches all customer records — may take a moment for large datasets.</p>
              </div>
              {allError && <p className="mt-3 text-sm text-error-600">{allError}</p>}
            </CardContent>
          </Card>

          {allReport && (
            <Card>
              <CardContent className="py-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      All Customers
                      <span className="ml-2 text-xs font-normal text-slate-500">({allReport.length} total)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{companyName} · All-time</p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      try {
                        const { generateAllCustomersPdf } = await import("@/lib/pdf/customer-reports");
                        await generateAllCustomersPdf(allReport, companyName, companyCountry);
                      } catch {
                        toast.error("Could not generate the PDF. Please try again.");
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                    Download PDF
                  </Button>
                </div>
                <PreviewTable rows={allReport} ranked={false} fmtCurrency={fmtCurrency} />
              </CardContent>
            </Card>
          )}
        </section>

      </div>
    </DashboardShell>
  );
}

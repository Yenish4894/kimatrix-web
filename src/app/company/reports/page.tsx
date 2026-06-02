"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Users, Download, FileText } from "lucide-react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Button, Card, CardContent } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { companyService } from "@/services";
import { parseApiError } from "@/lib/errors";
// PDF generators are lazy-loaded on click — saves ~200KB from initial bundle.
// See handlers below for dynamic import().
import type { Purchase, Customer } from "@/types";

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

async function fetchMonthPurchases(from: string, to: string): Promise<Purchase[]> {
  const all: Purchase[] = [];
  let page = 1;
  while (true) {
    const res = await companyService.getPurchases({ page, limit: 100, from, to });
    all.push(...res.items);
    if (page >= res.pagination.totalPages) break;
    page++;
  }
  return all;
}

async function fetchAllCustomers(): Promise<Customer[]> {
  const all: Customer[] = [];
  let page = 1;
  while (true) {
    const res = await companyService.getCustomers({
      page,
      limit: 100,
      sortBy: "totalInvoiceAmount",
      sortOrder: "DESC",
    });
    all.push(...res.items);
    if (page >= res.pagination.totalPages) break;
    page++;
  }
  return all;
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

/**
 * Tie-aware "Top N" — keep the first N rows, plus any subsequent rows whose
 * totalSpend equals the Nth row's total. Prevents arbitrarily dropping
 * customers tied at the cutoff (e.g. four customers at ₣150 — all kept).
 */
function topNWithTies(rows: CustomerRow[], n: number): CustomerRow[] {
  if (rows.length <= n) return rows;
  const cutoff = rows[n - 1].totalSpend;
  let i = n;
  while (i < rows.length && rows[i].totalSpend === cutoff) i++;
  return rows.slice(0, i);
}

function buildTop10(purchases: Purchase[]): CustomerRow[] {
  const map = new Map<string, CustomerRow>();
  for (const p of purchases) {
    const key = p.customer?.id ?? p.fullNameSnapshot;
    const amount = Number.parseFloat(p.invoiceAmount);
    const existing = map.get(key);
    if (existing) {
      existing.totalSpend += amount;
      existing.purchaseCount += 1;
      existing.fullName = p.fullNameSnapshot;
      if (p.vehicleNumberSnapshot) existing.vehicleNumber = p.vehicleNumberSnapshot;
      // Keep the most recent submission timestamp
      if (new Date(p.submittedAt) > new Date(existing.lastActivity)) {
        existing.lastActivity = p.submittedAt;
      }
    } else {
      map.set(key, {
        customerId: key,
        fullName: p.fullNameSnapshot,
        mobile: p.customer?.mobile ?? "—",
        vehicleNumber: p.vehicleNumberSnapshot,
        totalSpend: amount,
        purchaseCount: 1,
        lastActivity: p.submittedAt,
      });
    }
  }
  const sorted = Array.from(map.values()).sort(compareRows);
  return topNWithTies(sorted, 10);
}

// ─── Shared preview table ──────────────────────────────────────

function PreviewTable({ rows, ranked }: { rows: CustomerRow[]; ranked: boolean }) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <Users className="h-10 w-10 mx-auto mb-3 opacity-25" />
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
                {ranked && i === 0 ? "🥇" : ranked && i === 1 ? "🥈" : ranked && i === 2 ? "🥉" : (
                  <span className="text-sm text-slate-400 font-mono">{i + 1}</span>
                )}
              </td>
              <td className="py-3 px-3 text-slate-700 font-medium">
                {row.fullName}
                {row.vehicleNumber && (
                  <span className="ml-2 text-xs text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                    {row.vehicleNumber}
                  </span>
                )}
              </td>
              <td className="py-3 px-3 text-slate-500 font-mono text-xs">{row.mobile}</td>
              <td className="py-3 px-3 text-right text-slate-600">{row.purchaseCount}</td>
              <td className="py-3 px-3 text-right font-semibold text-slate-800">{formatCurrency(row.totalSpend)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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

  const profileQ = useQuery({
    queryKey: ["company", "profile"],
    queryFn: companyService.getProfile,
  });
  const companyName = profileQ.data?.name ?? "Your Company";

  const handleGenerateTop10 = async () => {
    setIsGeneratingTop10(true);
    setTop10Error(null);
    setTop10Report(null);
    try {
      const from = new Date(selectedYear, selectedMonth, 1).toISOString().split("T")[0];
      const to = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split("T")[0];
      const purchases = await fetchMonthPurchases(from, to);
      setTop10Report(buildTop10(purchases));
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
      const customers = await fetchAllCustomers();
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
              <Trophy className="h-4 w-4 text-accent-500" />
              Top 10 Customers — Monthly
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
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
                  <FileText className="h-4 w-4 mr-2" />
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
                        <span className="ml-2 text-xs font-normal text-slate-400">
                          ({top10Report.length} shown — includes {top10Report.length - 10} tied at the cutoff)
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{companyName}</p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      const { generateTop10Pdf } = await import("@/lib/pdf/customer-reports");
                      generateTop10Pdf(top10Report, top10Label, companyName);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
                <PreviewTable rows={top10Report} ranked />
              </CardContent>
            </Card>
          )}
        </section>

        {/* ── Report 2: All customers ── */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-heading font-semibold text-slate-800 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary-600" />
              All Customers — Full Report
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete customer list sorted by all-time total spend.
            </p>
          </div>

          <Card>
            <CardContent className="py-5">
              <div className="flex items-center gap-3">
                <Button onClick={handleGenerateAll} isLoading={isGeneratingAll}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <p className="text-xs text-slate-400">Fetches all customer records — may take a moment for large datasets.</p>
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
                      <span className="ml-2 text-xs font-normal text-slate-400">({allReport.length} total)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{companyName} · All-time</p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      const { generateAllCustomersPdf } = await import("@/lib/pdf/customer-reports");
                      generateAllCustomersPdf(allReport, companyName);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
                <PreviewTable rows={allReport} ranked={false} />
              </CardContent>
            </Card>
          )}
        </section>

      </div>
    </DashboardShell>
  );
}

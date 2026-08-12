"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, MoreVertical, Power, Eye } from "lucide-react";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Table, Pagination, Input, Badge, Button, Modal, Select, QueryErrorState } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { PAGE_SIZE } from "@/lib/pagination";
import { adminService } from "@/services";
import { parseApiError, errorMessageWithId } from "@/lib/errors";
import {
  getAdminToggleAction,
  getCompanyStatus,
  STATUS_BADGE_VARIANT,
  STATUS_LABEL,
  TOGGLE_LABEL,
} from "@/lib/company-status";
import type { Company } from "@/types";


type StatusFilter = "all" | "active" | "inactive";
type BusinessFilter = "all" | "fuel_station" | "shop";

export default function AdminCompaniesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [businessFilter, setBusinessFilter] = useState<BusinessFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ company: Company; action: "activate" | "deactivate" } | null>(null);

  useEffect(() => {
    if (!actionMenuId) return;
    const close = () => setActionMenuId(null);
    const closeOnEscape = (e: KeyboardEvent) => { if (e.key === "Escape") setActionMenuId(null); };
    document.addEventListener("click", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [actionMenuId]);

  const companiesQ = useQuery({
    queryKey: ["admin", "companies", { page: currentPage, search: debouncedSearch, status: statusFilter, businessType: businessFilter }],
    queryFn: () =>
      adminService.getCompanies({
        page: currentPage,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: statusFilter,
        businessType: businessFilter,
      }),
    placeholderData: (prev) => prev,
  });

  const toggleMut = useMutation({
    mutationFn: async ({ company, action }: { company: Company; action: "activate" | "deactivate" }) => {
      if (action === "deactivate") {
        await adminService.deactivateCompany(company.id);
      } else {
        await adminService.activateCompany(company.id);
      }
    },
    onSuccess: (_, { action }) => {
      toast.success(
        action === "deactivate"
          ? "Company deactivated. Owner signed out of all devices."
          : "Ban lifted. Their access now follows their subscription."
      );
      qc.invalidateQueries({ queryKey: ["admin", "companies"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      setConfirmModal(null);
    },
    onError: (err) => {
      toast.error(errorMessageWithId(parseApiError(err)));
    },
  });

  const items = companiesQ.data?.items ?? [];
  const pagination = companiesQ.data?.pagination;

  const columns = [
    {
      key: "name",
      header: "Company",
      render: (row: Company) => (
        <div>
          <p className="font-medium text-slate-700">{row.name}</p>
          <p className="text-xs text-slate-500 font-mono">{row.registrationNumber}</p>
        </div>
      ),
    },
    {
      key: "businessType",
      header: "Type",
      render: (row: Company) => (
        <Badge variant="brand">
          {row.businessType === "fuel_station" ? "Fuel Station" : "Shop"}
        </Badge>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      render: (row: Company) => (
        <div>
          <p className="text-sm text-slate-700">{row.owner?.username ?? "—"}</p>
          <p className="text-xs text-slate-500">{row.owner?.email ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "joinedAt",
      header: "Joined",
      render: (row: Company) => <span className="text-xs text-slate-500">{formatDate(row.joinedAt)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row: Company) => {
        const status = getCompanyStatus(row);
        return (
          <Badge variant={STATUS_BADGE_VARIANT[status]}>
            {STATUS_LABEL[status]}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (row: Company) => {
        // Driven by whether the company is banned, NOT by the status badge: an
        // expired company reads as "pending" but was never banned, and offering it
        // Activate produced an error every time. See getAdminToggleAction.
        const toggleAction = getAdminToggleAction(row);
        const toggleLabel = TOGGLE_LABEL[toggleAction];
        return (
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === row.id ? null : row.id); }}
              className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
              aria-label={`Actions for ${row.name}`}
              aria-expanded={actionMenuId === row.id}
              aria-haspopup="menu"
            >
              <MoreVertical className="h-4 w-4" aria-hidden="true" />
            </button>
            {actionMenuId === row.id && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 w-44" role="menu">
                <Link
                  href={`/admin/companies/${row.id}`}
                  className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                  onClick={() => setActionMenuId(null)}
                  role="menuitem"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" /> View Details
                </Link>
                <button
                  role="menuitem"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                  onClick={() => {
                    setActionMenuId(null);
                    setConfirmModal({ company: row, action: toggleAction });
                  }}
                >
                  <Power className="h-4 w-4" aria-hidden="true" />
                  <span className={toggleAction === "deactivate" ? "text-error-500" : "text-success-500"}>
                    {toggleLabel}
                  </span>
                </button>
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DashboardShell title="Companies" requiredRole="super_admin">
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 mb-5">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
          <Input
            placeholder="Search companies..."
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="w-full sm:w-40">
          <Select
            name="status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setCurrentPage(1); }}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            name="businessType"
            value={businessFilter}
            onChange={(e) => { setBusinessFilter(e.target.value as BusinessFilter); setCurrentPage(1); }}
            options={[
              { value: "all", label: "All Types" },
              { value: "fuel_station", label: "Fuel Station" },
              { value: "shop", label: "Shop" },
            ]}
          />
        </div>
        <span className="text-sm text-slate-500 ml-auto">{pagination?.total ?? 0} companies</span>
      </div>

      {companiesQ.isError ? (
        <QueryErrorState
          error={companiesQ.error}
          onRetry={() => companiesQ.refetch()}
          resource="companies"
        />
      ) : (
        <>
          <Table
            columns={columns}
            data={items}
            keyExtractor={(row) => row.id}
            isLoading={companiesQ.isLoading}
            emptyMessage="No companies found."
          />

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
              className="mt-6"
            />
          )}
        </>
      )}

      {confirmModal && (
        <Modal
          open={true}
          onClose={() => setConfirmModal(null)}
          title={`${TOGGLE_LABEL[confirmModal.action]} — ${confirmModal.company.name}`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button
                variant={confirmModal.action === "activate" ? "primary" : "danger"}
                isLoading={toggleMut.isPending}
                onClick={() => toggleMut.mutate(confirmModal)}
              >
                {TOGGLE_LABEL[confirmModal.action]}
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            {confirmModal.action === "activate"
              ? "This lifts the ban. Access is then decided by their subscription — if it has expired, they will land on the paywall rather than a working dashboard."
              : "This bans the company. It does not end their subscription period; it overrides it."}
          </p>
          {confirmModal.action === "deactivate" && (
            <p className="text-sm text-error-600 mt-3 bg-error-50 border border-error-100 rounded-lg p-3">
              <span aria-hidden="true">⚠</span>{" "}The owner will be signed out of all devices immediately and cannot log in until reactivated.
            </p>
          )}
        </Modal>
      )}
    </DashboardShell>
  );
}

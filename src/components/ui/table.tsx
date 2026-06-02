import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onSort,
  sortKey,
  sortDirection,
  isLoading,
  emptyMessage = "No data found",
  className,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className={cn("bg-white border border-slate-200 rounded-lg overflow-hidden", className)}>
        <div className="animate-pulse">
          <div className="h-12 bg-slate-50 border-b border-slate-100" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-13 border-b border-slate-100 flex items-center px-4 gap-4">
              {columns.map((_, j) => (
                <div key={j} className="h-4 bg-slate-100 rounded flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className={cn("hidden md:block bg-white border border-slate-200 rounded-lg", className)}>
        <table className="w-full">
          <thead className="rounded-t-lg overflow-hidden">
            <tr className="bg-slate-50 border-b border-slate-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
                    col.sortable && "cursor-pointer select-none hover:text-slate-700",
                    col.className
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors duration-100"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 text-sm text-slate-600", col.className)}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {data.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-sm text-slate-400">
            {emptyMessage}
          </div>
        ) : (
          data.map((row) => (
            <div
              key={keyExtractor(row)}
              className="bg-white border border-slate-200 rounded-lg p-4 space-y-2"
            >
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500 uppercase">{col.header}</span>
                  <span className="text-sm text-slate-700">
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </>
  );
}

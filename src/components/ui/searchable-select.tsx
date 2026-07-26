"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectOption } from "./select";

export interface SearchableSelectProps {
  label?: string;
  name?: string;
  value: string;
  /** Called with the selected option's value. */
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Shown in the dropdown when the query matches nothing. */
  emptyText?: string;
}

/**
 * Type-to-filter combobox. Same visual language as <Select>, but the user can
 * type to narrow a long option list (countries, regions). Keyboard accessible
 * (↑/↓/Enter/Esc), closes on outside click, and reverts to the selected label
 * when dismissed without choosing.
 */
export function SearchableSelect({
  label,
  name,
  value,
  onChange,
  options,
  error,
  helperText,
  disabled,
  placeholder = "Select…",
  emptyText = "No matches",
}: Readonly<SearchableSelectProps>) {
  const reactId = useId();
  const fieldId = name ?? reactId;
  const listId = `${fieldId}-listbox`;

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? "",
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!open || !q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [open, query, options]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keep the highlighted option scrolled into view.
  useEffect(() => {
    if (open) activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const openMenu = () => {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    const selectedIdx = options.findIndex((o) => o.value === value);
    setActiveIndex(selectedIdx >= 0 ? selectedIdx : 0);
  };

  const select = (option: SelectOption) => {
    onChange(option.value);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) return openMenu();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open) {
        e.preventDefault();
        const option = filtered[activeIndex];
        if (option) select(option);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label
          htmlFor={fieldId}
          className={cn("block text-sm font-medium mb-1", error ? "text-error-500" : "text-slate-600")}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={fieldId}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={!!error}
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={open ? query : selectedLabel}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            if (!open) setOpen(true);
          }}
          onFocus={openMenu}
          onClick={openMenu}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-11 w-full appearance-none rounded-md border bg-white px-3 pr-10 text-base text-slate-800 placeholder:text-slate-300 transition-colors duration-150",
            "focus:outline-none focus:ring-[3px]",
            error
              ? "border-error-500 focus:border-error-500 focus:ring-error-500/15"
              : "border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:ring-primary-500/15",
            "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
          )}
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />

        {open && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-400">{emptyText}</li>
            ) : (
              filtered.map((option, i) => {
                const isSelected = option.value === value;
                const isActive = i === activeIndex;
                return (
                  <li
                    key={option.value}
                    ref={isActive ? activeRef : null}
                    role="option"
                    aria-selected={isSelected}
                    // onMouseDown (not onClick) so selection fires before the
                    // input blur can close the list.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      select(option);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm",
                      isActive ? "bg-primary-50 text-primary-700" : "text-slate-700",
                      isSelected && "font-medium",
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <Check className="h-4 w-4 text-primary-500 shrink-0" />}
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
      {error && (
        <p className="mt-1 text-[13px] text-error-500" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && <p className="mt-1 text-[13px] text-slate-400">{helperText}</p>}
    </div>
  );
}

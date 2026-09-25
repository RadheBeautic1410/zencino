"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface AdminFilterOption {
  label: string;
  value: string;
}

export interface AdminFilterSelect {
  label: string;
  options: AdminFilterOption[];
  param: string;
}

interface AdminFilterBarProps {
  /** Search box bound to the `q` param. Omit to hide it. */
  searchPlaceholder?: string;
  /** Selects rendered next to the search box. Empty value means "any". */
  selects?: AdminFilterSelect[];
  /** Status-style tab row. The "all" value clears the param. */
  tabs?: { param: string; options: AdminFilterOption[] };
}

const SEARCH_PARAM = "q";
const SEARCH_DEBOUNCE_MS = 350;

/**
 * URL-driven filter controls for server-rendered admin lists. Every change is
 * written to the query string so filters survive reloads and can be shared.
 */
export function AdminFilterBar({
  selects = [],
  searchPlaceholder,
  tabs,
}: AdminFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const urlSearch = searchParams.get(SEARCH_PARAM) ?? "";
  const [search, setSearch] = useState(urlSearch);
  const lastPushedSearch = useRef(urlSearch);

  // Keep the input in sync when the URL changes elsewhere (e.g. "Clear").
  useEffect(() => {
    if (urlSearch !== lastPushedSearch.current) {
      lastPushedSearch.current = urlSearch;
      setSearch(urlSearch);
    }
  }, [urlSearch]);

  const applyParams = (patch: Record<string, string | null>) => {
    // Read the live URL so a debounced search never overwrites a select that
    // changed while the timer was pending.
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(patch)) {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    }
    const query = next.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: debounce only on input changes.
  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed === lastPushedSearch.current) {
      return;
    }
    const timer = setTimeout(() => {
      lastPushedSearch.current = trimmed;
      applyParams({ [SEARCH_PARAM]: trimmed || null });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const managedParams = [
    ...(searchPlaceholder ? [SEARCH_PARAM] : []),
    ...(tabs ? [tabs.param] : []),
    ...selects.map((s) => s.param),
  ];
  const hasActiveFilters = managedParams.some((p) => searchParams.get(p));

  const clearAll = () => {
    lastPushedSearch.current = "";
    setSearch("");
    applyParams(Object.fromEntries(managedParams.map((p) => [p, null])));
  };

  const activeTab = tabs ? (searchParams.get(tabs.param) ?? "all") : null;

  return (
    <div
      className={cn(
        "space-y-3 border-b border-border pb-3 transition-opacity",
        isPending && "opacity-70"
      )}
    >
      {tabs && (
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.options.map((tab) => (
            <Button
              className="h-8 text-xs"
              key={tab.value}
              onClick={() =>
                applyParams({
                  [tabs.param]: tab.value === "all" ? null : tab.value,
                })
              }
              size="sm"
              type="button"
              variant={activeTab === tab.value ? "default" : "outline"}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      )}

      {(searchPlaceholder || selects.length > 0) && (
        <FilterControls
          onClear={hasActiveFilters ? clearAll : undefined}
          onSearchChange={setSearch}
          searchPlaceholder={searchPlaceholder}
          searchValue={search}
          selects={selects.map((select) => ({
            ...select,
            value: searchParams.get(select.param) ?? "",
            onChange: (value) => applyParams({ [select.param]: value || null }),
          }))}
        />
      )}
    </div>
  );
}

interface FilterControlsProps {
  /** Shows the "Clear filters" button when provided. */
  onClear?: () => void;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  selects?: (AdminFilterSelect & {
    onChange: (value: string) => void;
    value: string;
  })[];
}

/**
 * Controlled search + select row. Used directly by client-side managers that
 * already hold their full list in memory.
 */
export function FilterControls({
  onClear,
  onSearchChange,
  searchPlaceholder,
  searchValue = "",
  selects = [],
}: FilterControlsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      {searchPlaceholder && onSearchChange && (
        <div className="relative min-w-0 flex-1 sm:min-w-64">
          <MagnifyingGlass
            className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-0 text-muted-foreground"
            size={14}
          />
          <Input
            aria-label="Search"
            className="h-9 pl-5 text-sm"
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            type="search"
            value={searchValue}
          />
        </div>
      )}

      {selects.map((select) => (
        <label className="flex flex-col gap-1" key={select.param}>
          <span className="font-semibold text-2xs text-muted-foreground uppercase tracking-ui">
            {select.label}
          </span>
          <select
            className="h-9 min-w-36 border border-border bg-background px-2 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            onChange={(e) => select.onChange(e.target.value)}
            value={select.value}
          >
            <option value="">All</option>
            {select.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      ))}

      {onClear && (
        <Button
          className="h-9 text-xs"
          onClick={onClear}
          size="sm"
          type="button"
          variant="ghost"
        >
          <X className="mr-1" size={12} /> Clear filters
        </Button>
      )}
    </div>
  );
}

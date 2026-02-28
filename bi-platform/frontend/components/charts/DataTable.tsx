"use client";

import { useState } from "react";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "right" | "center";
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  maxRows?: number;
  emptyMessage?: string;
}

function getValue<T extends Record<string, unknown>>(row: T, key: string): unknown {
  return key.split(".").reduce<unknown>((obj, k) => {
    if (obj && typeof obj === "object") return (obj as Record<string, unknown>)[k];
    return undefined;
  }, row);
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  title,
  maxRows = 10,
  emptyMessage = "Sin datos",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showAll, setShowAll] = useState(false);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  let sorted = [...data];
  if (sortKey) {
    sorted.sort((a, b) => {
      const av = getValue(a, sortKey);
      const bv = getValue(b, sortKey);
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }

  const displayed = showAll ? sorted : sorted.slice(0, maxRows);
  const hasMore = sorted.length > maxRows;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                  } ${col.sortable ? "cursor-pointer hover:text-gray-700 select-none" : ""}`}
                  onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                >
                  {col.header}
                  {col.sortable && sortKey === String(col.key) && (
                    <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayed.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0"
                >
                  {columns.map((col) => {
                    const value = getValue(row, String(col.key));
                    return (
                      <td
                        key={String(col.key)}
                        className={`px-4 py-2.5 text-gray-700 ${
                          col.align === "right"
                            ? "text-right tabular-nums"
                            : col.align === "center"
                            ? "text-center"
                            : ""
                        }`}
                      >
                        {col.render ? col.render(value, row) : String(value ?? "—")}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="px-4 py-2.5 border-t border-gray-100 text-center">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-xs text-blue-600 hover:underline"
          >
            {showAll ? "Ver menos" : `Ver todos (${sorted.length})`}
          </button>
        </div>
      )}
    </div>
  );
}

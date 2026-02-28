"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const PRESETS = [
  { label: "Últimos 7 días", days: 7 },
  { label: "Últimos 30 días", days: 30 },
  { label: "Últimos 90 días", days: 90 },
];

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

interface DateRangePickerProps {
  dateFrom: string;
  dateTo: string;
}

export default function DateRangePicker({ dateFrom, dateTo }: DateRangePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState(dateFrom);
  const [customTo, setCustomTo] = useState(dateTo);

  function buildUrl(from: string, to: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date_from", from);
    params.set("date_to", to);
    return `${pathname}?${params.toString()}`;
  }

  function applyPreset(days: number) {
    setShowCustom(false);
    router.push(buildUrl(offsetDate(days), today()));
  }

  function applyCustom() {
    if (customFrom && customTo && customFrom <= customTo) {
      router.push(buildUrl(customFrom, customTo));
      setShowCustom(false);
    }
  }

  // Determine which preset is active
  const activePreset = PRESETS.find(
    (p) => dateFrom === offsetDate(p.days) && dateTo === today()
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESETS.map((p) => (
        <button
          key={p.days}
          onClick={() => applyPreset(p.days)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            activePreset?.days === p.days
              ? "bg-blue-600 text-white"
              : "border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 bg-white"
          }`}
        >
          {p.label}
        </button>
      ))}

      <button
        onClick={() => setShowCustom((v) => !v)}
        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          showCustom || (!activePreset && !showCustom)
            ? "border border-blue-300 text-blue-600 bg-blue-50"
            : "border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 bg-white"
        }`}
      >
        Personalizado
      </button>

      {!activePreset && !showCustom && (
        <span className="text-xs text-gray-500">
          {dateFrom} → {dateTo}
        </span>
      )}

      {showCustom && (
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            max={customTo}
            className="text-xs border-0 focus:outline-none text-gray-700"
          />
          <span className="text-gray-400 text-xs">→</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            min={customFrom}
            max={today()}
            className="text-xs border-0 focus:outline-none text-gray-700"
          />
          <button
            onClick={applyCustom}
            disabled={!customFrom || !customTo || customFrom > customTo}
            className="rounded-md bg-blue-600 px-2 py-1 text-xs text-white font-medium hover:bg-blue-700 disabled:opacity-40"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}

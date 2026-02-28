"use client";

import { useState } from "react";

interface ExportButtonProps {
  slug: string;
  dateFrom: string;
  dateTo: string;
}

export default function ExportButton({ slug, dateFrom, dateTo }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
      const res = await fetch(`/api/export-pdf?slug=${slug}&${params.toString()}`);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error al generar PDF" }));
        setError(err.error ?? "Error al generar PDF");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte-${slug}-${dateFrom}_${dateTo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setError("Error de conexión al generar el PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
      <button
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 print:hidden"
      >
        {loading ? (
          <>
            <span className="animate-spin text-sm">⟳</span>
            Generando...
          </>
        ) : (
          <>
            <span>⬇</span>
            Exportar PDF
          </>
        )}
      </button>
    </div>
  );
}

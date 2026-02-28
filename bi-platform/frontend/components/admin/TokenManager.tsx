"use client";

import { useState } from "react";
import { getAuthToken } from "@/lib/auth";
import type { ClientToken } from "@/lib/types";

export default function TokenManager({
  clientId,
  clientSlug,
}: {
  clientId: string;
  clientSlug: string;
}) {
  const [tokens, setTokens] = useState<ClientToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function loadTokens() {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/clients/${clientId}/tokens`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        setTokens(await res.json());
        setLoaded(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function createToken() {
    const token = getAuthToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/clients/${clientId}/tokens`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expires_days: 30 }),
      }
    );
    if (res.ok) {
      const newToken = await res.json() as ClientToken;
      setTokens((prev) => [newToken, ...prev]);
      copyToClipboard(newToken.dashboard_url);
    }
  }

  async function revokeToken(tokenId: string) {
    const token = getAuthToken();
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/clients/${clientId}/tokens/${tokenId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    );
    setTokens((prev) =>
      prev.map((t) => (t.id === tokenId ? { ...t, is_revoked: true } : t))
    );
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Tokens de Acceso</h2>
        <div className="flex gap-2">
          {!loaded && (
            <button
              onClick={loadTokens}
              disabled={loading}
              className="text-sm text-blue-600 hover:underline"
            >
              {loading ? "Cargando..." : "Ver tokens"}
            </button>
          )}
          <button
            onClick={createToken}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            + Generar Token
          </button>
        </div>
      </div>

      {loaded && (
        <div className="space-y-2">
          {tokens.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              No hay tokens activos.
            </p>
          )}
          {tokens.map((t) => (
            <div
              key={t.id}
              className={`flex items-center justify-between rounded-lg border p-3 text-sm ${
                t.is_revoked ? "border-gray-200 bg-gray-50 opacity-60" : "border-blue-100 bg-blue-50"
              }`}
            >
              <div>
                <p className="font-mono text-xs text-gray-600 truncate max-w-xs">
                  {t.dashboard_url}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t.expires_at
                    ? `Expira: ${new Date(t.expires_at).toLocaleDateString("es")}`
                    : "Sin expiración"}
                  {t.is_revoked && " · REVOCADO"}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                {!t.is_revoked && (
                  <>
                    <button
                      onClick={() => copyToClipboard(t.dashboard_url)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {copied === t.dashboard_url ? "¡Copiado!" : "Copiar"}
                    </button>
                    <button
                      onClick={() => revokeToken(t.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Revocar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

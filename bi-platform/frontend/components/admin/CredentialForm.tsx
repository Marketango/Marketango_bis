"use client";

import { useState } from "react";

const SOURCES = [
  {
    key: "google_ads",
    label: "Google Ads",
    fields: [
      { name: "developer_token", label: "Developer Token", type: "password" },
      { name: "customer_id", label: "Customer ID", type: "text", placeholder: "123-456-7890" },
      { name: "refresh_token", label: "Refresh Token OAuth", type: "password" },
    ],
  },
  {
    key: "meta_ads",
    label: "Meta Ads",
    fields: [
      { name: "access_token", label: "Access Token (Long-Lived)", type: "password" },
      { name: "account_id", label: "Ad Account ID", type: "text", placeholder: "act_123456789" },
    ],
  },
  {
    key: "search_console",
    label: "Google Search Console",
    fields: [
      { name: "refresh_token", label: "Refresh Token OAuth", type: "password" },
      { name: "site_url", label: "Site URL", type: "text", placeholder: "https://example.com" },
    ],
  },
  {
    key: "ga4",
    label: "Google Analytics 4",
    fields: [
      { name: "refresh_token", label: "Refresh Token OAuth", type: "password" },
      { name: "property_id", label: "Property ID", type: "text", placeholder: "123456789" },
    ],
  },
];

export default function CredentialForm({
  clientId,
  agencyToken,
}: {
  clientId: string;
  agencyToken: string;
}) {
  const [activeSource, setActiveSource] = useState("google_ads");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const source = SOURCES.find((s) => s.key === activeSource)!;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/clients/${clientId}/credentials/${activeSource}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${agencyToken}`,
          },
          body: JSON.stringify({ source: activeSource, data: formData }),
        }
      );
      if (res.ok) {
        setMessage({ type: "success", text: "Credenciales guardadas correctamente" });
        setFormData({});
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.detail || "Error al guardar" });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      {/* Source tabs */}
      <div className="flex border-b border-gray-200">
        {SOURCES.map((s) => (
          <button
            key={s.key}
            onClick={() => { setActiveSource(s.key); setFormData({}); setMessage(null); }}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeSource === s.key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="p-5 space-y-4">
        {message && (
          <div className={`rounded-lg p-3 text-sm ${
            message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
            {message.text}
          </div>
        )}

        {source.fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type={field.type}
              placeholder={(field as { placeholder?: string }).placeholder}
              value={formData[field.name] || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
              }
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ))}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Credenciales"}
          </button>
        </div>
      </form>
    </div>
  );
}

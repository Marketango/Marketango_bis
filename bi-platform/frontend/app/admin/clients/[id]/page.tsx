import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import TokenManager from "@/components/admin/TokenManager";

async function getClient(id: string, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/clients/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

async function getCredentials(clientId: string, token: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/clients/${clientId}/credentials`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const token = cookies().get("bi_access_token")?.value || "";
  const [client, credentials] = await Promise.all([
    getClient(params.id, token),
    getCredentials(params.id, token),
  ]);

  if (!client) notFound();

  const SOURCES = [
    { key: "google_ads", label: "Google Ads" },
    { key: "meta_ads", label: "Meta Ads" },
    { key: "search_console", label: "Search Console" },
    { key: "ga4", label: "Google Analytics 4" },
  ];

  const connectedSources = new Set(
    credentials.map((c: { source: string }) => c.source)
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/admin/clients" className="hover:text-blue-600">Clientes</Link>
            <span>›</span>
            <span>{client.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-sm text-gray-500">/cliente/{client.slug}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${
          client.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
        }`}>
          {client.is_active ? "Activo" : "Inactivo"}
        </span>
      </div>

      {/* Client Info */}
      <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Información</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Sector</p>
            <p className="font-medium">{client.sector || "No especificado"}</p>
          </div>
          <div>
            <p className="text-gray-500">CPA Objetivo</p>
            <p className="font-medium">{client.target_cpa ? `$${client.target_cpa}` : "No configurado"}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Link
            href={`/admin/clients/${client.id}/credentials`}
            className="text-sm text-blue-600 hover:underline"
          >
            Gestionar Credenciales →
          </Link>
        </div>
      </div>

      {/* API Connections */}
      <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Conexiones API</h2>
        <div className="grid grid-cols-2 gap-3">
          {SOURCES.map((source) => (
            <div
              key={source.key}
              className={`flex items-center justify-between rounded-lg border p-3 ${
                connectedSources.has(source.key)
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <span className="text-sm font-medium">{source.label}</span>
              <span className={`text-xs rounded-full px-2 py-0.5 ${
                connectedSources.has(source.key)
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-500"
              }`}>
                {connectedSources.has(source.key) ? "Conectado" : "Sin conectar"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Token Management */}
      <TokenManager clientId={client.id} clientSlug={client.slug} />
    </div>
  );
}

import { cookies } from "next/headers";
import Link from "next/link";

async function getClients(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/clients`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function ClientsPage() {
  const token = cookies().get("bi_access_token")?.value || "";
  const clients = await getClients(token);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">{clients.length} cliente(s) registrados</p>
        </div>
        <Link
          href="/admin/clients/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          + Nuevo Cliente
        </Link>
      </div>

      <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-5 py-3 font-medium text-gray-600">Cliente</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Sector</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">CPA Objetivo</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-right px-5 py-3 font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map((client: {
              id: string; name: string; slug: string;
              sector?: string; target_cpa?: number; is_active: boolean
            }) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">{client.name}</p>
                  <p className="text-xs text-gray-400">/cliente/{client.slug}</p>
                </td>
                <td className="px-5 py-3 text-gray-600">{client.sector || "—"}</td>
                <td className="px-5 py-3 text-gray-600">
                  {client.target_cpa ? `$${client.target_cpa}` : "—"}
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    client.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {client.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Gestionar →
                  </Link>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                  No hay clientes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

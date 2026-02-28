import { cookies } from "next/headers";

async function getClients(token: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/clients`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const token = cookies().get("bi_access_token")?.value || "";
  const clients = await getClients(token);
  const activeClients = clients.filter((c: { is_active: boolean }) => c.is_active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Vista general de la agencia</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Clientes Totales</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{clients.length}</p>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Clientes Activos</p>
          <p className="mt-1 text-3xl font-bold text-green-600">{activeClients.length}</p>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Fuentes Conectadas</p>
          <p className="mt-1 text-3xl font-bold text-blue-600">4</p>
          <p className="text-xs text-gray-400 mt-1">Google Ads · Meta · GSC · GA4</p>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Clientes Recientes</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {clients.slice(0, 5).map((client: { id: string; name: string; slug: string; is_active: boolean; sector?: string }) => (
            <div key={client.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="font-medium text-gray-900">{client.name}</p>
                <p className="text-xs text-gray-400">/cliente/{client.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                {client.sector && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {client.sector}
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    client.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {client.is_active ? "Activo" : "Inactivo"}
                </span>
                <a
                  href={`/admin/clients/${client.id}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Ver →
                </a>
              </div>
            </div>
          ))}
          {clients.length === 0 && (
            <p className="px-5 py-6 text-sm text-gray-400 text-center">
              No hay clientes. <a href="/admin/clients" className="text-blue-600 hover:underline">Crear el primero</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

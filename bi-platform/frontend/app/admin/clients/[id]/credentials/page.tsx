import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import CredentialForm from "@/components/admin/CredentialForm";

async function getClient(id: string, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/clients/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function CredentialsPage({
  params,
}: {
  params: { id: string };
}) {
  const token = cookies().get("bi_access_token")?.value || "";
  const client = await getClient(params.id, token);

  if (!client) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/admin/clients" className="hover:text-blue-600">Clientes</Link>
          <span>›</span>
          <Link href={`/admin/clients/${client.id}`} className="hover:text-blue-600">{client.name}</Link>
          <span>›</span>
          <span>Credenciales</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Credenciales API</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configura las credenciales para conectar fuentes de datos de {client.name}
        </p>
      </div>

      <CredentialForm clientId={client.id} agencyToken={token} />
    </div>
  );
}

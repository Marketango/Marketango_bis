import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import ClientDashboard from "@/components/client/ClientDashboard";
import type { MetricsResponse } from "@/lib/types";

async function getMetrics(
  slug: string,
  token: string,
  dateFrom: string,
  dateTo: string
): Promise<MetricsResponse | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/metrics/client/${slug}?date_from=${dateFrom}&date_to=${dateTo}&token=${token}`,
      { cache: "no-store" }
    );
    if (res.status === 401) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function getDefaultDates() {
  const today = new Date();
  const dateTo = today.toISOString().split("T")[0];
  const d30 = new Date(today);
  d30.setDate(d30.getDate() - 30);
  const dateFrom = d30.toISOString().split("T")[0];
  return { dateFrom, dateTo };
}

export default async function ClientPortalPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { date_from?: string; date_to?: string; print?: string };
}) {
  const token = cookies().get("bi_client_token")?.value;
  if (!token) notFound();

  const defaults = getDefaultDates();
  const dateFrom = searchParams.date_from || defaults.dateFrom;
  const dateTo = searchParams.date_to || defaults.dateTo;
  const isPrintMode = searchParams.print === "true";

  const metrics = await getMetrics(params.slug, token, dateFrom, dateTo);
  if (!metrics) notFound();

  return (
    <ClientDashboard
      metrics={metrics}
      slug={params.slug}
      token={token}
      dateFrom={dateFrom}
      dateTo={dateTo}
      isPrintMode={isPrintMode}
    />
  );
}

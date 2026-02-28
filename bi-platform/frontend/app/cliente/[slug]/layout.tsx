import { cookies } from "next/headers";
import { notFound } from "next/navigation";

async function getClientBranding(slug: string, token: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/metrics/client/${slug}?date_from=2025-01-01&date_to=2025-01-01&token=${token}`,
      { cache: "no-store" }
    );
    if (res.status === 401) return null;
    return { primaryColor: "#3B82F6", secondaryColor: "#1E40AF" };
  } catch {
    return { primaryColor: "#3B82F6", secondaryColor: "#1E40AF" };
  }
}

export default async function ClientPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const token = cookies().get("bi_client_token")?.value;
  if (!token) notFound();

  const branding = await getClientBranding(params.slug, token);
  if (!branding) notFound();

  return (
    <div
      style={
        {
          "--color-primary": branding.primaryColor,
          "--color-secondary": branding.secondaryColor,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

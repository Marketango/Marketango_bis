const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new ApiError(error.detail || "Request failed", response.status);
  }

  if (response.status === 204) return null as T;
  return response.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch<{ access_token: string; role: string; tenant_id: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // Clients
  listClients: (token: string) =>
    apiFetch<unknown[]>("/admin/clients", { token }),

  getClient: (id: string, token: string) =>
    apiFetch<unknown>(`/admin/clients/${id}`, { token }),

  createClient: (data: unknown, token: string) =>
    apiFetch<unknown>("/admin/clients", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  updateClient: (id: string, data: unknown, token: string) =>
    apiFetch<unknown>(`/admin/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  createClientToken: (clientId: string, token: string, expiresDays = 30) =>
    apiFetch<unknown>(`/admin/clients/${clientId}/tokens`, {
      method: "POST",
      body: JSON.stringify({ expires_days: expiresDays }),
      token,
    }),

  revokeClientToken: (clientId: string, tokenId: string, token: string) =>
    apiFetch<null>(`/admin/clients/${clientId}/tokens/${tokenId}`, {
      method: "DELETE",
      token,
    }),

  invalidateClientCache: (clientId: string, token: string) =>
    apiFetch<unknown>(`/admin/clients/${clientId}/cache/invalidate`, {
      method: "POST",
      token,
    }),

  // Credentials
  listCredentials: (clientId: string, token: string) =>
    apiFetch<unknown[]>(`/admin/clients/${clientId}/credentials`, { token }),

  upsertCredential: (clientId: string, source: string, data: unknown, token: string) =>
    apiFetch<unknown>(`/admin/clients/${clientId}/credentials/${source}`, {
      method: "PUT",
      body: JSON.stringify({ source, data }),
      token,
    }),

  // Metrics
  getClientMetrics: (
    clientSlug: string,
    dateFrom: string,
    dateTo: string,
    clientToken: string
  ) =>
    apiFetch<unknown>(
      `/metrics/client/${clientSlug}?date_from=${dateFrom}&date_to=${dateTo}&token=${clientToken}`
    ),

  getAdminMetrics: (
    clientId: string,
    dateFrom: string,
    dateTo: string,
    token: string
  ) =>
    apiFetch<unknown>(
      `/metrics/admin/${clientId}?date_from=${dateFrom}&date_to=${dateTo}`,
      { token }
    ),
};

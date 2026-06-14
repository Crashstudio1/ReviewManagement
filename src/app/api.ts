import { type Service } from "./components/ServiceSelection";

export type TokenUsageByYear = Record<string, Record<string, number>>;

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api").replace(/\/$/, "");

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // Keep the HTTP status message.
    }
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  getServices() {
    return request<Service[]>("/services");
  },

  addService(service: Service) {
    return request<Service>("/services", {
      method: "POST",
      body: JSON.stringify(service),
    });
  },

  updateService(currentCode: string, service: Service) {
    return request<Service>(`/services/${encodeURIComponent(currentCode)}`, {
      method: "PUT",
      body: JSON.stringify(service),
    });
  },

  issueToken(service: Service) {
    return request<{ token: string; service: Service; issuedYear: number }>("/tokens", {
      method: "POST",
      body: JSON.stringify({ serviceCode: service.code, service }),
    });
  },

  getTokenUsageByYear() {
    return request<TokenUsageByYear>("/tokens/usage/by-year");
  },

  submitFeedback(payload: { rating: number; comment?: string; mobile?: string }) {
    return request<{ id: number }>("/feedback", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

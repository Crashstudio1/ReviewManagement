import { type Service } from "./components/ServiceSelection";

export type TokenUsageByYear = Record<string, Record<string, number>>;

export interface FeedbackReview {
  id: number;
  date: string;
  rating: number;
  comment: string;
  mobile: string;
  status: "Positive" | "Negative" | "Neutral";
}

export interface FeedbackSummary {
  total: number;
  averageRating: number;
  positive: number;
  negative: number;
  neutral: number;
  ratingDistribution: Array<{ rating: number; count: number }>;
  monthlyTrend: Array<{ month: string; reviews: number; avg: number }>;
}

export interface AnalyticsOverview {
  totalReviews: number;
  satisfactionRate: number;
  negativeRate: number;
  averageRating: number;
  dailyAverage: number;
  ratingDistribution: Array<{ name: string; rating: number; value: number }>;
  monthlyTrend: Array<{ month: string; positive: number; negative: number; reviews: number; avg: number }>;
  dailyVolume: Array<{ day: string; reviews: number }>;
}

export interface TokenReportRow {
  id: number;
  token: string;
  serviceCode: string;
  serviceName: string;
  issuedYear: number;
  issuedAt: string;
}

export interface AdminSettings {
  organizationName?: string;
  kioskTitle?: string;
  supportPhone?: string;
  reportEmail?: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

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

  getRecentFeedback(limit = 8) {
    return request<FeedbackReview[]>(`/feedback/recent?limit=${encodeURIComponent(limit)}`);
  },

  getFeedbackSummary() {
    return request<FeedbackSummary>("/feedback/summary");
  },

  getAnalyticsOverview() {
    return request<AnalyticsOverview>("/analytics/overview");
  },

  getFeedbackReport() {
    return request<FeedbackReview[]>("/reports/feedback");
  },

  getTokenReport() {
    return request<TokenReportRow[]>("/reports/tokens");
  },

  getSettings() {
    return request<AdminSettings>("/settings");
  },

  updateSettings(settings: AdminSettings) {
    return request<AdminSettings>("/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  },

  getUsers() {
    return request<AdminUser[]>("/users");
  },

  addUser(user: Pick<AdminUser, "name" | "email" | "role">) {
    return request<AdminUser>("/users", {
      method: "POST",
      body: JSON.stringify(user),
    });
  },

  updateUserStatus(id: number, active: boolean) {
    return request<{ id: number; active: boolean }>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    });
  },

  submitFeedback(payload: { rating: number; comment?: string; mobile?: string }) {
    return request<{ id: number }>("/feedback", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

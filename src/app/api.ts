import { type Service } from "./components/ServiceSelection";

export type TokenUsageByYear = Record<string, Record<string, number>>;

export interface FeedbackReview {
  id: number;
  date: string;
  rating: number;
  comment: string;
  mobile: string;
  serviceCode: string;
  serviceName: string;
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

export interface AuthUser extends AdminUser {}

export interface LoginResult {
  token: string;
  user: AuthUser;
  expiresIn: number;
}

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || "/api")
  .replace(/\/$/, "");
const AUTH_TOKEN_KEY = "gov-citizen-review-admin-token";
const AUTH_USER_KEY = "gov-citizen-review-admin-user";

let authToken = typeof window === "undefined"
  ? ""
  : window.localStorage.getItem(AUTH_TOKEN_KEY) || "";

function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem(AUTH_USER_KEY);
    return saved ? JSON.parse(saved) as AuthUser : null;
  } catch {
    return null;
  }
}

function saveAuth(token: string, user: AuthUser) {
  authToken = token;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}

function clearAuth() {
  authToken = "";
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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
  getAuthToken() {
    return authToken;
  },

  getStoredAdmin() {
    return getStoredUser();
  },

  logout() {
    clearAuth();
  },

  async login(email: string, password: string) {
    const result = await request<LoginResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    saveAuth(result.token, result.user);
    return result;
  },

  async getCurrentAdmin() {
    const result = await request<{ user: AuthUser }>("/auth/me");
    if (authToken) saveAuth(authToken, result.user);
    return result.user;
  },

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

  deleteService(code: string) {
    return request<{ code: string; active: boolean }>(`/services/${encodeURIComponent(code)}`, {
      method: "DELETE",
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

  getTokenCounters() {
    return request<Record<string, number>>("/tokens/counters");
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

  addUser(user: Pick<AdminUser, "name" | "email" | "role"> & { password: string }) {
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

  submitFeedback(payload: { rating: number; comment?: string; mobile?: string; serviceCode?: string; serviceName?: string }) {
    return request<{ id: number }>("/feedback", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

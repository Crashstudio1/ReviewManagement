import { useState, useCallback, useEffect } from "react";
import { HomeScreen } from "./components/HomeScreen";
import { DEFAULT_SERVICES, ServiceSelection, type Service } from "./components/ServiceSelection";
import { TokenGenerated } from "./components/TokenGenerated";
import { ReviewScreen } from "./components/ReviewScreen";
import { ThankYouScreen } from "./components/ThankYouScreen";
import { AdminLogin } from "./components/AdminLogin";
import { AdminDashboard } from "./components/AdminDashboard";
import { AnalyticsPage } from "./components/AnalyticsPage";
import { api, type AuthUser, type TokenUsageByYear } from "./api";

/* MARKER-MAKE-KIT-INVOKED */

type Screen =
  | "home"
  | "service-select"
  | "token-generated"
  | "review"
  | "thank-you"
  | "admin-login"
  | "admin-dashboard"
  | "analytics";

interface GeneratedToken {
  token: string;
  serviceCode: string;
  serviceName: string;
  serviceEmoji: string;
  counterNumber: string;
}

const SERVICES_STORAGE_KEY = "gov-citizen-review-services";
const TOKEN_USAGE_STORAGE_KEY = "gov-citizen-review-token-usage";
const TEMPORARY_TOKEN_MIN = 300;
const TEMPORARY_TOKEN_MAX = 400;

function getTemporaryRandomTokenNumber() {
  return Math.floor(Math.random() * (TEMPORARY_TOKEN_MAX - TEMPORARY_TOKEN_MIN + 1)) + TEMPORARY_TOKEN_MIN;
}

function loadServices() {
  try {
    const saved = window.localStorage.getItem(SERVICES_STORAGE_KEY);
    if (!saved) return DEFAULT_SERVICES;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SERVICES;
  } catch {
    return DEFAULT_SERVICES;
  }
}

function loadTokenUsage(): TokenUsageByYear {
  try {
    const saved = window.localStorage.getItem(TOKEN_USAGE_STORAGE_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [services, setServices] = useState<Service[]>(loadServices);
  const [tokenCounters, setTokenCounters] = useState<Record<string, number>>({});
  const [tokenUsageByYear, setTokenUsageByYear] = useState<TokenUsageByYear>(loadTokenUsage);
  const [generatedToken, setGeneratedToken] = useState<GeneratedToken | null>(null);
  const [submittedRating, setSubmittedRating] = useState(5);
  const [adminUser, setAdminUser] = useState<AuthUser | null>(() => api.getStoredAdmin());
  // Track logo tap count for hidden admin entry
  const [logoTaps, setLogoTaps] = useState(0);

  const goHome = useCallback(() => setScreen("home"), []);

  useEffect(() => {
    window.localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    window.localStorage.setItem(TOKEN_USAGE_STORAGE_KEY, JSON.stringify(tokenUsageByYear));
  }, [tokenUsageByYear]);

  useEffect(() => {
    let cancelled = false;

    api.getServices()
      .then((apiServices) => {
        if (!cancelled && apiServices.length > 0) {
          setServices(apiServices);
        }
      })
      .catch(() => {
        // MySQL API is optional for demo mode; localStorage remains the fallback.
      });

    api.getTokenUsageByYear()
      .then((usage) => {
        if (!cancelled) {
          setTokenUsageByYear(usage);
        }
      })
      .catch(() => {
        // Keep local yearly usage when the API is not available.
      });

    api.getTokenCounters()
      .then((counters) => {
        if (!cancelled) {
          setTokenCounters(counters);
        }
      })
      .catch(() => {
        // Keep local counters when the API is not available.
      });

    if (api.getAuthToken()) {
      api.getCurrentAdmin()
        .then((user) => {
          if (!cancelled) setAdminUser(user);
        })
        .catch(() => {
          api.logout();
          if (!cancelled) setAdminUser(null);
        });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  function recordTokenUsage(year: string, serviceCode: string) {
    setTokenUsageByYear((prev) => {
      const yearUsage = prev[year] || {};
      return {
        ...prev,
        [year]: {
          ...yearUsage,
          [serviceCode]: (yearUsage[serviceCode] || 0) + 1,
        },
      };
    });
  }

  async function handleSelectService(svc: Service) {
    try {
      const issued = await api.issueToken(svc);
      const numericTokenPart = Number(issued.token.replace(svc.code, ""));
      if (Number.isFinite(numericTokenPart)) {
        setTokenCounters((prev) => ({
          ...prev,
          [svc.code]: Math.max(prev[svc.code] || 0, numericTokenPart),
        }));
      }
      recordTokenUsage(String(issued.issuedYear), svc.code);
      setGeneratedToken({
        token: issued.token,
        serviceCode: issued.service.code,
        serviceName: issued.service.en,
        serviceEmoji: issued.service.emoji,
        counterNumber: issued.service.counterNumber || svc.counterNumber || "",
      });
      setScreen("token-generated");
      api.getTokenCounters()
        .then(setTokenCounters)
        .catch(() => {});
      return;
    } catch {
      // Fall back to local token issuing when the MySQL API is unavailable.
    }

    const tokenNumber = getTemporaryRandomTokenNumber();
    const token = `${svc.code}${String(tokenNumber).padStart(3, "0")}`;
    setTokenCounters((prev) => ({ ...prev, [svc.code]: tokenNumber }));
    recordTokenUsage(String(new Date().getFullYear()), svc.code);
    setGeneratedToken({
      token,
      serviceCode: svc.code,
      serviceName: svc.en,
      serviceEmoji: svc.emoji,
      counterNumber: svc.counterNumber || "",
    });
    setScreen("token-generated");
  }

  function handleReviewSubmit(rating: number, comment = "", mobile = "", serviceCode = "", serviceName = "") {
    api.submitFeedback({ rating, comment, mobile, serviceCode, serviceName }).catch(() => {
      // Feedback still completes in offline/demo mode.
    });
    setSubmittedRating(rating);
    setScreen("thank-you");
  }

  async function handleAddService(service: Service) {
    try {
      const saved = await api.addService(service);
      setServices((prev) => [...prev, saved]);
      return saved;
    } catch {
      setServices((prev) => [...prev, service]);
      return service;
    }
  }

  async function handleUpdateService(currentCode: string, service: Service) {
    const oldCode = currentCode.trim().toUpperCase();
    let saved = service;

    try {
      saved = await api.updateService(currentCode, service);
    } catch {
      // Keep service editing available in offline/demo mode.
    }

    const newCode = saved.code.trim().toUpperCase();
    setServices((prev) => prev.map((item) => (
      item.code.trim().toUpperCase() === oldCode ? saved : item
    )));

    if (oldCode !== newCode) {
      setTokenCounters((prev) => {
        const { [oldCode]: oldCount, ...rest } = prev;
        if (oldCount === undefined) return rest;
        return {
          ...rest,
          [newCode]: Math.max(rest[newCode] || 0, oldCount),
        };
      });

      setTokenUsageByYear((prev) => {
        const nextUsage: TokenUsageByYear = {};
        for (const [year, usage] of Object.entries(prev)) {
          const { [oldCode]: oldTotal, ...rest } = usage;
          nextUsage[year] = oldTotal === undefined
            ? rest
            : {
                ...rest,
                [newCode]: (rest[newCode] || 0) + oldTotal,
              };
        }
        return nextUsage;
      });
    }

    return saved;
  }

  async function handleDeleteService(code: string) {
    const normalizedCode = code.trim().toUpperCase();
    try {
      await api.deleteService(normalizedCode);
    } catch {
      // Keep local service deletion available in offline/demo mode.
    }

    setServices((prev) => prev.filter((item) => item.code.trim().toUpperCase() !== normalizedCode));
    setTokenCounters((prev) => {
      const { [normalizedCode]: _removed, ...rest } = prev;
      return rest;
    });
  }

  function handleAdminLogin(user: AuthUser) {
    setAdminUser(user);
    setScreen("admin-dashboard");
  }

  function handleAdminLogout() {
    api.logout();
    setAdminUser(null);
    setScreen("admin-login");
  }

  // Secret admin entry: tap the footer 5 times on the home screen
  function handleFooterTap() {
    const next = logoTaps + 1;
    setLogoTaps(next);
    if (next >= 5) {
      setLogoTaps(0);
      setScreen("admin-login");
    }
  }

  return (
    <div
      className="size-full overflow-auto"
      style={{ fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif" }}
    >
      {screen === "home" && (
        <div className="flex flex-col min-h-screen">
          <div className="flex-1">
            <HomeScreen
              onGetToken={() => setScreen("service-select")}
              onGiveFeedback={() => setScreen("review")}
            />
          </div>
          {/* Hidden admin entry — tap footer 5× */}
          <div
            className="fixed bottom-0 left-0 right-0 flex items-center justify-center"
            style={{ zIndex: 50 }}
          >
            <button
              onClick={handleFooterTap}
              className="px-6 py-1 text-xs opacity-0 hover:opacity-0 focus:opacity-0 select-none"
              tabIndex={-1}
              aria-hidden="true"
            >
              .
            </button>
          </div>
          {/* Visible admin link for demo */}
          <div className="fixed bottom-4 right-4 z-50">
            <button
              onClick={() => setScreen("admin-login")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all duration-150 active:scale-95"
              style={{
                background: "rgba(60,0,16,0.9)",
                color: "rgba(212,175,55,0.9)",
                border: "1px solid rgba(212,175,55,0.3)",
                backdropFilter: "blur(8px)",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(128,0,32,0.95)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(60,0,16,0.9)")}
            >
              🔒 Admin
            </button>
          </div>
        </div>
      )}

      {screen === "service-select" && (
        <ServiceSelection
          onSelect={handleSelectService}
          onBack={goHome}
          services={services}
        />
      )}

      {screen === "token-generated" && generatedToken && (
        <TokenGenerated
          token={generatedToken.token}
          serviceName={generatedToken.serviceName}
          serviceEmoji={generatedToken.serviceEmoji}
          counterNumber={generatedToken.counterNumber}
          onHome={goHome}
        />
      )}

      {screen === "review" && (
        <ReviewScreen
          onSubmit={handleReviewSubmit}
          onBack={goHome}
          services={services}
          initialServiceCode={generatedToken?.serviceCode || ""}
        />
      )}

      {screen === "thank-you" && (
        <ThankYouScreen
          rating={submittedRating}
          onHome={goHome}
        />
      )}

      {screen === "admin-login" && (
        <AdminLogin
          onLogin={handleAdminLogin}
          onBack={goHome}
        />
      )}

      {screen === "admin-dashboard" && adminUser && (
        <AdminDashboard
          onNavigate={(p) => setScreen(p as Screen)}
          onLogout={handleAdminLogout}
          adminUser={adminUser}
          services={services}
          onAddService={handleAddService}
          onUpdateService={handleUpdateService}
          onDeleteService={handleDeleteService}
          tokenUsageByYear={tokenUsageByYear}
        />
      )}

      {screen === "admin-dashboard" && !adminUser && (
        <AdminLogin
          onLogin={handleAdminLogin}
          onBack={goHome}
        />
      )}

      {screen === "analytics" && adminUser && (
        <AnalyticsPage
          onBack={() => setScreen("admin-dashboard")}
        />
      )}

      {screen === "analytics" && !adminUser && (
        <AdminLogin
          onLogin={handleAdminLogin}
          onBack={goHome}
        />
      )}
    </div>
  );
}

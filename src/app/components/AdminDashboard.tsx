import { useState } from "react";
import {
  BarChart2, Users, Star, ThumbsUp, ThumbsDown,
  LayoutDashboard, FileText, Settings, LogOut,
  TrendingUp, MessageSquare, ChevronRight, Menu, X, PlusCircle
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import { DevelopingPartner } from "./DevelopingPartner";
import { GovernmentLogo } from "./GovernmentLogo";
import { type Service } from "./ServiceSelection";

const REVIEWS = [
  { id: 1, date: "2024-06-12 09:14", rating: 5, comment: "Excellent service, very fast processing!", mobile: "077*****23", status: "Positive" },
  { id: 2, date: "2024-06-12 09:42", rating: 2, comment: "Long waiting time, staff not responsive.", mobile: "076*****88", status: "Negative" },
  { id: 3, date: "2024-06-12 10:05", rating: 4, comment: "Good service overall.", mobile: "—", status: "Positive" },
  { id: 4, date: "2024-06-12 10:38", rating: 3, comment: "Average experience. Could be better.", mobile: "071*****45", status: "Neutral" },
  { id: 5, date: "2024-06-12 11:02", rating: 5, comment: "Very professional and courteous staff!", mobile: "—", status: "Positive" },
  { id: 6, date: "2024-06-12 11:29", rating: 1, comment: "Waiting too long, poor facilities.", mobile: "075*****67", status: "Negative" },
  { id: 7, date: "2024-06-12 12:10", rating: 4, comment: "Quick and efficient.", mobile: "—", status: "Positive" },
  { id: 8, date: "2024-06-12 13:05", rating: 5, comment: "Excellent! Thank you.", mobile: "077*****12", status: "Positive" },
];

const RATING_DIST = [
  { name: "1 ★", count: 3, fill: "#C62828" },
  { name: "2 ★", count: 5, fill: "#B03A48" },
  { name: "3 ★", count: 8, fill: "#D4AF37" },
  { name: "4 ★", count: 18, fill: "#388E3C" },
  { name: "5 ★", count: 24, fill: "#2E7D32" },
];

const MONTHLY = [
  { month: "Jan", reviews: 62, avg: 3.8 },
  { month: "Feb", reviews: 78, avg: 4.0 },
  { month: "Mar", reviews: 91, avg: 3.9 },
  { month: "Apr", reviews: 84, avg: 4.2 },
  { month: "May", reviews: 110, avg: 4.4 },
  { month: "Jun", reviews: 58, avg: 4.3 },
];

type NavItem = { id: string; label: string; icon: React.ReactNode };

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "services", label: "Services", icon: <PlusCircle size={18} /> },
  { id: "reviews", label: "Reviews", icon: <MessageSquare size={18} /> },
  { id: "analytics", label: "Analytics", icon: <BarChart2 size={18} /> },
  { id: "reports", label: "Reports", icon: <FileText size={18} /> },
  { id: "settings", label: "Settings", icon: <Settings size={18} /> },
  { id: "users", label: "Users", icon: <Users size={18} /> },
];

function getNextServiceCode(services: Service[]) {
  const used = new Set(services.map((service) => service.code.trim().toUpperCase()));
  for (let charCode = 65; charCode <= 90; charCode += 1) {
    const candidate = String.fromCharCode(charCode);
    if (!used.has(candidate)) return candidate;
  }

  let index = services.length + 1;
  let candidate = `S${index}`;
  while (used.has(candidate)) {
    index += 1;
    candidate = `S${index}`;
  }
  return candidate;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          fill={i <= rating ? "var(--gov-gold)" : "transparent"}
          color={i <= rating ? "var(--gov-gold)" : "#D1C5B8"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Positive: "#E8F5E9",
    Negative: "#FFEBEE",
    Neutral: "#FFF8E1",
  };
  const textMap: Record<string, string> = {
    Positive: "#2E7D32",
    Negative: "#C62828",
    Neutral: "#F57F17",
  };
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: map[status] || "#eee", color: textMap[status] || "#333", fontFamily: "'Inter', sans-serif" }}
    >
      {status}
    </span>
  );
}

interface ServicesAdminPanelProps {
  services: Service[];
  form: Service;
  suggestedCode: string;
  error: string;
  message: string;
  onChange: (field: keyof Service, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

type TokenUsageByYear = Record<string, Record<string, number>>;

function ServicesAdminPanel({
  services,
  form,
  suggestedCode,
  error,
  message,
  onChange,
  onSubmit,
}: ServicesAdminPanelProps) {
  const inputStyle: React.CSSProperties = {
    border: "1.5px solid var(--border)",
    color: "var(--foreground)",
    fontFamily: "'Noto Sans Sinhala', 'Noto Sans Tamil', 'Inter', sans-serif",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-semibold" style={{ color: "var(--gov-maroon)", fontSize: "1.15rem" }}>
            Service Details
          </h2>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Add services in English, Tamil, and Sinhala for the citizen kiosk.
          </p>
        </div>
        <div
          className="w-fit rounded-xl px-4 py-2 text-sm font-semibold"
          style={{ background: "#fff", border: "1px solid var(--border)", color: "var(--gov-maroon)" }}
        >
          {services.length} active services
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 lg:grid-cols-[0.85fr_1.5fr]">
        <div
          className="rounded-2xl p-5 shadow-sm"
          style={{ background: "#fff", border: "1px solid var(--border)" }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: "#FFF0F3", color: "var(--gov-maroon)" }}
            >
              <PlusCircle size={22} />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: "var(--gov-maroon)" }}>
                Add New Service
              </h3>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Suggested next code: {suggestedCode}
              </p>
            </div>
          </div>

          <label className="mb-2 block text-sm font-semibold" htmlFor="service-code">
            Service Code
          </label>
          <input
            id="service-code"
            value={form.code}
            onChange={(event) => onChange("code", event.target.value.toUpperCase())}
            className="mb-4 w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
            style={{ ...inputStyle, "--tw-ring-color": "var(--gov-maroon)" } as React.CSSProperties}
            placeholder={suggestedCode}
            maxLength={4}
          />

          <label className="mb-2 block text-sm font-semibold" htmlFor="service-emoji">
            Icon / Emoji
          </label>
          <input
            id="service-emoji"
            value={form.emoji}
            onChange={(event) => onChange("emoji", event.target.value)}
            className="mb-5 w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
            style={{ ...inputStyle, "--tw-ring-color": "var(--gov-maroon)" } as React.CSSProperties}
            placeholder="📋"
            maxLength={4}
          />

          {error && (
            <div
              className="mb-4 rounded-xl px-4 py-3 text-sm"
              style={{ background: "#FFEBEE", border: "1px solid #FFCDD2", color: "#C62828" }}
            >
              {error}
            </div>
          )}

          {message && (
            <div
              className="mb-4 rounded-xl px-4 py-3 text-sm"
              style={{ background: "#E8F5E9", border: "1px solid #A5D6A7", color: "#1B5E20" }}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, var(--gov-maroon-dark) 0%, var(--gov-maroon) 100%)" }}
          >
            <PlusCircle size={17} />
            Add Service
          </button>
        </div>

        <div
          className="rounded-2xl p-5 shadow-sm"
          style={{ background: "#fff", border: "1px solid var(--border)" }}
        >
          <h3 className="mb-4 font-semibold" style={{ color: "var(--gov-maroon)" }}>
            Service Names
          </h3>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold" htmlFor="service-en">
                English Name
              </label>
              <input
                id="service-en"
                value={form.en}
                onChange={(event) => onChange("en", event.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ ...inputStyle, "--tw-ring-color": "var(--gov-maroon)" } as React.CSSProperties}
                placeholder="Example: Waste Collection"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold" htmlFor="service-ta">
                Tamil Name
              </label>
              <input
                id="service-ta"
                value={form.ta}
                onChange={(event) => onChange("ta", event.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ ...inputStyle, "--tw-ring-color": "var(--gov-maroon)" } as React.CSSProperties}
                placeholder="உதா: கழிவு சேகரிப்பு"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold" htmlFor="service-si">
                Sinhala Name
              </label>
              <input
                id="service-si"
                value={form.si}
                onChange={(event) => onChange("si", event.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ ...inputStyle, "--tw-ring-color": "var(--gov-maroon)" } as React.CSSProperties}
                placeholder="උදා: කසළ එකතු කිරීම"
              />
            </div>
          </div>
        </div>
      </form>

      <div
        className="overflow-hidden rounded-2xl shadow-sm"
        style={{ background: "#fff", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-semibold" style={{ color: "var(--gov-maroon)", fontSize: "0.95rem" }}>
            Current Services
          </h3>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            These appear on the kiosk service selection screen.
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--gov-cream)" }}>
                {["Code", "Icon", "English", "Tamil", "Sinhala"].map((header) => (
                  <th
                    key={header}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.code} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-5 py-3.5 text-sm font-bold" style={{ color: "var(--gov-maroon)" }}>
                    {service.code}
                  </td>
                  <td className="px-5 py-3.5 text-xl">{service.emoji}</td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "var(--foreground)" }}>
                    {service.en}
                  </td>
                  <td
                    className="px-5 py-3.5 text-sm"
                    style={{ color: "var(--foreground)", fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif" }}
                  >
                    {service.ta}
                  </td>
                  <td
                    className="px-5 py-3.5 text-sm"
                    style={{ color: "var(--foreground)", fontFamily: "'Noto Sans Sinhala', 'Inter', sans-serif" }}
                  >
                    {service.si}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface YearlyTokenUsagePanelProps {
  services: Service[];
  tokenUsageByYear: TokenUsageByYear;
  selectedYear: string;
  onYearChange: (year: string) => void;
}

function YearlyTokenUsagePanel({
  services,
  tokenUsageByYear,
  selectedYear,
  onYearChange,
}: YearlyTokenUsagePanelProps) {
  const currentYear = String(new Date().getFullYear());
  const years = Array.from(new Set([currentYear, ...Object.keys(tokenUsageByYear)]))
    .sort((a, b) => Number(b) - Number(a));
  const usageForYear = tokenUsageByYear[selectedYear] || {};
  const rows = services.map((service) => ({
    ...service,
    count: usageForYear[service.code] || 0,
  }));
  const totalTokens = rows.reduce((sum, row) => sum + row.count, 0);
  const busiestService = rows.reduce<Service & { count: number } | null>(
    (best, row) => (!best || row.count > best.count ? row : best),
    null,
  );
  const chartData = rows.map((row) => ({
    code: row.code,
    service: row.en,
    tokens: row.count,
  }));

  return (
    <div
      className="rounded-2xl shadow-sm overflow-hidden"
      style={{ background: "#fff", border: "1px solid var(--border)" }}
    >
      <div
        className="flex flex-col gap-4 border-b px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <h3 className="font-semibold" style={{ color: "var(--gov-maroon)", fontSize: "1rem" }}>
            Yearly Token Usage by Service
          </h3>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Number of queue tokens issued for every service in the selected year.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div
            className="rounded-xl px-4 py-2 text-sm"
            style={{ background: "var(--gov-cream)", color: "var(--gov-maroon)" }}
          >
            <span className="font-semibold">{totalTokens}</span> tokens in {selectedYear}
          </div>
          <select
            value={selectedYear}
            onChange={(event) => onYearChange(event.target.value)}
            className="rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2"
            style={{
              background: "#fff",
              border: "1.5px solid var(--border)",
              color: "var(--foreground)",
              "--tw-ring-color": "var(--gov-maroon)",
            } as React.CSSProperties}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-5">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="code" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }}
                formatter={(value: number, name: string, item) => [value, item.payload.service]}
                cursor={{ fill: "var(--muted)", opacity: 0.35 }}
              />
              <Bar dataKey="tokens" name="Tokens" fill="var(--gov-maroon)" radius={[6, 6, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.code}
                    fill={busiestService && entry.code === busiestService.code && entry.tokens > 0 ? "var(--gov-gold)" : "var(--gov-maroon)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto border-t lg:border-l lg:border-t-0" style={{ borderColor: "var(--border)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--gov-cream)" }}>
                {["Service", "Code", "Tokens"].map((header) => (
                  <th
                    key={header}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.code} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{row.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                          {row.en}
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {row.si || row.ta}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-bold" style={{ color: "var(--gov-maroon)" }}>
                    {row.code}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-bold" style={{ color: row.count > 0 ? "var(--gov-maroon)" : "var(--muted-foreground)" }}>
                    {row.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
  services: Service[];
  onAddService: (service: Service) => Promise<Service> | Service;
  tokenUsageByYear: TokenUsageByYear;
}

export function AdminDashboard({ onNavigate, services, onAddService, tokenUsageByYear }: AdminDashboardProps) {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTokenYear, setSelectedTokenYear] = useState(String(new Date().getFullYear()));
  const suggestedCode = getNextServiceCode(services);
  const [serviceForm, setServiceForm] = useState<Service>({
    emoji: "📋",
    code: suggestedCode,
    en: "",
    ta: "",
    si: "",
  });
  const [serviceError, setServiceError] = useState("");
  const [serviceMessage, setServiceMessage] = useState("");

  function navigate(id: string) {
    if (id === "analytics") { onNavigate("analytics"); return; }
    setActive(id);
    setSidebarOpen(false);
  }

  function updateServiceForm(field: keyof Service, value: string) {
    setServiceForm((prev) => ({ ...prev, [field]: value }));
    setServiceError("");
    setServiceMessage("");
  }

  async function handleAddService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextService: Service = {
      emoji: serviceForm.emoji.trim() || "📋",
      code: serviceForm.code.trim().toUpperCase(),
      en: serviceForm.en.trim(),
      ta: serviceForm.ta.trim(),
      si: serviceForm.si.trim(),
    };

    if (!nextService.code || !nextService.en || !nextService.ta || !nextService.si) {
      setServiceError("Please enter code, English, Tamil, and Sinhala service names.");
      return;
    }

    const duplicateCode = services.some(
      (service) => service.code.trim().toUpperCase() === nextService.code,
    );
    if (duplicateCode) {
      setServiceError(`Service code ${nextService.code} is already used.`);
      return;
    }

    const savedService = await onAddService(nextService);
    const updatedServices = [...services, savedService];
    setServiceForm({
      emoji: "📋",
      code: getNextServiceCode(updatedServices),
      en: "",
      ta: "",
      si: "",
    });
    setServiceMessage(`${savedService.en} was added to the kiosk service list.`);
  }

  const selectedYearUsage = tokenUsageByYear[selectedTokenYear] || {};
  const selectedYearTokenTotal = Object.values(selectedYearUsage).reduce((sum, count) => sum + count, 0);
  const stats = [
    { label: `Tokens in ${selectedTokenYear}`, value: String(selectedYearTokenTotal), icon: <FileText size={22} />, color: "var(--gov-maroon)", bg: "#FFF0F3" },
    { label: "Average Rating", value: "4.3 ★", icon: <Star size={22} />, color: "var(--gov-gold)", bg: "#FFFDE7" },
    { label: "Positive Reviews", value: "42", icon: <ThumbsUp size={22} />, color: "var(--gov-success)", bg: "#E8F5E9" },
    { label: "Negative Reviews", value: "8", icon: <ThumbsDown size={22} />, color: "#C62828", bg: "#FFEBEE" },
  ];
  const activeLabel = NAV.find((item) => item.id === active)?.label ?? "Dashboard";

  return (
    <div className="flex min-h-screen" style={{ background: "var(--gov-cream)", fontFamily: "'Inter', sans-serif" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className="fixed lg:static z-30 top-0 left-0 h-full flex flex-col transition-transform duration-300"
        style={{
          width: 240,
          background: "linear-gradient(180deg, #21000A 0%, #4D0015 48%, #7A001F 100%)",
          borderRight: "2px solid rgba(212,175,55,0.38)",
          boxShadow: "12px 0 32px rgba(61,0,16,0.22)",
          transform: sidebarOpen ? "translateX(0)" : undefined,
        }}
      >
        {/* Sidebar header */}
        <div className="px-5 py-6 border-b" style={{ borderColor: "rgba(212,175,55,0.28)" }}>
          <div className="flex items-center gap-3">
            <GovernmentLogo className="h-12 w-12 rounded-xl p-0.5" />
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Pradeshiya Sabha</p>
              <p className="text-white/60 text-xs">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-150 text-left"
              style={{
                background: active === item.id ? "rgba(212,175,55,0.18)" : "rgba(255,255,255,0.04)",
                border: active === item.id ? "1px solid rgba(212,175,55,0.5)" : "1px solid transparent",
                boxShadow: active === item.id ? "inset 4px 0 0 #D4AF37" : "none",
                color: active === item.id ? "#FFE08A" : "rgba(255,255,255,0.88)",
                fontWeight: active === item.id ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (active !== item.id) {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = "rgba(255,255,255,0.12)";
                  el.style.color = "#fff";
                }
              }}
              onMouseLeave={(e) => {
                if (active !== item.id) {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = "rgba(255,255,255,0.04)";
                  el.style.color = "rgba(255,255,255,0.88)";
                }
              }}
            >
              {item.icon}
              {item.label}
              {active === item.id && <ChevronRight size={14} className="ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="px-3 pb-6 space-y-2">
          <div className="h-px mx-2 mb-3" style={{ background: "rgba(212,175,55,0.22)" }} />
          <button
            onClick={() => onNavigate("admin-login")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors text-left"
            style={{ color: "rgba(255,255,255,0.72)", background: "rgba(255,255,255,0.04)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.72)";
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
          <div
            className="rounded-xl px-3 py-3 text-xs leading-relaxed"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(212,175,55,0.18)",
              color: "rgba(255,255,255,0.68)",
            }}
          >
            <DevelopingPartner linkClassName="text-[var(--gov-gold)] underline underline-offset-2 hover:text-white" />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b shadow-sm"
          style={{ background: "#fff", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h2 className="font-semibold" style={{ color: "var(--gov-maroon)", fontSize: "1.1rem" }}>
                {active === "dashboard" ? "Admin Dashboard" : activeLabel}
              </h2>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Wednesday, 12 June 2024
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "var(--gov-maroon)" }}
            >
              A
            </div>
            <span className="text-sm hidden sm:block" style={{ color: "var(--foreground)" }}>Admin</span>
          </div>
        </header>

        {/* Gold bar */}
        <div className="h-0.5" style={{ background: "var(--gov-gold)" }} />

        {/* Page body */}
        <main className="flex-1 p-6 space-y-6">
          {active === "services" ? (
            <ServicesAdminPanel
              services={services}
              form={serviceForm}
              suggestedCode={suggestedCode}
              error={serviceError}
              message={serviceMessage}
              onChange={updateServiceForm}
              onSubmit={handleAddService}
            />
          ) : (
            <>
          <div
            className="flex flex-col gap-3 rounded-2xl p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            style={{ background: "#fff", border: "1px solid var(--border)" }}
          >
            <div>
              <h3 className="font-semibold" style={{ color: "var(--gov-maroon)", fontSize: "0.95rem" }}>
                Service Management
              </h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Add or review kiosk services with English, Tamil, and Sinhala names.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActive("services")}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md transition-all active:scale-[0.98] sm:w-auto"
              style={{ background: "linear-gradient(135deg, var(--gov-maroon-dark) 0%, var(--gov-maroon) 100%)" }}
            >
              <PlusCircle size={17} />
              Manage Services
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 shadow-sm"
                style={{ background: "#fff", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.icon}
                  </div>
                  <TrendingUp size={14} style={{ color: "var(--gov-success)" }} />
                </div>
                <p
                  className="mb-1"
                  style={{ fontSize: "1.6rem", fontWeight: 700, color: s.color, lineHeight: 1 }}
                >
                  {s.value}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          <YearlyTokenUsagePanel
            services={services}
            tokenUsageByYear={tokenUsageByYear}
            selectedYear={selectedTokenYear}
            onYearChange={setSelectedTokenYear}
          />

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rating distribution */}
            <div
              className="rounded-2xl p-5 shadow-sm"
              style={{ background: "#fff", border: "1px solid var(--border)" }}
            >
              <h3
                className="mb-4 font-semibold"
                style={{ color: "var(--gov-maroon)", fontSize: "0.95rem" }}
              >
                Star Rating Distribution
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={RATING_DIST} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }}
                    cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {RATING_DIST.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly trend */}
            <div
              className="rounded-2xl p-5 shadow-sm"
              style={{ background: "#fff", border: "1px solid var(--border)" }}
            >
              <h3
                className="mb-4 font-semibold"
                style={{ color: "var(--gov-maroon)", fontSize: "0.95rem" }}
              >
                Monthly Feedback Trend
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={MONTHLY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="reviews"
                    stroke="var(--gov-maroon)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "var(--gov-maroon)", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Reviews Table */}
          <div
            className="rounded-2xl shadow-sm overflow-hidden"
            style={{ background: "#fff", border: "1px solid var(--border)" }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <h3 className="font-semibold" style={{ color: "var(--gov-maroon)", fontSize: "0.95rem" }}>
                Recent Reviews
              </h3>
              <button
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                style={{ background: "var(--gov-cream)", color: "var(--gov-maroon)" }}
              >
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--gov-cream)" }}>
                    {["Date & Time", "Rating", "Comment", "Mobile", "Status"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REVIEWS.map((r, i) => (
                    <tr
                      key={r.id}
                      className="border-t transition-colors hover:bg-[#FAF8F6]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td className="px-5 py-3.5 text-xs" style={{ color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>
                        {r.date}
                      </td>
                      <td className="px-5 py-3.5">
                        <StarRating rating={r.rating} />
                      </td>
                      <td
                        className="px-5 py-3.5 text-sm max-w-[220px] truncate"
                        style={{ color: "var(--foreground)" }}
                        title={r.comment}
                      >
                        {r.comment || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
                        {r.mobile}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

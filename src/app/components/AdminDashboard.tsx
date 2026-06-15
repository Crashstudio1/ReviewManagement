import { useEffect, useState } from "react";
import {
  BarChart2, Users, Star, ThumbsUp, ThumbsDown,
  LayoutDashboard, FileText, Settings, LogOut,
  TrendingUp, MessageSquare, ChevronRight, Menu, X, PlusCircle, Pencil, Save, RotateCcw,
  Download, RefreshCw, Trash2, UserPlus
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import { DevelopingPartner } from "./DevelopingPartner";
import { GovernmentLogo } from "./GovernmentLogo";
import { type Service } from "./ServiceSelection";
import {
  api,
  type AdminSettings,
  type AdminUser,
  type AuthUser,
  type FeedbackReview,
  type FeedbackSummary,
  type TokenReportRow,
} from "../api";

const EMPTY_FEEDBACK_SUMMARY: FeedbackSummary = {
  total: 0,
  averageRating: 0,
  positive: 0,
  negative: 0,
  neutral: 0,
  ratingDistribution: [1, 2, 3, 4, 5].map((rating) => ({ rating, count: 0 })),
  monthlyTrend: [],
};

const RATING_COLORS: Record<number, string> = {
  1: "#C62828",
  2: "#B03A48",
  3: "#D4AF37",
  4: "#388E3C",
  5: "#2E7D32",
};

function csvValue(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>, columns: Array<{ key: string; label: string }>) {
  const csv = [
    columns.map((column) => csvValue(column.label)).join(","),
    ...rows.map((row) => columns.map((column) => csvValue(row[column.key])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

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
  editingServiceCode: string | null;
  onChange: (field: keyof Service, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onEditService: (service: Service) => void;
  onDeleteService: (service: Service) => void;
  onCancelEdit: () => void;
}

type TokenUsageByYear = Record<string, Record<string, number>>;

function ServicesAdminPanel({
  services,
  form,
  suggestedCode,
  error,
  message,
  editingServiceCode,
  onChange,
  onSubmit,
  onEditService,
  onDeleteService,
  onCancelEdit,
}: ServicesAdminPanelProps) {
  const isEditing = Boolean(editingServiceCode);
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
            Add or update services in English, Tamil, and Sinhala for the citizen kiosk.
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
              {isEditing ? <Pencil size={22} /> : <PlusCircle size={22} />}
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: "var(--gov-maroon)" }}>
                {isEditing ? "Edit Service" : "Add New Service"}
              </h3>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                {isEditing ? `Editing service code: ${editingServiceCode}` : `Suggested next code: ${suggestedCode}`}
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
            {isEditing ? <Save size={17} /> : <PlusCircle size={17} />}
            {isEditing ? "Save Changes" : "Add Service"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98]"
              style={{
                background: "#fff",
                border: "1.5px solid var(--border)",
                color: "var(--gov-maroon)",
              }}
            >
              <RotateCcw size={16} />
              Cancel Edit
            </button>
          )}
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
                {["Code", "Icon", "English", "Tamil", "Sinhala", "Actions"].map((header) => (
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
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEditService(service)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
                        style={{
                          background: editingServiceCode === service.code ? "var(--gov-maroon)" : "var(--gov-cream)",
                          color: editingServiceCode === service.code ? "#fff" : "var(--gov-maroon)",
                        }}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteService(service)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
                        style={{ background: "#FFEBEE", color: "#C62828" }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
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

function ReportsAdminPanel({
  feedbackReport,
  tokenReport,
  error,
  onRefresh,
}: {
  feedbackReport: FeedbackReview[];
  tokenReport: TokenReportRow[];
  error: string;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-semibold" style={{ color: "var(--gov-maroon)", fontSize: "1.15rem" }}>
            Reports
          </h2>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Export live feedback and token data for Excel analysis.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
          style={{ background: "#fff", border: "1px solid var(--border)", color: "var(--gov-maroon)" }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "#FFEBEE", border: "1px solid #FFCDD2", color: "#C62828" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl p-5 shadow-sm" style={{ background: "#fff", border: "1px solid var(--border)" }}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold" style={{ color: "var(--gov-maroon)" }}>Feedback Report</h3>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{feedbackReport.length} feedback rows</p>
            </div>
            <button
              type="button"
              onClick={() => downloadCsv("feedback-report.csv", feedbackReport as unknown as Array<Record<string, unknown>>, [
                { key: "id", label: "ID" },
                { key: "date", label: "Date & Time" },
                { key: "rating", label: "Rating" },
                { key: "comment", label: "Comment" },
                { key: "mobile", label: "Contact Number" },
                { key: "status", label: "Status" },
              ])}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "var(--gov-maroon)" }}
            >
              <Download size={16} />
              Export Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--gov-cream)" }}>
                  {["Date", "Rating", "Contact", "Status"].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: "var(--muted-foreground)" }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {feedbackReport.slice(0, 8).map((row) => (
                  <tr key={row.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{row.date}</td>
                    <td className="px-4 py-3"><StarRating rating={row.rating} /></td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{row.mobile}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
                {feedbackReport.length === 0 && (
                  <tr className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                      No feedback records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl p-5 shadow-sm" style={{ background: "#fff", border: "1px solid var(--border)" }}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold" style={{ color: "var(--gov-maroon)" }}>Token Report</h3>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{tokenReport.length} issued tokens</p>
            </div>
            <button
              type="button"
              onClick={() => downloadCsv("token-report.csv", tokenReport as unknown as Array<Record<string, unknown>>, [
                { key: "id", label: "ID" },
                { key: "token", label: "Token" },
                { key: "serviceCode", label: "Service Code" },
                { key: "serviceName", label: "Service Name" },
                { key: "issuedYear", label: "Issued Year" },
                { key: "issuedAt", label: "Issued At" },
              ])}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "var(--gov-maroon)" }}
            >
              <Download size={16} />
              Export Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--gov-cream)" }}>
                  {["Token", "Service", "Year", "Issued"].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: "var(--muted-foreground)" }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tokenReport.slice(0, 8).map((row) => (
                  <tr key={row.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: "var(--gov-maroon)" }}>{row.token}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{row.serviceName}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>{row.issuedYear}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{row.issuedAt}</td>
                  </tr>
                ))}
                {tokenReport.length === 0 && (
                  <tr className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                      No token records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsAdminPanel({
  settings,
  message,
  error,
  onChange,
  onSubmit,
}: {
  settings: AdminSettings;
  message: string;
  error: string;
  onChange: (settings: AdminSettings) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h2 className="font-semibold" style={{ color: "var(--gov-maroon)", fontSize: "1.15rem" }}>Settings</h2>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Manage kiosk and reporting settings.</p>
      </div>
      <div className="rounded-2xl p-5 shadow-sm" style={{ background: "#fff", border: "1px solid var(--border)" }}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[
            ["organizationName", "Organization Name"],
            ["kioskTitle", "Kiosk Title"],
            ["supportPhone", "Support Phone"],
            ["reportEmail", "Report Email"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="mb-2 block text-sm font-semibold" htmlFor={`setting-${key}`}>{label}</label>
              <input
                id={`setting-${key}`}
                value={String(settings[key as keyof AdminSettings] || "")}
                onChange={(event) => onChange({ ...settings, [key]: event.target.value })}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ border: "1.5px solid var(--border)", "--tw-ring-color": "var(--gov-maroon)" } as React.CSSProperties}
              />
            </div>
          ))}
        </div>
        {message && <div className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: "#E8F5E9", color: "#1B5E20" }}>{message}</div>}
        {error && <div className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: "#FFEBEE", color: "#C62828" }}>{error}</div>}
        <button
          type="submit"
          className="mt-5 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
          style={{ background: "var(--gov-maroon)" }}
        >
          <Save size={16} />
          Save Settings
        </button>
      </div>
    </form>
  );
}

function UsersAdminPanel({
  users,
  form,
  error,
  onFormChange,
  onSubmit,
  onToggleUser,
}: {
  users: AdminUser[];
  form: { name: string; email: string; role: string; password: string };
  error: string;
  onFormChange: (form: { name: string; email: string; role: string; password: string }) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onToggleUser: (user: AdminUser) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold" style={{ color: "var(--gov-maroon)", fontSize: "1.15rem" }}>Users</h2>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Manage admin users who can operate the dashboard.</p>
      </div>
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 rounded-2xl p-5 shadow-sm lg:grid-cols-[1fr_1fr_0.9fr_0.7fr_auto]" style={{ background: "#fff", border: "1px solid var(--border)" }}>
        <input
          value={form.name}
          onChange={(event) => onFormChange({ ...form, name: event.target.value })}
          placeholder="Full name"
          className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
          style={{ border: "1.5px solid var(--border)", "--tw-ring-color": "var(--gov-maroon)" } as React.CSSProperties}
        />
        <input
          type="email"
          value={form.email}
          onChange={(event) => onFormChange({ ...form, email: event.target.value })}
          placeholder="Email address"
          className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
          style={{ border: "1.5px solid var(--border)", "--tw-ring-color": "var(--gov-maroon)" } as React.CSSProperties}
        />
        <input
          type="password"
          value={form.password}
          onChange={(event) => onFormChange({ ...form, password: event.target.value })}
          placeholder="Temporary password"
          className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
          style={{ border: "1.5px solid var(--border)", "--tw-ring-color": "var(--gov-maroon)" } as React.CSSProperties}
        />
        <select
          value={form.role}
          onChange={(event) => onFormChange({ ...form, role: event.target.value })}
          className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
          style={{ border: "1.5px solid var(--border)", "--tw-ring-color": "var(--gov-maroon)" } as React.CSSProperties}
        >
          <option>Administrator</option>
          <option>Supervisor</option>
          <option>Staff</option>
        </select>
        <button type="submit" className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white" style={{ background: "var(--gov-maroon)" }}>
          <UserPlus size={16} />
          Add
        </button>
        {error && <div className="lg:col-span-5 rounded-xl px-4 py-3 text-sm" style={{ background: "#FFEBEE", color: "#C62828" }}>{error}</div>}
      </form>

      <div className="overflow-hidden rounded-2xl shadow-sm" style={{ background: "#fff", border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--gov-cream)" }}>
                {["Name", "Email", "Role", "Status", "Action"].map((header) => (
                  <th key={header} className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: "var(--muted-foreground)" }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: "var(--foreground)" }}>{user.name}</td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "var(--muted-foreground)" }}>{user.email}</td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "var(--foreground)" }}>{user.role}</td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: user.active ? "#E8F5E9" : "#F5F5F5", color: user.active ? "#1B5E20" : "#777" }}>
                      {user.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button type="button" onClick={() => onToggleUser(user)} className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: "var(--gov-cream)", color: "var(--gov-maroon)" }}>
                      {user.active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>No admin users yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
  adminUser: AuthUser;
  services: Service[];
  onAddService: (service: Service) => Promise<Service> | Service;
  onUpdateService: (currentCode: string, service: Service) => Promise<Service> | Service;
  onDeleteService: (code: string) => Promise<void> | void;
  tokenUsageByYear: TokenUsageByYear;
}

export function AdminDashboard({
  onNavigate,
  onLogout,
  adminUser,
  services,
  onAddService,
  onUpdateService,
  onDeleteService,
  tokenUsageByYear,
}: AdminDashboardProps) {
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
  const [editingServiceCode, setEditingServiceCode] = useState<string | null>(null);
  const [recentReviews, setRecentReviews] = useState<FeedbackReview[]>([]);
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary>(EMPTY_FEEDBACK_SUMMARY);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackReport, setFeedbackReport] = useState<FeedbackReview[]>([]);
  const [tokenReport, setTokenReport] = useState<TokenReportRow[]>([]);
  const [reportError, setReportError] = useState("");
  const [settings, setSettings] = useState<AdminSettings>({});
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userForm, setUserForm] = useState({ name: "", email: "", role: "Staff", password: "" });
  const [userError, setUserError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAdminData() {
      try {
        const [reviews, summary, reportRows, tokenRows, loadedSettings, loadedUsers] = await Promise.all([
          api.getRecentFeedback(8),
          api.getFeedbackSummary(),
          api.getFeedbackReport(),
          api.getTokenReport(),
          api.getSettings(),
          api.getUsers(),
        ]);
        if (!cancelled) {
          setRecentReviews(reviews);
          setFeedbackSummary(summary);
          setFeedbackReport(reportRows);
          setTokenReport(tokenRows);
          setSettings(loadedSettings);
          setUsers(loadedUsers);
          setFeedbackError("");
          setReportError("");
          setSettingsError("");
          setUserError("");
        }
      } catch {
        if (!cancelled) {
          setRecentReviews([]);
          setFeedbackSummary(EMPTY_FEEDBACK_SUMMARY);
          setFeedbackError("Feedback data is unavailable.");
          setReportError("Report data is unavailable.");
        }
      }
    }

    loadAdminData();

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshReports() {
    try {
      const [reportRows, tokenRows] = await Promise.all([
        api.getFeedbackReport(),
        api.getTokenReport(),
      ]);
      setFeedbackReport(reportRows);
      setTokenReport(tokenRows);
      setReportError("");
    } catch {
      setReportError("Report data is unavailable.");
    }
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const saved = await api.updateSettings(settings);
      setSettings((prev) => ({ ...prev, ...saved }));
      setSettingsMessage("Settings were saved.");
      setSettingsError("");
    } catch {
      setSettingsMessage("");
      setSettingsError("Settings could not be saved.");
    }
  }

  async function addUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUserError("");

    try {
      const saved = await api.addUser(userForm);
      setUsers((prev) => [saved, ...prev]);
      setUserForm({ name: "", email: "", role: "Staff", password: "" });
    } catch (error) {
      setUserError(error instanceof Error ? error.message : "User could not be added.");
    }
  }

  async function toggleUser(user: AdminUser) {
    try {
      const updated = await api.updateUserStatus(user.id, !user.active);
      setUsers((prev) => prev.map((item) => (
        item.id === user.id ? { ...item, active: updated.active } : item
      )));
    } catch {
      setUserError("User status could not be updated.");
    }
  }

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

  function resetServiceForm(nextServices = services) {
    setServiceForm({
      emoji: "\uD83D\uDCCB",
      code: getNextServiceCode(nextServices),
      en: "",
      ta: "",
      si: "",
    });
    setEditingServiceCode(null);
  }

  function handleEditService(service: Service) {
    setEditingServiceCode(service.code.trim().toUpperCase());
    setServiceForm({ ...service, code: service.code.trim().toUpperCase() });
    setServiceError("");
    setServiceMessage("");
  }

  function handleCancelEdit() {
    resetServiceForm();
    setServiceError("");
    setServiceMessage("");
  }

  async function handleDeleteService(service: Service) {
    const confirmed = window.confirm(`Delete ${service.en} from the kiosk service list?`);
    if (!confirmed) return;

    try {
      await onDeleteService(service.code);
      if (editingServiceCode === service.code.trim().toUpperCase()) {
        resetServiceForm(services.filter((item) => item.code !== service.code));
      }
      setServiceMessage(`${service.en} was removed from the kiosk service list.`);
      setServiceError("");
    } catch (error) {
      setServiceMessage("");
      setServiceError(error instanceof Error ? error.message : "Service could not be deleted.");
    }
  }

  async function handleAddService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextService: Service = {
      emoji: serviceForm.emoji.trim() || "\uD83D\uDCCB",
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
      (service) => service.code.trim().toUpperCase() === nextService.code
        && service.code.trim().toUpperCase() !== editingServiceCode,
    );
    if (duplicateCode) {
      setServiceError(`Service code ${nextService.code} is already used.`);
      return;
    }

    if (editingServiceCode) {
      const savedService = await onUpdateService(editingServiceCode, nextService);
      const updatedServices = services.map((service) => (
        service.code.trim().toUpperCase() === editingServiceCode ? savedService : service
      ));
      resetServiceForm(updatedServices);
      setServiceMessage(`${savedService.en} was updated in the kiosk service list.`);
      return;
    }

    const savedService = await onAddService(nextService);
    const updatedServices = [...services, savedService];
    resetServiceForm(updatedServices);
    setServiceMessage(`${savedService.en} was added to the kiosk service list.`);
  }

  const selectedYearUsage = tokenUsageByYear[selectedTokenYear] || {};
  const selectedYearTokenTotal = Object.values(selectedYearUsage).reduce((sum, count) => sum + count, 0);
  const ratingDistribution = feedbackSummary.ratingDistribution.map((entry) => ({
    name: `${entry.rating} \u2605`,
    count: entry.count,
    fill: RATING_COLORS[entry.rating] || "var(--gov-maroon)",
  }));
  const monthlyTrend = feedbackSummary.monthlyTrend;
  const stats = [
    { label: `Tokens in ${selectedTokenYear}`, value: String(selectedYearTokenTotal), icon: <FileText size={22} />, color: "var(--gov-maroon)", bg: "#FFF0F3" },
    { label: "Average Rating", value: `${feedbackSummary.averageRating.toFixed(1)} \u2605`, icon: <Star size={22} />, color: "var(--gov-gold)", bg: "#FFFDE7" },
    { label: "Positive Reviews", value: String(feedbackSummary.positive), icon: <ThumbsUp size={22} />, color: "var(--gov-success)", bg: "#E8F5E9" },
    { label: "Negative Reviews", value: String(feedbackSummary.negative), icon: <ThumbsDown size={22} />, color: "#C62828", bg: "#FFEBEE" },
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
        className={`fixed lg:static z-30 top-0 left-0 h-full flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          width: 240,
          background: "linear-gradient(180deg, #21000A 0%, #4D0015 48%, #7A001F 100%)",
          borderRight: "2px solid rgba(212,175,55,0.38)",
          boxShadow: "12px 0 32px rgba(61,0,16,0.22)",
        }}
      >
        {/* Sidebar header */}
        <div className="px-5 py-6 border-b" style={{ borderColor: "rgba(212,175,55,0.28)" }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <GovernmentLogo className="h-12 w-12 rounded-xl p-0.5" />
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm leading-tight">Pradeshiya Sabha</p>
                <p className="text-white/60 text-xs">Admin Panel</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                border: "1px solid rgba(212,175,55,0.24)",
              }}
            >
              <X size={18} />
            </button>
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
            onClick={onLogout}
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
              type="button"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
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
              {(adminUser.name || adminUser.email || "A").slice(0, 1).toUpperCase()}
            </div>
            <span className="text-sm hidden sm:block" style={{ color: "var(--foreground)" }}>{adminUser.name}</span>
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
              editingServiceCode={editingServiceCode}
              onChange={updateServiceForm}
              onSubmit={handleAddService}
              onEditService={handleEditService}
              onDeleteService={handleDeleteService}
              onCancelEdit={handleCancelEdit}
            />
          ) : active === "reports" ? (
            <ReportsAdminPanel
              feedbackReport={feedbackReport}
              tokenReport={tokenReport}
              error={reportError}
              onRefresh={refreshReports}
            />
          ) : active === "settings" ? (
            <SettingsAdminPanel
              settings={settings}
              message={settingsMessage}
              error={settingsError}
              onChange={(nextSettings) => {
                setSettings(nextSettings);
                setSettingsMessage("");
                setSettingsError("");
              }}
              onSubmit={saveSettings}
            />
          ) : active === "users" ? (
            <UsersAdminPanel
              users={users}
              form={userForm}
              error={userError}
              onFormChange={setUserForm}
              onSubmit={addUser}
              onToggleUser={toggleUser}
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
                <BarChart data={ratingDistribution} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }}
                    cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {ratingDistribution.map((entry, i) => (
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
                <LineChart data={monthlyTrend}>
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
                  {recentReviews.length === 0 && (
                    <tr className="border-t" style={{ borderColor: "var(--border)" }}>
                      <td
                        colSpan={5}
                        className="px-5 py-8 text-center text-sm"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {feedbackError || "No feedback has been submitted yet."}
                      </td>
                    </tr>
                  )}
                  {recentReviews.map((r) => (
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

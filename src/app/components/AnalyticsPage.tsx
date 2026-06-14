import { ArrowLeft, TrendingUp, TrendingDown, Star, Users, CheckCircle } from "lucide-react";
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import { GovernmentLogo } from "./GovernmentLogo";

const PIE_DATA = [
  { name: "5 Stars — Excellent", value: 24, color: "#2E7D32" },
  { name: "4 Stars — Good", value: 18, color: "#388E3C" },
  { name: "3 Stars — Average", value: 8, color: "#D4AF37" },
  { name: "2 Stars — Poor", value: 5, color: "#B03A48" },
  { name: "1 Star — Very Poor", value: 3, color: "#C62828" },
];

const MONTHLY_TREND = [
  { month: "Jan", positive: 48, negative: 14, avg: 3.8 },
  { month: "Feb", positive: 61, negative: 17, avg: 4.0 },
  { month: "Mar", positive: 72, negative: 19, avg: 3.9 },
  { month: "Apr", positive: 67, negative: 17, avg: 4.2 },
  { month: "May", positive: 90, negative: 20, avg: 4.4 },
  { month: "Jun", positive: 47, negative: 11, avg: 4.3 },
];

const DAILY = [
  { day: "Mon", reviews: 12 },
  { day: "Tue", reviews: 19 },
  { day: "Wed", reviews: 8 },
  { day: "Thu", reviews: 24 },
  { day: "Fri", reviews: 18 },
  { day: "Sat", reviews: 6 },
  { day: "Sun", reviews: 3 },
];

function MetricCard({
  label, value, sub, icon, color, bg, trend
}: {
  label: string; value: string; sub: string; icon: React.ReactNode;
  color: string; bg: string; trend?: "up" | "down";
}) {
  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ background: "#fff", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg, color }}>
          {icon}
        </div>
        {trend && (
          trend === "up"
            ? <TrendingUp size={16} style={{ color: "var(--gov-success)" }} />
            : <TrendingDown size={16} style={{ color: "#C62828" }} />
        )}
      </div>
      <p style={{ fontSize: "1.8rem", fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
      <p className="mt-1 font-medium text-sm" style={{ color: "var(--foreground)" }}>{label}</p>
      <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{sub}</p>
    </div>
  );
}

export function AnalyticsPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--gov-cream)", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-6 py-4 shadow-md"
        style={{ background: "linear-gradient(135deg, var(--gov-maroon-dark) 0%, var(--gov-maroon) 100%)" }}
      >
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={18} />
            Dashboard
          </button>
          <div className="w-px h-5 bg-white/30" />
          <GovernmentLogo className="h-12 w-12 rounded-xl border-2 border-white/30 p-0.5" />
          <div>
            <h1 className="text-white font-semibold">Analytics Overview</h1>
            <p className="text-white/60 text-xs">வவுனியா தெற்கு தமிழ் பிரதேச சபை</p>
          </div>
        </div>
      </header>
      <div className="h-0.5" style={{ background: "var(--gov-gold)" }} />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Key Metrics */}
        <div>
          <h2 className="font-semibold mb-4" style={{ color: "var(--gov-maroon)", fontSize: "1rem" }}>
            Key Performance Indicators
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Overall Satisfaction"
              value="86%"
              sub="Based on 4-5 star ratings"
              icon={<CheckCircle size={20} />}
              color="var(--gov-success)"
              bg="#E8F5E9"
              trend="up"
            />
            <MetricCard
              label="Average Rating"
              value="4.3"
              sub="Out of 5.0 this month"
              icon={<Star size={20} />}
              color="var(--gov-gold)"
              bg="#FFFDE7"
              trend="up"
            />
            <MetricCard
              label="Daily Reviews"
              value="58"
              sub="Average per working day"
              icon={<Users size={20} />}
              color="var(--gov-maroon)"
              bg="#FFF0F3"
              trend="up"
            />
            <MetricCard
              label="Negative Rate"
              value="13.8%"
              sub="Requiring attention"
              icon={<TrendingDown size={20} />}
              color="#C62828"
              bg="#FFEBEE"
              trend="down"
            />
          </div>
        </div>

        {/* Satisfaction Score */}
        <div
          className="rounded-2xl p-6 shadow-sm"
          style={{ background: "#fff", border: "1px solid var(--border)" }}
        >
          <h3 className="font-semibold mb-5" style={{ color: "var(--gov-maroon)", fontSize: "0.95rem" }}>
            Positive vs Negative Reviews — Monthly Comparison
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={MONTHLY_TREND} barSize={24} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }}
                cursor={{ fill: "var(--muted)", opacity: 0.3 }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="positive" name="Positive Reviews" fill="var(--gov-success)" radius={[5, 5, 0, 0]} />
              <Bar dataKey="negative" name="Negative Reviews" fill="#C62828" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie chart */}
          <div
            className="rounded-2xl p-6 shadow-sm"
            style={{ background: "#fff", border: "1px solid var(--border)" }}
          >
            <h3 className="font-semibold mb-4" style={{ color: "var(--gov-maroon)", fontSize: "0.95rem" }}>
              Rating Distribution
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={PIE_DATA}
                  cx="50%"
                  cy="48%"
                  outerRadius={90}
                  innerRadius={40}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {PIE_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }}
                  formatter={(value: number, name: string) => [`${value} reviews`, name]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, lineHeight: "22px" }}
                  formatter={(value) => <span style={{ color: "var(--foreground)" }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Average rating trend line */}
          <div
            className="rounded-2xl p-6 shadow-sm"
            style={{ background: "#fff", border: "1px solid var(--border)" }}
          >
            <h3 className="font-semibold mb-4" style={{ color: "var(--gov-maroon)", fontSize: "0.95rem" }}>
              Monthly Average Rating Trend
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={MONTHLY_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[3, 5]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }}
                  formatter={(v: number) => [`${v} / 5.0`, "Average Rating"]}
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="var(--gov-gold)"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "var(--gov-gold)", strokeWidth: 0 }}
                  activeDot={{ r: 7, fill: "var(--gov-maroon)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily bar chart */}
        <div
          className="rounded-2xl p-6 shadow-sm"
          style={{ background: "#fff", border: "1px solid var(--border)" }}
        >
          <h3 className="font-semibold mb-4" style={{ color: "var(--gov-maroon)", fontSize: "0.95rem" }}>
            Daily Feedback Volume — This Week
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DAILY} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }}
                cursor={{ fill: "var(--muted)", opacity: 0.3 }}
              />
              <Bar dataKey="reviews" name="Reviews" fill="var(--gov-maroon)" radius={[6, 6, 0, 0]}>
                {DAILY.map((_, i) => (
                  <Cell key={i} fill={i === 3 ? "var(--gov-gold)" : "var(--gov-maroon)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs mt-3 text-center" style={{ color: "var(--muted-foreground)" }}>
            Gold bar = highest feedback day (Thursday)
          </p>
        </div>

        {/* Monthly Performance table */}
        <div
          className="rounded-2xl shadow-sm overflow-hidden"
          style={{ background: "#fff", border: "1px solid var(--border)" }}
        >
          <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h3 className="font-semibold" style={{ color: "var(--gov-maroon)", fontSize: "0.95rem" }}>
              Monthly Performance Summary
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--gov-cream)" }}>
                  {["Month", "Total Reviews", "Positive", "Negative", "Avg Rating", "Satisfaction"].map((h) => (
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
                {MONTHLY_TREND.map((row, i) => {
                  const total = row.positive + row.negative;
                  const satisfaction = Math.round((row.positive / total) * 100);
                  return (
                    <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                      <td className="px-5 py-3.5 font-medium text-sm" style={{ color: "var(--foreground)" }}>{row.month} 2024</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "var(--foreground)" }}>{total}</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "var(--gov-success)" }}>{row.positive}</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "#C62828" }}>{row.negative}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <Star size={13} fill="var(--gov-gold)" color="var(--gov-gold)" strokeWidth={1} />
                          <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{row.avg}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="flex-1 h-1.5 rounded-full overflow-hidden"
                            style={{ background: "var(--muted)", minWidth: 60 }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${satisfaction}%`,
                                background: satisfaction >= 80 ? "var(--gov-success)" : satisfaction >= 60 ? "var(--gov-gold)" : "#C62828",
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
                            {satisfaction}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

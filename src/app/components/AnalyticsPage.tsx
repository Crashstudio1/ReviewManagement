import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, Star, TrendingDown, TrendingUp, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, type AnalyticsOverview } from "../api";
import { GovernmentLogo } from "./GovernmentLogo";

const EMPTY_ANALYTICS: AnalyticsOverview = {
  totalReviews: 0,
  satisfactionRate: 0,
  negativeRate: 0,
  averageRating: 0,
  dailyAverage: 0,
  ratingDistribution: [1, 2, 3, 4, 5].map((rating) => ({
    name: `${rating} ${rating === 1 ? "Star" : "Stars"}`,
    rating,
    value: 0,
  })),
  monthlyTrend: [],
  dailyVolume: [],
};

const RATING_COLORS: Record<number, string> = {
  1: "#C62828",
  2: "#B03A48",
  3: "#D4AF37",
  4: "#388E3C",
  5: "#2E7D32",
};

function MetricCard({
  label,
  value,
  sub,
  icon,
  color,
  bg,
  trend,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  trend?: "up" | "down";
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
  const [analytics, setAnalytics] = useState<AnalyticsOverview>(EMPTY_ANALYTICS);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    api.getAnalyticsOverview()
      .then((data) => {
        if (!cancelled) {
          setAnalytics(data);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAnalytics(EMPTY_ANALYTICS);
          setError("Analytics data is unavailable.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const pieData = analytics.ratingDistribution.map((entry) => ({
    ...entry,
    name: `${entry.name} (${entry.value})`,
    color: RATING_COLORS[entry.rating] || "var(--gov-maroon)",
  }));
  const highestDaily = Math.max(0, ...analytics.dailyVolume.map((row) => row.reviews));

  return (
    <div className="min-h-screen" style={{ background: "var(--gov-cream)", fontFamily: "'Inter', sans-serif" }}>
      <header
        className="sticky top-0 z-10 px-6 py-4 shadow-md"
        style={{ background: "linear-gradient(135deg, var(--gov-maroon-dark) 0%, var(--gov-maroon) 100%)" }}
      >
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            type="button"
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
            <p className="text-white/60 text-xs">Live feedback performance from MySQL</p>
          </div>
        </div>
      </header>
      <div className="h-0.5" style={{ background: "var(--gov-gold)" }} />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ background: "#FFEBEE", border: "1px solid #FFCDD2", color: "#C62828" }}
          >
            {error}
          </div>
        )}

        <div>
          <h2 className="font-semibold mb-4" style={{ color: "var(--gov-maroon)", fontSize: "1rem" }}>
            Key Performance Indicators
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Overall Satisfaction"
              value={`${analytics.satisfactionRate}%`}
              sub={`${analytics.totalReviews} total reviews`}
              icon={<CheckCircle size={20} />}
              color="var(--gov-success)"
              bg="#E8F5E9"
              trend="up"
            />
            <MetricCard
              label="Average Rating"
              value={analytics.averageRating.toFixed(1)}
              sub="Out of 5.0"
              icon={<Star size={20} />}
              color="var(--gov-gold)"
              bg="#FFFDE7"
              trend="up"
            />
            <MetricCard
              label="Daily Reviews"
              value={String(analytics.dailyAverage)}
              sub="Average over recent days"
              icon={<Users size={20} />}
              color="var(--gov-maroon)"
              bg="#FFF0F3"
              trend="up"
            />
            <MetricCard
              label="Negative Rate"
              value={`${analytics.negativeRate}%`}
              sub="Reviews needing attention"
              icon={<TrendingDown size={20} />}
              color="#C62828"
              bg="#FFEBEE"
              trend="down"
            />
          </div>
        </div>

        <div
          className="rounded-2xl p-6 shadow-sm"
          style={{ background: "#fff", border: "1px solid var(--border)" }}
        >
          <h3 className="font-semibold mb-5" style={{ color: "var(--gov-maroon)", fontSize: "0.95rem" }}>
            Positive vs Negative Reviews
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analytics.monthlyTrend} barSize={24} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="positive" name="Positive Reviews" fill="var(--gov-success)" radius={[5, 5, 0, 0]} />
              <Bar dataKey="negative" name="Negative Reviews" fill="#C62828" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  data={pieData}
                  cx="50%"
                  cy="48%"
                  outerRadius={90}
                  innerRadius={40}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.rating} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }}
                  formatter={(value: number) => [`${value} reviews`, "Count"]}
                />
                <Legend wrapperStyle={{ fontSize: 11, lineHeight: "22px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div
            className="rounded-2xl p-6 shadow-sm"
            style={{ background: "#fff", border: "1px solid var(--border)" }}
          >
            <h3 className="font-semibold mb-4" style={{ color: "var(--gov-maroon)", fontSize: "0.95rem" }}>
              Monthly Average Rating Trend
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={analytics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
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

        <div
          className="rounded-2xl p-6 shadow-sm"
          style={{ background: "#fff", border: "1px solid var(--border)" }}
        >
          <h3 className="font-semibold mb-4" style={{ color: "var(--gov-maroon)", fontSize: "0.95rem" }}>
            Daily Feedback Volume
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.dailyVolume} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }} />
              <Bar dataKey="reviews" name="Reviews" fill="var(--gov-maroon)" radius={[6, 6, 0, 0]}>
                {analytics.dailyVolume.map((row) => (
                  <Cell key={row.day} fill={row.reviews === highestDaily && highestDaily > 0 ? "var(--gov-gold)" : "var(--gov-maroon)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

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
                {analytics.monthlyTrend.length === 0 && (
                  <tr className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                      No feedback has been submitted yet.
                    </td>
                  </tr>
                )}
                {analytics.monthlyTrend.map((row) => {
                  const total = row.positive + row.negative;
                  const satisfaction = total ? Math.round((row.positive / total) * 100) : 0;
                  return (
                    <tr key={row.month} className="border-t" style={{ borderColor: "var(--border)" }}>
                      <td className="px-5 py-3.5 font-medium text-sm" style={{ color: "var(--foreground)" }}>{row.month}</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "var(--foreground)" }}>{row.reviews}</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "var(--gov-success)" }}>{row.positive}</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "#C62828" }}>{row.negative}</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "var(--foreground)" }}>{row.avg}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)", minWidth: 60 }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${satisfaction}%`,
                                background: satisfaction >= 80 ? "var(--gov-success)" : satisfaction >= 60 ? "var(--gov-gold)" : "#C62828",
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>{satisfaction}%</span>
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

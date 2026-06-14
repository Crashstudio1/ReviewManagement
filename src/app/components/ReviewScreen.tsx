import { useState } from "react";
import { ArrowLeft, Star } from "lucide-react";
import { DevelopingPartner } from "./DevelopingPartner";
import { GovernmentLogo } from "./GovernmentLogo";

const RATING_LABELS: Record<number, { ta: string; en: string }> = {
  1: { ta: "அதிருப்தி", en: "Very Dissatisfied" },
  2: { ta: "ஓரளவு திருப்தி", en: "Somewhat Satisfied" },
  3: { ta: "திருப்தி", en: "Satisfied" },
  4: { ta: "நல்லது", en: "Good" },
  5: { ta: "மிக திருப்தி", en: "Very Satisfied" },
};

const RATING_COLORS: Record<number, string> = {
  1: "#C62828",
  2: "#E64A19",
  3: "#F9A825",
  4: "#388E3C",
  5: "#2E7D32",
};

interface Props {
  onSubmit: (rating: number, comment: string, mobile: string) => void;
  onBack: () => void;
}

export function ReviewScreen({ onSubmit, onBack }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [mobile, setMobile] = useState("");

  const active = hover || rating;
  const showForm = rating >= 1 && rating <= 3;
  const canSubmit = rating > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit(rating, comment, mobile);
  }

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "var(--gov-cream)", fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif" }}
    >
      {/* Header */}
      <header
        className="relative flex items-center gap-4 px-6 py-5 text-white shadow-md"
        style={{ background: "linear-gradient(135deg, #3D0010 0%, #800020 60%, #B03A48 100%)" }}
      >
        <button
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-xl transition-colors flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.15)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(212,175,55,0.3)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)")}
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-3 flex-1">
          <GovernmentLogo className="h-14 w-14 rounded-xl border-2 border-white/30 p-0.5" />
          <div>
            <h1 style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.15rem)", fontWeight: 700 }}>கருத்து பதிவு</h1>
            <p className="text-white/70" style={{ fontSize: "0.8rem", fontFamily: "'Inter', sans-serif" }}>
              Citizen Feedback
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--gov-gold)" }} />
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ background: "#fff" }}>
            {/* Card header */}
            <div
              className="px-8 py-6 text-center"
              style={{ background: "linear-gradient(135deg, #800020 0%, #B03A48 100%)" }}
            >
              <p
                className="text-white leading-snug"
                style={{ fontSize: "clamp(0.95rem, 2.5vw, 1.15rem)", fontWeight: 700 }}
              >
                இன்றைய சேவையை நீங்கள் எவ்வாறு மதிப்பிடுகிறீர்கள்?
              </p>
              <p className="text-white/80 mt-1" style={{ fontSize: "0.9rem", fontFamily: "'Inter', sans-serif" }}>
                How would you rate today's service?
              </p>
            </div>

            <div className="px-8 py-8">
              {/* Stars */}
              <div
                className="flex justify-center gap-2 mb-3"
                role="group"
                aria-label="Star rating 1 to 5"
              >
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-label={`${s} star — ${RATING_LABELS[s].en}`}
                    className="transition-transform duration-100 focus:outline-none rounded-xl p-1"
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(s)}
                  >
                    <Star
                      size={56}
                      strokeWidth={1}
                      fill={s <= active ? "var(--gov-gold)" : "transparent"}
                      color={s <= active ? "var(--gov-gold)" : "#DDD4C8"}
                      style={{
                        transform: s <= active ? "scale(1.15)" : "scale(1)",
                        transition: "transform 0.12s, fill 0.12s",
                        filter: s <= active ? "drop-shadow(0 3px 8px rgba(212,175,55,0.55))" : "none",
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Rating label */}
              <div
                className="text-center mb-6 h-14 flex flex-col items-center justify-center rounded-2xl transition-all duration-200"
                style={{
                  background: active > 0 ? `${RATING_COLORS[active]}12` : "transparent",
                  border: active > 0 ? `1.5px solid ${RATING_COLORS[active]}30` : "1.5px solid transparent",
                }}
              >
                {active > 0 ? (
                  <>
                    <p
                      style={{
                        fontSize: "1.15rem",
                        fontWeight: 700,
                        color: RATING_COLORS[active],
                      }}
                    >
                      {RATING_LABELS[active].ta}
                    </p>
                    <p
                      style={{
                        fontSize: "0.82rem",
                        color: RATING_COLORS[active],
                        opacity: 0.8,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {RATING_LABELS[active].en}
                    </p>
                  </>
                ) : (
                  <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem", fontFamily: "'Inter', sans-serif" }}>
                    Tap a star to rate
                  </p>
                )}
              </div>

              {/* Rating guide strip */}
              <div className="flex justify-between px-2 mb-6">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="flex flex-col items-center gap-1">
                    <div className="flex">
                      {[...Array(n)].map((_, i) => (
                        <Star key={i} size={8} fill="var(--gov-gold)" color="var(--gov-gold)" strokeWidth={1} />
                      ))}
                    </div>
                    <span
                      style={{
                        fontSize: "0.6rem",
                        color: "var(--muted-foreground)",
                        fontFamily: "'Inter', sans-serif",
                        textAlign: "center",
                        maxWidth: 52,
                        lineHeight: 1.2,
                      }}
                    >
                      {RATING_LABELS[n].ta}
                    </span>
                  </div>
                ))}
              </div>

              {/* Conditional form */}
              <div
                style={{
                  maxHeight: showForm ? "320px" : "0",
                  opacity: showForm ? 1 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.4s ease, opacity 0.35s ease",
                }}
              >
                <div
                  className="rounded-2xl p-5 mb-5"
                  style={{ background: "var(--gov-cream)", border: "1px solid var(--border)" }}
                >
                  <p
                    className="mb-3"
                    style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--gov-maroon)" }}
                  >
                    உங்கள் கருத்தை பகிருங்கள் / Share Your Feedback
                  </p>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="உங்கள் கருத்தை பகிருங்கள் / Please tell us how we can improve our service..."
                    className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 mb-3"
                    style={{
                      background: "#fff",
                      border: "1.5px solid var(--border)",
                      color: "var(--foreground)",
                      fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif",
                      "--tw-ring-color": "var(--gov-maroon)",
                    } as React.CSSProperties}
                  />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="தொலைபேசி இலக்கம் (விருப்பம்) / Mobile number (optional)"
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                    style={{
                      background: "#fff",
                      border: "1.5px solid var(--border)",
                      color: "var(--foreground)",
                      fontFamily: "'Inter', sans-serif",
                      "--tw-ring-color": "var(--gov-maroon)",
                    } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full py-5 rounded-2xl text-white font-semibold text-lg shadow-lg transition-all duration-150 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: canSubmit
                    ? "linear-gradient(135deg, #3D0010 0%, #800020 60%, #B03A48 100%)"
                    : "#ccc",
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: "0.02em",
                }}
                onMouseEnter={(e) => {
                  if (canSubmit) (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                }}
              >
                மதிப்பாய்வை சமர்ப்பிக்கவும் &nbsp;/&nbsp; Submit Review
              </button>
            </div>
          </div>

          <p
            className="text-center mt-4 text-xs"
            style={{ color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif" }}
          >
            Your feedback is 100% anonymous. No personal data is collected without your consent.
          </p>
        </div>
      </main>

      <footer
        className="py-3 text-center text-xs"
        style={{ background: "var(--gov-maroon-dark)", color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}
      >
        <div>© 2024 Vavuniya South Tamil Pradeshiya Sabha</div>
        <div className="mt-1">
          <DevelopingPartner linkClassName="text-[var(--gov-gold)] underline underline-offset-2 hover:text-white" />
        </div>
      </footer>
    </div>
  );
}

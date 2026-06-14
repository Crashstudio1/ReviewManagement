import { useState, useEffect } from "react";
import { CheckCircle, Star } from "lucide-react";
import { DevelopingPartner } from "./DevelopingPartner";
import { GovernmentLogo } from "./GovernmentLogo";

const RATING_LABELS: Record<number, { en: string; ta: string }> = {
  1: { en: "Very Poor", ta: "மிகவும் மோசம்" },
  2: { en: "Poor", ta: "மோசம்" },
  3: { en: "Average", ta: "சராசரி" },
  4: { en: "Good", ta: "நல்லது" },
  5: { en: "Excellent", ta: "மிகச் சிறந்தது" },
};

export function KioskPortal({ onSubmit }: { onSubmit: (rating: number, comment: string, mobile: string) => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [mobile, setMobile] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!submitted) return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setSubmitted(false);
          setRating(0);
          setComment("");
          setMobile("");
          setCountdown(5);
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  function handleSubmit() {
    if (rating === 0) return;
    onSubmit(rating, comment, mobile);
    setSubmitted(true);
  }

  const showFeedback = rating >= 1 && rating <= 3;
  const activeRating = hover || rating;

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6" style={{ background: "var(--gov-cream)" }}>
        <div className="w-full max-w-lg mx-auto">
          <div
            className="rounded-2xl p-10 text-center shadow-2xl"
            style={{ background: "var(--gov-success)", color: "#fff" }}
          >
            <div className="flex justify-center mb-6">
              <CheckCircle size={80} strokeWidth={1.5} color="#fff" />
            </div>
            <p className="text-4xl mb-2" style={{ fontFamily: "'Noto Sans Tamil', sans-serif", fontWeight: 700 }}>
              நன்றி!
            </p>
            <p className="text-2xl mb-6" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
              Thank you for your valuable feedback.
            </p>
            <p className="text-lg opacity-80" style={{ fontFamily: "'Inter', sans-serif" }}>
              Returning to home screen in <span className="font-bold">{countdown}</span> seconds...
            </p>
            <div className="mt-6 flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={28}
                  fill={i < rating ? "#D4AF37" : "transparent"}
                  color={i < rating ? "#D4AF37" : "rgba(255,255,255,0.4)"}
                  strokeWidth={1.5}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--gov-cream)" }}>
      {/* Header */}
      <header
        className="px-6 py-5 text-white shadow-lg"
        style={{ background: "linear-gradient(135deg, var(--gov-maroon-dark) 0%, var(--gov-maroon) 60%, var(--gov-maroon-light) 100%)" }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <GovernmentLogo className="h-16 w-16 rounded-xl border-2 border-white/30 p-0.5" />
          <div>
            <h1
              className="leading-tight"
              style={{
                fontFamily: "'Noto Sans Tamil', sans-serif",
                fontWeight: 700,
                fontSize: "1.15rem",
                lineHeight: 1.3,
              }}
            >
              வவுனியா தெற்கு தமிழ் பிரதேச சபை
            </h1>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", opacity: 0.85, marginTop: 2 }}>
              Citizen Feedback &amp; Review Portal
            </p>
          </div>
        </div>
      </header>

      {/* Gold accent strip */}
      <div className="h-1.5" style={{ background: "var(--gov-gold)" }} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          {/* Welcome Card */}
          <div className="rounded-2xl shadow-xl overflow-hidden" style={{ background: "#fff" }}>
            {/* Card header bar */}
            <div
              className="px-8 py-5 text-center"
              style={{ background: "linear-gradient(135deg, var(--gov-maroon) 0%, var(--gov-maroon-light) 100%)" }}
            >
              <p
                className="text-white mb-1"
                style={{ fontFamily: "'Noto Sans Tamil', sans-serif", fontWeight: 600, fontSize: "1.2rem" }}
              >
                இன்றைய சேவையை நீங்கள் எவ்வாறு மதிப்பிடுகிறீர்கள்?
              </p>
              <p className="text-white opacity-90" style={{ fontFamily: "'Inter', sans-serif", fontSize: "1rem" }}>
                How would you rate today's service?
              </p>
            </div>

            <div className="px-8 py-8">
              {/* Star Rating */}
              <div className="flex justify-center gap-3 mb-4" role="group" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`${star} star — ${RATING_LABELS[star].en}`}
                    className="transition-transform duration-150 focus:outline-none focus-visible:ring-4 rounded-full"
                    style={{ "--ring-color": "var(--gov-gold)" } as React.CSSProperties}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      size={64}
                      strokeWidth={1.2}
                      fill={star <= activeRating ? "var(--gov-gold)" : "transparent"}
                      color={star <= activeRating ? "var(--gov-gold)" : "#D1C5B8"}
                      style={{
                        transform: star <= activeRating ? "scale(1.12)" : "scale(1)",
                        transition: "transform 0.15s, fill 0.15s",
                        filter: star <= activeRating ? "drop-shadow(0 2px 6px rgba(212,175,55,0.5))" : "none",
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Rating label */}
              <div className="text-center mb-6 min-h-[2.5rem]">
                {activeRating > 0 && (
                  <div>
                    <p
                      className="font-semibold"
                      style={{ fontFamily: "'Noto Sans Tamil', sans-serif", fontSize: "1.1rem", color: "var(--gov-maroon)" }}
                    >
                      {RATING_LABELS[activeRating].ta}
                    </p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.95rem", color: "var(--gov-maroon-light)" }}>
                      {RATING_LABELS[activeRating].en}
                    </p>
                  </div>
                )}
              </div>

              {/* Rating guide */}
              <div className="flex justify-between mb-6 px-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="flex flex-col items-center gap-1">
                    <div className="flex">
                      {[...Array(n)].map((_, i) => (
                        <Star key={i} size={10} fill="var(--gov-gold)" color="var(--gov-gold)" strokeWidth={1} />
                      ))}
                    </div>
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.65rem",
                        color: "var(--muted-foreground)",
                        textAlign: "center",
                        maxWidth: 50,
                        lineHeight: 1.2,
                      }}
                    >
                      {RATING_LABELS[n].en}
                    </span>
                  </div>
                ))}
              </div>

              {/* Conditional Feedback Section */}
              <div
                className="overflow-hidden transition-all duration-500"
                style={{ maxHeight: showFeedback ? "400px" : "0", opacity: showFeedback ? 1 : 0 }}
              >
                <div
                  className="rounded-xl p-5 mb-4"
                  style={{ background: "var(--gov-cream)", border: "1px solid var(--border)" }}
                >
                  <p
                    className="mb-3"
                    style={{
                      fontFamily: "'Noto Sans Tamil', sans-serif",
                      fontSize: "0.95rem",
                      color: "var(--gov-maroon)",
                      fontWeight: 600,
                    }}
                  >
                    உங்கள் கருத்தை பகிர்ந்து கொள்ளுங்கள்
                  </p>
                  <textarea
                    className="w-full rounded-xl border px-4 py-3 resize-none focus:outline-none focus:ring-2 mb-3"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.95rem",
                      borderColor: "var(--border)",
                      background: "#fff",
                      color: "var(--foreground)",
                      "--tw-ring-color": "var(--gov-maroon)",
                    } as React.CSSProperties}
                    rows={3}
                    placeholder="Please tell us how we can improve our service..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <input
                    type="tel"
                    className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.95rem",
                      borderColor: "var(--border)",
                      background: "#fff",
                      color: "var(--foreground)",
                      "--tw-ring-color": "var(--gov-maroon)",
                    } as React.CSSProperties}
                    placeholder="Enter mobile number (optional)"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                disabled={rating === 0}
                onClick={handleSubmit}
                className="w-full py-5 rounded-2xl text-white font-semibold transition-all duration-200 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "1.15rem",
                  background: rating === 0
                    ? "#ccc"
                    : "linear-gradient(135deg, var(--gov-maroon-dark) 0%, var(--gov-maroon) 60%, var(--gov-maroon-light) 100%)",
                  letterSpacing: "0.02em",
                }}
                onMouseEnter={(e) => {
                  if (rating > 0) (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                }}
              >
                Submit Review — மதிப்பாய்வை சமர்ப்பிக்கவும்
              </button>
            </div>
          </div>

          {/* Footer note */}
          <p
            className="text-center mt-6 text-sm"
            style={{ fontFamily: "'Inter', sans-serif", color: "var(--muted-foreground)" }}
          >
            Your feedback is anonymous and helps us improve public services.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="py-3 text-center text-xs text-white"
        style={{ background: "var(--gov-maroon-dark)", fontFamily: "'Inter', sans-serif" }}
      >
        <div>© 2024 Vavuniya South Tamil Pradeshiya Sabha — Citizen Services Portal</div>
        <div className="mt-1">
          <DevelopingPartner linkClassName="text-[var(--gov-gold)] underline underline-offset-2 hover:text-white" />
        </div>
      </footer>
    </div>
  );
}

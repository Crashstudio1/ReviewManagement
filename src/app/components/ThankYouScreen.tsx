import { useEffect, useState } from "react";
import { Home, Star, Heart } from "lucide-react";

interface Props {
  rating: number;
  onHome: () => void;
}

const RATING_LABELS: Record<number, { ta: string; en: string }> = {
  1: { ta: "அதிருப்தி", en: "Very Dissatisfied" },
  2: { ta: "ஓரளவு திருப்தி", en: "Somewhat Satisfied" },
  3: { ta: "திருப்தி", en: "Satisfied" },
  4: { ta: "நல்லது", en: "Good" },
  5: { ta: "மிக திருப்தி", en: "Very Satisfied" },
};

export function ThankYouScreen({ rating, onHome }: Props) {
  const [countdown, setCountdown] = useState(5);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(show);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); onHome(); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onHome]);

  const isPositive = rating >= 4;
  const accentColor = isPositive ? "#2E7D32" : "#800020";

  return (
    <div
      className="flex flex-col min-h-screen items-center justify-center px-6 py-10 relative overflow-hidden"
      style={{ background: "var(--gov-cream)", fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif" }}
    >
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 35%, ${isPositive ? "rgba(46,125,50,0.1)" : "rgba(128,0,32,0.07)"} 0%, transparent 65%)`,
        }}
      />

      {/* Floating stars decoration */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${10 + i * 12}%`,
            top: `${15 + (i % 3) * 20}%`,
            opacity: visible ? 0.15 : 0,
            transition: `opacity 0.6s ease ${i * 0.08}s`,
          }}
        >
          <Star
            size={16 + (i % 3) * 8}
            fill="var(--gov-gold)"
            color="var(--gov-gold)"
            strokeWidth={1}
          />
        </div>
      ))}

      <div
        className="relative w-full max-w-md mx-auto flex flex-col items-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
      >
        {/* Icon */}
        <div className="relative mb-8">
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)` }}
          >
            {isPositive ? (
              <Heart size={64} color="#fff" fill="#fff" strokeWidth={1} />
            ) : (
              <Heart size={64} color="#fff" fill="none" strokeWidth={1.5} />
            )}
          </div>

          {/* Animated rings */}
          {[1, 2].map((i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                inset: `-${i * 10}px`,
                border: `2px solid ${accentColor}`,
                opacity: 0.2 / i,
                animation: `expandRing ${0.8 + i * 0.4}s ease-out ${i * 0.2}s both`,
              }}
            />
          ))}
        </div>

        {/* Thank you message */}
        <div
          className="w-full rounded-3xl overflow-hidden shadow-2xl mb-6"
          style={{ background: "#fff", border: `2px solid ${accentColor}22` }}
        >
          {/* Top band */}
          <div
            className="px-8 py-5 text-center"
            style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}BB 100%)` }}
          >
            <p
              className="text-white"
              style={{ fontSize: "clamp(2rem, 7vw, 3rem)", fontWeight: 800, lineHeight: 1 }}
            >
              நன்றி!
            </p>
          </div>

          <div className="px-8 py-7 text-center">
            <p
              className="mb-1"
              style={{ fontSize: "clamp(1rem, 3vw, 1.3rem)", fontWeight: 700, color: accentColor }}
            >
              Thank you for your feedback
            </p>
            <p
              className="mb-5"
              style={{ fontSize: "0.9rem", color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif" }}
            >
              உங்கள் மதிப்புமிக்க கருத்துக்கு நன்றி
            </p>

            {/* Stars submitted */}
            <div className="flex justify-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={32}
                  fill={s <= rating ? "var(--gov-gold)" : "transparent"}
                  color={s <= rating ? "var(--gov-gold)" : "#DDD4C8"}
                  strokeWidth={1.2}
                  style={{
                    filter: s <= rating ? "drop-shadow(0 2px 4px rgba(212,175,55,0.4))" : "none",
                  }}
                />
              ))}
            </div>
            <p
              className="mb-6"
              style={{ fontSize: "0.9rem", fontWeight: 600, color: accentColor }}
            >
              {RATING_LABELS[rating]?.ta} &nbsp;—&nbsp; {RATING_LABELS[rating]?.en}
            </p>

            {/* Message based on rating */}
            <div
              className="rounded-2xl px-5 py-4 mb-1"
              style={{
                background: isPositive ? "#E8F5E9" : "#FFF3E0",
                border: `1.5px solid ${isPositive ? "#A5D6A7" : "#FFCC80"}`,
              }}
            >
              <p
                style={{
                  fontSize: "0.88rem",
                  color: isPositive ? "#1B5E20" : "#E65100",
                  fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif",
                  lineHeight: 1.5,
                }}
              >
                {isPositive
                  ? "உங்கள் திருப்தி எங்களை உற்சாகமடையச் செய்கிறது. தொடர்ந்து சேவை செய்ய உறுதிபூண்டுள்ளோம்."
                  : "உங்கள் கருத்து எங்களுக்கு மிகவும் முக்கியமானது. உங்கள் அனுபவத்தை மேம்படுத்த பாடுபடுவோம்."}
              </p>
              <p
                className="mt-1"
                style={{
                  fontSize: "0.78rem",
                  color: isPositive ? "#2E7D32" : "#BF360C",
                  fontFamily: "'Inter', sans-serif",
                  opacity: 0.85,
                }}
              >
                {isPositive
                  ? "Your satisfaction motivates us to serve better."
                  : "We will work to improve your experience. Thank you."}
              </p>
            </div>
          </div>
        </div>

        {/* Home button with countdown */}
        <button
          onClick={onHome}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-semibold shadow-xl transition-all duration-150 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #3D0010 0%, #800020 100%)",
            fontSize: "1rem",
            fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
        >
          <Home size={20} />
          முகப்புக்கு திரும்பவும் / Return Home
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: "rgba(212,175,55,0.3)", color: "var(--gov-gold)" }}
          >
            {countdown}
          </span>
        </button>

        <p
          className="mt-4 text-xs text-center"
          style={{ color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif" }}
        >
          Returning to home screen automatically in {countdown} seconds
        </p>
      </div>

      <style>{`
        @keyframes expandRing {
          0% { transform: scale(0.8); opacity: 0.4; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

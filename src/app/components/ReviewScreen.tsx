import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, CheckCircle2, Star } from "lucide-react";
import { DevelopingPartner } from "./DevelopingPartner";
import { GovernmentLogo } from "./GovernmentLogo";
import { type Service } from "./ServiceSelection";

const RATING_LABELS: Record<number, { ta: string; si: string; en: string }> = {
  1: { ta: "மிக அதிருப்தி", si: "අතෘප්තිමත්", en: "Very Dissatisfied" },
  2: { ta: "சற்று திருப்தி", si: "තරමක් සතුටුයි", en: "Somewhat Satisfied" },
  3: { ta: "திருப்தி", si: "සතුටුයි", en: "Satisfied" },
  4: { ta: "நன்று", si: "හොඳයි", en: "Good" },
  5: { ta: "மிக திருப்தி", si: "ඉතා සතුටුයි", en: "Very Satisfied" },
};

const REVIEW_COPY = {
  title: "சேவை மதிப்பாய்வு / සේවා සමාලෝචනය",
  subtitle: "பெற்ற சேவையைத் தேர்ந்தெடுத்து உங்கள் அனுபவத்தை மதிப்பிடுங்கள் / ඔබ ලබාගත් සේවාව තෝරා ඔබගේ අත්දැකීම ශ්‍රේණිගත කරන්න",
  badge: "மதிப்பாய்வு / සමාලෝචනය",
  serviceStep: "சேவை / සේවාව",
  reviewStep: "மதிப்பாய்வு / සමාලෝචනය",
  selected: "தேர்ந்தெடுக்கப்பட்டது / තෝරාගෙන ඇත",
  code: "குறியீடு / කේතය",
  rateQuestionTa: "இன்றைய சேவையை நீங்கள் எவ்வாறு மதிப்பிடுகிறீர்கள்?",
  rateQuestionSi: "අද සේවාව ඔබ කෙසේ ශ්‍රේණිගත කරන්නේද?",
  selectFirst: "முதலில் பெற்ற சேவையைத் தேர்ந்தெடுக்கவும் / පළමුව ලබාගත් සේවාව තෝරන්න",
  tapStar: "நட்சத்திரத்தைத் தொடுங்கள் / තරුවක් තෝරන්න",
  shareFeedback: "உங்கள் கருத்தைப் பகிரவும் / ඔබගේ අදහස බෙදාගන්න",
  feedbackPlaceholder: "சேவையை எவ்வாறு மேம்படுத்தலாம்? / සේවාව වැඩිදියුණු කළ හැක්කේ කෙසේද?",
  mobilePlaceholder: "தொலைபேசி எண் (விருப்பம்) / දුරකථන අංකය (විකල්ප)",
  submit: "மதிப்பாய்வை சமர்ப்பிக்கவும் / සමාලෝචනය යොමු කරන්න",
  anonymous: "உங்கள் கருத்து பெயரில்லாமல் சேமிக்கப்படும். / ඔබගේ අදහස නිර්නාමිකව සුරැකේ.",
};

const RATING_COLORS: Record<number, string> = {
  1: "#C62828",
  2: "#E64A19",
  3: "#F9A825",
  4: "#388E3C",
  5: "#2E7D32",
};

interface Props {
  onSubmit: (rating: number, comment: string, mobile: string, serviceCode: string, serviceName: string) => void;
  onBack: () => void;
  services: Service[];
  initialServiceCode?: string;
}

export function ReviewScreen({ onSubmit, onBack, services, initialServiceCode = "" }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [mobile, setMobile] = useState("");
  const [serviceCode, setServiceCode] = useState(initialServiceCode);
  const ratingPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialServiceCode) {
      setServiceCode(initialServiceCode);
    }
  }, [initialServiceCode]);

  const active = hover || rating;
  const showForm = rating >= 1 && rating <= 3;
  const selectedService = services.find((service) => service.code === serviceCode);
  const hasServices = services.length > 0;
  const canRate = !hasServices || Boolean(selectedService);
  const canSubmit = rating > 0 && canRate;

  function handleSelectService(code: string) {
    setServiceCode(code);
    window.setTimeout(() => {
      ratingPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  }

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit(rating, comment, mobile, selectedService?.code || "", selectedService?.en || "");
  }

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "var(--gov-cream)", fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif" }}
    >
      <header
        className="relative flex items-center gap-4 px-6 py-5 text-white shadow-md"
        style={{ background: "linear-gradient(135deg, #3D0010 0%, #800020 60%, #B03A48 100%)" }}
      >
        <button
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-xl transition-colors flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(212,175,55,0.3)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)")}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>

        <GovernmentLogo className="h-14 w-14 rounded-xl border-2 border-white/30 p-0.5" />
        <div className="flex-1">
          <h1 style={{ fontSize: "clamp(0.95rem, 2.5vw, 1.2rem)", fontWeight: 700 }}>
            {REVIEW_COPY.title}
          </h1>
          <p className="text-white/70 mt-0.5" style={{ fontSize: "0.85rem", fontFamily: "'Inter', sans-serif" }}>
            {REVIEW_COPY.subtitle}
          </p>
        </div>
        <div
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(212,175,55,0.2)", color: "var(--gov-gold)", fontFamily: "'Inter', sans-serif" }}
        >
          <span>{REVIEW_COPY.badge}</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--gov-gold)" }} />
      </header>

      <div
        className="flex items-center justify-center gap-2 py-3 text-xs"
        style={{ background: "#fff", borderBottom: "1px solid var(--border)", fontFamily: "'Inter', sans-serif" }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: "var(--gov-gold)", color: "#3D0010" }}
          >
            1
          </span>
          <span style={{ color: "var(--gov-maroon)", fontWeight: 600 }}>{REVIEW_COPY.serviceStep}</span>
        </div>
        <div className="w-8 h-0.5" style={{ background: selectedService ? "var(--gov-gold)" : "var(--border)" }} />
        <div className="flex items-center gap-1.5">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: selectedService ? "var(--gov-gold)" : "var(--muted)",
              color: selectedService ? "#3D0010" : "var(--muted-foreground)",
            }}
          >
            2
          </span>
          <span style={{ color: selectedService ? "var(--gov-maroon)" : "var(--muted-foreground)", fontWeight: selectedService ? 600 : 400 }}>
            {REVIEW_COPY.reviewStep}
          </span>
        </div>
      </div>

      <main className="flex-1 p-5 overflow-auto">
        {hasServices && (
          <section className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {services.map((svc) => {
                const selected = svc.code === serviceCode;
                return (
                  <button
                    key={svc.code}
                    type="button"
                    onClick={() => handleSelectService(svc.code)}
                    className="group relative flex flex-col items-center text-center rounded-2xl p-5 shadow-sm transition-all duration-150 active:scale-95 focus:outline-none bg-white"
                    style={{
                      border: selected ? "2px solid var(--gov-maroon)" : "2px solid var(--border)",
                      minHeight: 188,
                      background: selected ? "#FFF8F8" : "#fff",
                      boxShadow: selected ? "0 12px 30px rgba(128,0,32,0.12)" : "",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.borderColor = "var(--gov-maroon)";
                      el.style.background = "#FFF8F8";
                      el.style.transform = "translateY(-3px)";
                      el.style.boxShadow = "0 12px 30px rgba(128,0,32,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.borderColor = selected ? "var(--gov-maroon)" : "var(--border)";
                      el.style.background = selected ? "#FFF8F8" : "#fff";
                      el.style.transform = "translateY(0)";
                      el.style.boxShadow = selected ? "0 12px 30px rgba(128,0,32,0.12)" : "";
                    }}
                  >
                    {selected && (
                      <span
                        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full"
                        style={{ background: "var(--gov-maroon)", color: "#fff" }}
                      >
                        <CheckCircle2 size={16} />
                      </span>
                    )}
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 text-3xl transition-all duration-150"
                      style={{
                        background: "var(--gov-cream)",
                        border: "1.5px solid var(--border)",
                      }}
                    >
                      {svc.emoji}
                    </div>
                    <p
                      className="leading-snug mb-1"
                      style={{
                        fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)",
                        fontWeight: 600,
                        color: "var(--gov-maroon)",
                        lineHeight: 1.3,
                      }}
                    >
                      {svc.ta}
                    </p>
                    <p
                      style={{
                        fontSize: "0.68rem",
                        color: "var(--gov-maroon-light)",
                        fontFamily: "'Noto Sans Sinhala', 'Noto Sans Tamil', sans-serif",
                        lineHeight: 1.25,
                        minHeight: 18,
                      }}
                    >
                      {svc.si}
                    </p>
                    <p
                      style={{
                        fontSize: "0.65rem",
                        color: "var(--muted-foreground)",
                        fontFamily: "'Inter', sans-serif",
                        lineHeight: 1.2,
                        marginTop: 2,
                      }}
                    >
                      {svc.en}
                    </p>
                    <div
                      className="mt-2 text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "var(--gov-cream)", color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif" }}
                    >
                      {selected ? REVIEW_COPY.selected : `${REVIEW_COPY.code}: ${svc.code}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section ref={ratingPanelRef} className="w-full max-w-lg mx-auto mt-6">
          <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ background: "#fff" }}>
            <div
              className="px-8 py-6 text-center"
              style={{ background: "linear-gradient(135deg, #800020 0%, #B03A48 100%)" }}
            >
              <p
                className="text-white leading-snug"
                style={{ fontSize: "clamp(0.95rem, 2.5vw, 1.15rem)", fontWeight: 700 }}
              >
                {REVIEW_COPY.rateQuestionTa}
              </p>
              <p className="text-white/80 mt-1" style={{ fontSize: "0.9rem", fontFamily: "'Inter', sans-serif" }}>
                {selectedService ? selectedService.si : REVIEW_COPY.rateQuestionSi}
              </p>
              <p className="text-white/70 mt-1" style={{ fontSize: "0.78rem", fontFamily: "'Inter', sans-serif" }}>
                {selectedService ? selectedService.en : REVIEW_COPY.selectFirst}
              </p>
            </div>

            <div className="px-8 py-8">
              <div className="flex justify-center gap-2 mb-3" role="group" aria-label="Star rating 1 to 5">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    aria-label={`${score} star - ${RATING_LABELS[score].en}`}
                    disabled={!canRate}
                    className="transition-transform duration-100 focus:outline-none rounded-xl p-1 disabled:cursor-not-allowed disabled:opacity-45"
                    onMouseEnter={() => canRate && setHover(score)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => canRate && setRating(score)}
                  >
                    <Star
                      size={56}
                      strokeWidth={1}
                      fill={score <= active ? "var(--gov-gold)" : "transparent"}
                      color={score <= active ? "var(--gov-gold)" : "#DDD4C8"}
                      style={{
                        transform: score <= active ? "scale(1.15)" : "scale(1)",
                        transition: "transform 0.12s, fill 0.12s",
                        filter: score <= active ? "drop-shadow(0 3px 8px rgba(212,175,55,0.55))" : "none",
                      }}
                    />
                  </button>
                ))}
              </div>

              <div
                className="text-center mb-6 h-14 flex flex-col items-center justify-center rounded-2xl transition-all duration-200"
                style={{
                  background: active > 0 ? `${RATING_COLORS[active]}12` : "transparent",
                  border: active > 0 ? `1.5px solid ${RATING_COLORS[active]}30` : "1.5px solid transparent",
                }}
              >
                {active > 0 ? (
                  <>
                    <p style={{ fontSize: "1.05rem", fontWeight: 700, color: RATING_COLORS[active] }}>
                      {RATING_LABELS[active].ta}
                    </p>
                    <p style={{ fontSize: "0.82rem", color: RATING_COLORS[active], opacity: 0.8, fontFamily: "'Inter', sans-serif" }}>
                      {RATING_LABELS[active].si} / {RATING_LABELS[active].en}
                    </p>
                  </>
                ) : (
                  <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem", fontFamily: "'Inter', sans-serif" }}>
                    {canRate ? REVIEW_COPY.tapStar : REVIEW_COPY.selectFirst}
                  </p>
                )}
              </div>

              <div className="flex justify-between px-2 mb-6">
                {[1, 2, 3, 4, 5].map((score) => (
                  <div key={score} className="flex flex-col items-center gap-1">
                    <div className="flex">
                      {[...Array(score)].map((_, i) => (
                        <Star key={i} size={8} fill="var(--gov-gold)" color="var(--gov-gold)" strokeWidth={1} />
                      ))}
                    </div>
                    <span
                      style={{
                        fontSize: "0.56rem",
                        color: "var(--muted-foreground)",
                        fontFamily: "'Noto Sans Sinhala', 'Noto Sans Tamil', sans-serif",
                        textAlign: "center",
                        maxWidth: 70,
                        lineHeight: 1.2,
                      }}
                    >
                      {RATING_LABELS[score].ta}
                      <br />
                      {RATING_LABELS[score].si}
                    </span>
                  </div>
                ))}
              </div>

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
                  <p className="mb-3" style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--gov-maroon)" }}>
                    {REVIEW_COPY.shareFeedback}
                  </p>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={REVIEW_COPY.feedbackPlaceholder}
                    className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 mb-3"
                    style={{
                      background: "#fff",
                      border: "1.5px solid var(--border)",
                      color: "var(--foreground)",
                      fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif",
                      "--tw-ring-color": "var(--gov-maroon)",
                    } as CSSProperties}
                  />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder={REVIEW_COPY.mobilePlaceholder}
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                    style={{
                      background: "#fff",
                      border: "1.5px solid var(--border)",
                      color: "var(--foreground)",
                      fontFamily: "'Inter', sans-serif",
                      "--tw-ring-color": "var(--gov-maroon)",
                    } as CSSProperties}
                  />
                </div>
              </div>

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
                  letterSpacing: 0,
                }}
                onMouseEnter={(e) => {
                  if (canSubmit) (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                }}
              >
                {REVIEW_COPY.submit}
              </button>
            </div>
          </div>

          <p className="text-center mt-4 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif" }}>
            {REVIEW_COPY.anonymous}
          </p>
        </section>
      </main>

      <footer
        className="py-3 text-center text-xs"
        style={{ background: "var(--gov-maroon-dark)", color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}
      >
        <div>Vavuniya South Tamil Pradeshiya Sabha</div>
        <div className="mt-1">
          <DevelopingPartner linkClassName="text-[var(--gov-gold)] underline underline-offset-2 hover:text-white" />
        </div>
      </footer>
    </div>
  );
}

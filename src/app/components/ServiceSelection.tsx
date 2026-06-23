import { ArrowLeft } from "lucide-react";
import { DevelopingPartner } from "./DevelopingPartner";
import { GovernmentLogo } from "./GovernmentLogo";
import { getNextTemporaryTokenNumber } from "../tokenNumbers";

interface Service {
  emoji: string;
  ta: string;
  si: string;
  en: string;
  code: string;
  counterNumber?: string;
}

export const DEFAULT_SERVICES: Service[] = [
  { emoji: "🏢", ta: "கட்டட அனுமதி", si: "ගොඩනැගිලි අනුමැතිය", en: "Building Approval", code: "A" },
  { emoji: "💼", ta: "வியாபார உரிமம்", si: "වෙළඳ බලපත්‍රය", en: "Trade License", code: "B" },
  { emoji: "📄", ta: "வியாபார பெயர்பதிவு", si: "ව්‍යාපාර ලියාපදිංචිය", en: "Business Registration", code: "C" },
  { emoji: "💧", ta: "நீரிணைப்பு சேவை", si: "ජල සම්බන්ධතාව", en: "Water Connection", code: "D" },
  { emoji: "🏠", ta: "ஆதனவரி", si: "දේපළ බදු", en: "Property Tax", code: "E" },
  { emoji: "📍", ta: "எல்லைக்கோட்டுச் சான்றிதழ்", si: "වීථි රේඛා සහතිකය", en: "Street Line Certificate", code: "F" },
  { emoji: "📜", ta: "குடிபுகுச் சான்றிதழ்", si: "අනුකූලතා සහතිකය", en: "Certificate of conformity", code: "G" },
  { emoji: "📢", ta: "விளம்பர அனுமதி", si: "දැන්වීම් අවසර පත්‍රය", en: "Advertisement Permit", code: "H" },
  { emoji: "💰", ta: "காசோலை பெறல்", si: "චෙක්පත් ලබා ගැනීම", en: "Cheque Collection", code: "I" },
  { emoji: "📋", ta: "மற்ற சேவைகள்", si: "වෙනත් සේවා", en: "Other Services", code: "J" },
  { emoji: "📋", ta: "மற்ற சேவைகள்", si: "වෙනත් සේවා", en: "Other Services", code: "K" },
  { emoji: "📋", ta: "மற்ற சேவைகள்", si: "වෙනත් සේවා", en: "Other Services", code: "L" },
];

interface Props {
  onSelect: (service: Service) => void;
  onBack: () => void;
  tokenCounters: Record<string, number>;
  services: Service[];
  tokenError?: string;
}

export function ServiceSelection({ onSelect, onBack, tokenCounters, services, tokenError = "" }: Props) {
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
          className="flex items-center justify-center w-10 h-10 rounded-xl transition-colors"
          style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(212,175,55,0.3)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)")}
        >
          <ArrowLeft size={20} />
        </button>
        <GovernmentLogo className="h-14 w-14 rounded-xl border-2 border-white/30 p-0.5" />
        <div className="flex-1">
          <h1 style={{ fontSize: "clamp(0.95rem, 2.5vw, 1.2rem)", fontWeight: 700 }}>
            தயவு செய்து சேவையை தேர்வு செய்யவும்
          </h1>
          <p
            className="text-white/70 mt-0.5"
            style={{ fontSize: "0.85rem", fontFamily: "'Inter', sans-serif" }}
          >
            Select Required Service / සේවාව තෝරන්න
          </p>
        </div>
        <div
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(212,175,55,0.2)", color: "var(--gov-gold)", fontFamily: "'Inter', sans-serif" }}
        >
          <span>சேவை தேர்வு</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--gov-gold)" }} />
      </header>

      {/* Step indicator */}
      <div
        className="flex items-center justify-center gap-2 py-3 text-xs"
        style={{ background: "#fff", borderBottom: "1px solid var(--border)", fontFamily: "'Inter', sans-serif" }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "var(--gov-gold)", color: "#3D0010" }}>1</span>
          <span style={{ color: "var(--gov-maroon)", fontWeight: 600 }}>Service</span>
        </div>
        <div className="w-8 h-0.5" style={{ background: "var(--border)" }} />
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>2</span>
          <span style={{ color: "var(--muted-foreground)" }}>Token</span>
        </div>
      </div>

      {/* Grid */}
      <main className="flex-1 p-5 overflow-auto">
        {tokenError && (
          <div
            className="mx-auto mb-4 max-w-5xl rounded-xl px-4 py-3 text-sm font-semibold"
            style={{ background: "#FFEBEE", border: "1px solid #FFCDD2", color: "#C62828", fontFamily: "'Inter', sans-serif" }}
          >
            {tokenError}
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
          {services.map((svc) => {
            const nextToken = getNextTemporaryTokenNumber(svc.code, tokenCounters[svc.code] || 0);
            const tokenStr = `${svc.code}${String(nextToken).padStart(3, "0")}`;
            const counterNumber = svc.counterNumber?.trim();
            const counterInstruction = counterNumber
              ? `You have to go to the counter ${counterNumber}`
              : "Counter is not assigned";
            return (
              <button
                key={svc.code}
                onClick={() => onSelect(svc)}
                className="group flex flex-col items-center text-center rounded-2xl p-5 shadow-sm transition-all duration-150 active:scale-95 focus:outline-none bg-white"
                style={{
                  border: "2px solid var(--border)",
                  minHeight: 208,
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
                  el.style.borderColor = "var(--border)";
                  el.style.background = "#fff";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "";
                }}
              >
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
                  {counterInstruction}
                </div>
                <div
                  className="mt-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--gov-cream)", color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif" }}
                >
                  Token: {tokenStr}
                </div>
              </button>
            );
          })}
        </div>
      </main>

      <footer
        className="py-3 text-center text-xs"
        style={{ background: "var(--gov-maroon-dark)", color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}
      >
        <div>Touch a service card to get your token instantly • No personal information required</div>
        <div className="mt-1">
          <DevelopingPartner linkClassName="text-[var(--gov-gold)] underline underline-offset-2 hover:text-white" />
        </div>
      </footer>
    </div>
  );
}

export type { Service };

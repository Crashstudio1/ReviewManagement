import { Star } from "lucide-react";
import { DevelopingPartner } from "./DevelopingPartner";
import { GovernmentLogo } from "./GovernmentLogo";

function TokenIcon({ size = 48, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ticket body */}
      <rect x="3" y="9" width="42" height="30" rx="4" stroke={color} strokeWidth="2.2" fill="none" />
      {/* Left notch */}
      <path
        d="M3 21 C3 21 8 21 8 24 C8 27 3 27 3 27"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Right notch */}
      <path
        d="M45 21 C45 21 40 21 40 24 C40 27 45 27 45 27"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Dashed tear line */}
      <line x1="8" y1="24" x2="40" y2="24" stroke={color} strokeWidth="1.4" strokeDasharray="3 2.5" />
      {/* Token number */}
      <text
        x="24"
        y="20"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill={color}
        fontFamily="'Inter', monospace"
        letterSpacing="1"
      >
        A001
      </text>
      {/* Queue label */}
      <text
        x="24"
        y="33"
        textAnchor="middle"
        fontSize="6"
        fontWeight="500"
        fill={color}
        fontFamily="'Inter', monospace"
        opacity="0.75"
        letterSpacing="0.5"
      >
        QUEUE TOKEN
      </text>
      {/* Small star accent */}
      <circle cx="10" cy="17" r="1.5" fill={color} opacity="0.5" />
      <circle cx="38" cy="17" r="1.5" fill={color} opacity="0.5" />
    </svg>
  );
}

interface Props {
  onGetToken: () => void;
  onGiveFeedback: () => void;
}

export function HomeScreen({ onGetToken, onGiveFeedback }: Props) {
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "var(--gov-cream)", fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif" }}
    >
      {/* Header */}
      <header
        className="relative flex flex-col items-center justify-center py-7 px-6 text-white shadow-lg overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #3D0010 0%, #800020 55%, #B03A48 100%)",
        }}
      >
        {/* Decorative arcs */}
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
          style={{ background: "var(--gov-gold)" }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10"
          style={{ background: "var(--gov-gold)" }}
        />

        <div className="relative flex items-center gap-5">
          <GovernmentLogo className="h-24 w-24 rounded-2xl border-[3px] border-white/30 p-1" />

          <div>
            <h1
              className="text-white leading-tight"
              style={{ fontSize: "clamp(1rem, 3vw, 1.4rem)", fontWeight: 700, letterSpacing: "0.01em" }}
            >
              வவுனியா தெற்கு தமிழ் பிரதேச சபை
            </h1>
            <p
              className="text-white/75 mt-1"
              style={{ fontSize: "clamp(0.75rem, 2vw, 0.95rem)", fontFamily: "'Inter', sans-serif" }}
            >
              Vavuniya South Tamil Pradeshiya Sabha
            </p>
            <div
              className="mt-2 inline-block px-3 py-0.5 rounded-full text-xs font-medium"
              style={{ background: "rgba(212,175,55,0.25)", color: "var(--gov-gold)", fontFamily: "'Inter', sans-serif" }}
            >
              Citizen Service Portal
            </div>
          </div>
        </div>

        {/* Gold bottom stripe */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ background: "var(--gov-gold)" }}
        />
      </header>

      {/* Welcome */}
      <div className="flex flex-col items-center pt-10 pb-2 px-6 text-center">
        <p
          className="leading-tight"
          style={{ fontSize: "clamp(2rem, 6vw, 3.2rem)", fontWeight: 700, color: "var(--gov-maroon)" }}
        >
          வரவேற்கிறோம்
        </p>
        <p
          style={{ fontSize: "clamp(1rem, 3vw, 1.4rem)", color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif", marginTop: 4 }}
        >
          Welcome
        </p>
        <div className="mt-3 h-0.5 w-20 rounded" style={{ background: "var(--gov-gold)" }} />
        <p
          className="mt-3 max-w-md"
          style={{ fontSize: "clamp(0.85rem, 2vw, 1rem)", color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif" }}
        >
          Please select one of the options below to proceed
        </p>
      </div>

      {/* Two main cards */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Card 1 – Get Token */}
          <button
            onClick={onGetToken}
            className="group relative flex flex-col items-center justify-center rounded-3xl p-10 shadow-xl transition-all duration-200 active:scale-95 focus:outline-none text-left"
            style={{
              background: "linear-gradient(145deg, #800020 0%, #5C0016 100%)",
              border: "3px solid transparent",
              minHeight: 260,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.border = "3px solid var(--gov-gold)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-4px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 20px 50px rgba(128,0,32,0.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.border = "3px solid transparent";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
            }}
          >
            {/* Icon */}
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
              style={{ background: "rgba(212,175,55,0.18)", border: "2px solid rgba(212,175,55,0.4)" }}
            >
              <TokenIcon size={52} color="var(--gov-gold)" />
            </div>

            <p
              className="text-white text-center leading-tight mb-1"
              style={{ fontSize: "clamp(1.2rem, 3.5vw, 1.6rem)", fontWeight: 700 }}
            >
              டோக்கன் பெறுக
            </p>
            <p
              className="text-white/70 text-center"
              style={{ fontSize: "clamp(0.8rem, 2vw, 1rem)", fontFamily: "'Inter', sans-serif" }}
            >
              Get Service Token
            </p>

            <div
              className="mt-5 px-6 py-2 rounded-full text-sm font-semibold"
              style={{ background: "var(--gov-gold)", color: "#3D0010", fontFamily: "'Inter', sans-serif" }}
            >
              Tap to Continue →
            </div>
          </button>

          {/* Card 2 – Give Feedback */}
          <button
            onClick={onGiveFeedback}
            className="group relative flex flex-col items-center justify-center rounded-3xl p-10 shadow-xl transition-all duration-200 active:scale-95 focus:outline-none bg-white"
            style={{
              border: "3px solid var(--gov-maroon)",
              minHeight: 260,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#FFF8F0";
              (e.currentTarget as HTMLButtonElement).style.border = "3px solid var(--gov-gold)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-4px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 20px 50px rgba(212,175,55,0.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#fff";
              (e.currentTarget as HTMLButtonElement).style.border = "3px solid var(--gov-maroon)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
            }}
          >
            {/* Icon */}
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6 shadow-md"
              style={{ background: "#FFF8E6", border: "2px solid rgba(212,175,55,0.5)" }}
            >
              <Star size={48} fill="var(--gov-gold)" color="var(--gov-gold)" strokeWidth={1} />
            </div>

            <p
              className="text-center leading-tight mb-1"
              style={{ fontSize: "clamp(1.2rem, 3.5vw, 1.6rem)", fontWeight: 700, color: "var(--gov-maroon)" }}
            >
              கருத்து பதிவு
            </p>
            <p
              className="text-center"
              style={{ fontSize: "clamp(0.8rem, 2vw, 1rem)", color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif" }}
            >
              Give Review
            </p>

            <div
              className="mt-5 px-6 py-2 rounded-full text-sm font-semibold"
              style={{ background: "var(--gov-maroon)", color: "#fff", fontFamily: "'Inter', sans-serif" }}
            >
              Tap to Continue →
            </div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="text-center py-4 text-xs"
        style={{
          background: "var(--gov-maroon-dark)",
          color: "rgba(255,255,255,0.6)",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div>© 2024 Vavuniya South Tamil Pradeshiya Sabha &nbsp;|&nbsp; Citizen Kiosk System v2.0</div>
        <div className="mt-1">
          <DevelopingPartner linkClassName="text-[var(--gov-gold)] underline underline-offset-2 hover:text-white" />
        </div>
      </footer>
    </div>
  );
}

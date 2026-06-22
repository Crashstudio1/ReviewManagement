import { useEffect, useMemo, useState } from "react";
import { Home, Printer, CheckCircle } from "lucide-react";

const RECEIPT_ORGANIZATION_NAME = "Vavuniya South Tamil Pradeshiya Sabha";
const RECEIPT_NOTE = "Please wait until your token number is called.";
const RECEIPT_PAGE_WIDTH_MM = 80;
const RECEIPT_SAFE_WIDTH_MM = 72;
const RECEIPT_SIDE_PADDING_MM = 1.5;
const RECEIPT_TOP_PADDING_MM = 3;
const RECEIPT_BOTTOM_PADDING_MM = 12;
const TOKEN_SIZE_MULTIPLIER = 2;
const RECEIPT_TOKEN_WIDTH_SCALE = 0.54;
const RECEIPT_BASE_FONT_PX = 10 * TOKEN_SIZE_MULTIPLIER;
const RECEIPT_TITLE_FONT_PX = 11 * TOKEN_SIZE_MULTIPLIER;
const RECEIPT_SUBTITLE_FONT_PX = 10 * TOKEN_SIZE_MULTIPLIER;
const RECEIPT_SERVICE_FONT_PX = 10 * TOKEN_SIZE_MULTIPLIER;
const RECEIPT_NOTE_FONT_PX = 8 * TOKEN_SIZE_MULTIPLIER;

interface ReceiptPrintData {
  token: string;
  serviceName: string;
  printedDate: string;
  printedTime: string;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[char] || char);
}

function getReceiptTokenFontSize(token: string) {
  if (token.length <= 4) return 20 * TOKEN_SIZE_MULTIPLIER;
  if (token.length <= 6) return 16 * TOKEN_SIZE_MULTIPLIER;
  return 13 * TOKEN_SIZE_MULTIPLIER;
}

function buildReceiptHtml({ token, serviceName, printedDate, printedTime }: ReceiptPrintData) {
  const tokenFontSize = getReceiptTokenFontSize(token);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(token)} Receipt</title>
  <style>
    @page { size: ${RECEIPT_PAGE_WIDTH_MM}mm auto; margin: 0; }
    html, body {
      width: ${RECEIPT_PAGE_WIDTH_MM}mm;
      min-width: ${RECEIPT_PAGE_WIDTH_MM}mm;
      margin: 0;
      padding: 0;
      background: #fff;
      color: #000;
      overflow: hidden;
    }
    .print-ticket {
      width: ${RECEIPT_SAFE_WIDTH_MM}mm;
      margin: 0 auto;
      padding: ${RECEIPT_TOP_PADDING_MM}mm ${RECEIPT_SIDE_PADDING_MM}mm ${RECEIPT_BOTTOM_PADDING_MM}mm;
      box-sizing: border-box;
      background: #fff;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
      font-size: ${RECEIPT_BASE_FONT_PX}px;
      line-height: 1.35;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .ticket-center { text-align: center; }
    .ticket-title { font-size: ${RECEIPT_TITLE_FONT_PX}px; font-weight: 700; overflow-wrap: break-word; }
    .ticket-subtitle { margin-top: ${2 * TOKEN_SIZE_MULTIPLIER}px; font-size: ${RECEIPT_SUBTITLE_FONT_PX}px; text-transform: uppercase; letter-spacing: 0.5px; }
    .ticket-rule { margin: ${6 * TOKEN_SIZE_MULTIPLIER}px 0; border-top: 1px dashed #000; }
    .ticket-service { font-size: ${RECEIPT_SERVICE_FONT_PX}px; font-weight: 700; overflow-wrap: break-word; }
    .ticket-token { margin: ${8 * TOKEN_SIZE_MULTIPLIER}px 0; max-width: 100%; overflow: visible; font-family: "Arial Black", Arial, Helvetica, sans-serif; font-size: ${tokenFontSize}mm; line-height: 1; font-weight: 900; letter-spacing: 0.5mm; white-space: nowrap; text-align: center; }
    .ticket-token-text { display: inline-block; transform: scaleX(${RECEIPT_TOKEN_WIDTH_SCALE}); transform-origin: center; }
    .ticket-row { display: flex; justify-content: space-between; gap: ${8 * TOKEN_SIZE_MULTIPLIER}px; margin: ${3 * TOKEN_SIZE_MULTIPLIER}px 0; }
    .ticket-note { font-size: ${RECEIPT_NOTE_FONT_PX}px; line-height: 1.2; padding-bottom: 2mm; }
  </style>
</head>
<body>
  <div class="print-ticket">
    <div class="ticket-center ticket-title">${escapeHtml(RECEIPT_ORGANIZATION_NAME)}</div>
    <div class="ticket-center ticket-subtitle">Queue Token</div>
    <div class="ticket-rule"></div>
    <div class="ticket-center ticket-service">${escapeHtml(serviceName)}</div>
    <div class="ticket-token"><span class="ticket-token-text">${escapeHtml(token)}</span></div>
    <div class="ticket-row"><span>Date</span><strong>${escapeHtml(printedDate)}</strong></div>
    <div class="ticket-row"><span>Time</span><strong>${escapeHtml(printedTime)}</strong></div>
    <div class="ticket-rule"></div>
    <div class="ticket-center ticket-note">${escapeHtml(RECEIPT_NOTE)}</div>
  </div>
</body>
</html>`;
}

function printReceiptOnly(data: ReceiptPrintData) {
  const iframe = document.createElement("iframe");
  iframe.title = "Token receipt print frame";
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = `${RECEIPT_PAGE_WIDTH_MM}mm`;
  iframe.style.height = "180mm";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDocument = frameWindow?.document;
  if (!frameWindow || !frameDocument) {
    iframe.remove();
    window.print();
    return;
  }

  frameDocument.open();
  frameDocument.write(buildReceiptHtml(data));
  frameDocument.close();

  window.setTimeout(() => {
    frameWindow.focus();
    frameWindow.print();
  }, 250);

  window.setTimeout(() => {
    iframe.remove();
  }, 60000);
}

function startReceiptPrint(data: ReceiptPrintData) {
  printReceiptOnly(data);
}

function TokenIcon({ size = 40, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="9" width="42" height="30" rx="4" stroke={color} strokeWidth="2.2" fill="none" />
      <path d="M3 21 C3 21 8 21 8 24 C8 27 3 27 3 27" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M45 21 C45 21 40 21 40 24 C40 27 45 27 45 27" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      <line x1="8" y1="24" x2="40" y2="24" stroke={color} strokeWidth="1.4" strokeDasharray="3 2.5" />
      <text x="24" y="20" textAnchor="middle" fontSize="8" fontWeight="700" fill={color} fontFamily="'Inter', monospace" letterSpacing="1">A001</text>
      <text x="24" y="33" textAnchor="middle" fontSize="6" fontWeight="500" fill={color} fontFamily="'Inter', monospace" opacity="0.75" letterSpacing="0.5">QUEUE TOKEN</text>
      <circle cx="10" cy="17" r="1.5" fill={color} opacity="0.5" />
      <circle cx="38" cy="17" r="1.5" fill={color} opacity="0.5" />
    </svg>
  );
}

interface Props {
  token: string;
  serviceName: string;
  serviceEmoji: string;
  onHome: () => void;
}

export function TokenGenerated({ token, serviceName, serviceEmoji, onHome }: Props) {
  const [countdown, setCountdown] = useState(30);
  const [printing, setPrinting] = useState(true);
  const [printed, setPrinted] = useState(false);
  const [issuedAt] = useState(() => new Date());

  const printedDate = issuedAt.toLocaleDateString("en-GB");
  const printedTime = issuedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const receiptPrintData = useMemo(() => ({
    token,
    serviceName: `${serviceEmoji} ${serviceName}`,
    printedDate,
    printedTime,
  }), [printedDate, printedTime, serviceEmoji, serviceName, token]);
  const receiptTokenFontSize = getReceiptTokenFontSize(token);

  useEffect(() => {
    const browserPrintTimer = setTimeout(() => {
      startReceiptPrint(receiptPrintData);
    }, 450);
    const printTimer = setTimeout(() => {
      setPrinting(false);
      setPrinted(true);
    }, 2200);
    return () => {
      clearTimeout(browserPrintTimer);
      clearTimeout(printTimer);
    };
  }, [receiptPrintData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); onHome(); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onHome]);

  return (
    <div
      className="flex flex-col min-h-screen items-center justify-center px-6 py-10"
      style={{ background: "var(--gov-cream)", fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif" }}
    >
      {/* Success glow background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, rgba(46,125,50,0.08) 0%, transparent 65%)",
        }}
      />

      <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center">
        {/* Animated check icon */}
        <div className="relative mb-6">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #2E7D32 0%, #388E3C 100%)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            <CheckCircle size={60} color="#fff" strokeWidth={1.5} />
          </div>
          {/* Ring animation */}
          <div
            className="absolute inset-0 rounded-full opacity-30"
            style={{
              border: "3px solid #2E7D32",
              animation: "ping 1.5s ease-out 1",
            }}
          />
        </div>

        {/* Token Card */}
        <div
          className="w-full rounded-3xl overflow-hidden shadow-2xl mb-8"
          style={{ background: "#fff", border: "2px solid rgba(46,125,50,0.2)" }}
        >
          {/* Card header */}
          <div
            className="flex flex-wrap items-center justify-between gap-4 px-8 py-6"
            style={{ background: "linear-gradient(135deg, #2E7D32 0%, #388E3C 100%)" }}
          >
            <div className="flex min-w-0 items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.18)" }}
              >
                <TokenIcon size={26} color="#fff" />
              </div>
              <div className="min-w-0">
                <p
                  className="text-white/80"
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(1.1rem, 3.2vw, 1.75rem)", lineHeight: 1.15 }}
                >
                  {serviceEmoji} {serviceName}
                </p>
                <p
                  className="text-white font-semibold mt-1"
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(0.95rem, 2.6vw, 1.5rem)", lineHeight: 1.15 }}
                >
                  Service Token
                </p>
              </div>
            </div>
            <div
              className="px-4 py-2 rounded-full font-bold"
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontFamily: "'Inter', sans-serif", fontSize: "clamp(0.9rem, 2.4vw, 1.5rem)" }}
            >
              VALID TODAY
            </div>
          </div>

          {/* Token number */}
          <div className="flex flex-col items-center py-12 px-8">
            <p
              className="mb-4 text-center"
              style={{ color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif", fontSize: "clamp(1rem, 3vw, 1.75rem)", letterSpacing: "0.08em", lineHeight: 1.2 }}
            >
              உங்கள் டோக்கன் இலக்கம் / Your Token Number
            </p>
            <div
              className="relative flex items-center justify-center w-full max-w-96 h-56 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #3D0010 0%, #800020 100%)",
                boxShadow: "0 8px 32px rgba(128,0,32,0.3)",
              }}
            >
              <p
                style={{
                  fontSize: "clamp(5.5rem, 24vw, 8rem)",
                  fontWeight: 900,
                  color: "var(--gov-gold)",
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: "0.04em",
                  textShadow: "0 2px 12px rgba(212,175,55,0.4)",
                }}
              >
                {token}
              </p>
            </div>

            {/* Date/time stamp */}
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              <div className="text-center">
                <p style={{ color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif", fontSize: "clamp(0.85rem, 2.4vw, 1.5rem)" }}>
                  Date
                </p>
                <p className="font-semibold" style={{ color: "var(--foreground)", fontFamily: "'Inter', sans-serif", fontSize: "clamp(1rem, 2.8vw, 1.75rem)" }}>
                  {printedDate}
                </p>
              </div>
              <div className="w-px" style={{ background: "var(--border)" }} />
              <div className="text-center">
                <p style={{ color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif", fontSize: "clamp(0.85rem, 2.4vw, 1.5rem)" }}>
                  Time
                </p>
                <p className="font-semibold" style={{ color: "var(--foreground)", fontFamily: "'Inter', sans-serif", fontSize: "clamp(1rem, 2.8vw, 1.75rem)" }}>
                  {printedTime}
                </p>
              </div>
              <div className="w-px" style={{ background: "var(--border)" }} />
              <div className="text-center">
                <p style={{ color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif", fontSize: "clamp(0.85rem, 2.4vw, 1.5rem)" }}>
                  Counter
                </p>
                <p className="font-semibold" style={{ color: "var(--foreground)", fontFamily: "'Inter', sans-serif", fontSize: "clamp(1rem, 2.8vw, 1.75rem)" }}>
                  A
                </p>
              </div>
            </div>
          </div>

          {/* Printer status */}
          <div
            className="flex flex-wrap items-center gap-4 px-8 py-6 border-t"
            style={{ borderColor: "var(--border)", background: "var(--gov-cream)" }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: printed ? "#E8F5E9" : "#FFF8E1", color: printed ? "#2E7D32" : "#F57F17" }}
            >
              <Printer size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="font-semibold"
                style={{ color: "var(--foreground)", fontFamily: "'Inter', sans-serif", fontSize: "clamp(1rem, 2.8vw, 1.75rem)", lineHeight: 1.2 }}
              >
                {printing ? "Printing token…" : "Token printed successfully"}
              </p>
              <p style={{ color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif", fontSize: "clamp(0.9rem, 2.4vw, 1.5rem)", lineHeight: 1.25 }}>
                {printing
                  ? "Please wait while your token is being printed"
                  : "Please collect your token from the printer"}
              </p>
            </div>
            {printing && (
              <div className="ml-auto flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: "var(--gov-gold)",
                      animation: `bounce 0.8s ease-in-out ${i * 0.15}s infinite`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Success message */}
        <p
          className="text-center mb-2"
          style={{ fontSize: "clamp(2.2rem, 6vw, 2.8rem)", fontWeight: 700, color: "#2E7D32", lineHeight: 1.15 }}
        >
          உங்கள் டோக்கன் வெற்றிகரமாக உருவாக்கப்பட்டது
        </p>
        <p
          className="text-center mb-6"
          style={{ color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif", fontSize: "clamp(1.25rem, 3vw, 1.8rem)", lineHeight: 1.2 }}
        >
          Your token has been generated successfully
        </p>

        {/* Countdown + action buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => startReceiptPrint(receiptPrintData)}
            className="flex items-center gap-4 px-8 py-5 rounded-2xl font-semibold shadow-lg transition-all duration-150 active:scale-95"
            style={{
              background: "#fff",
              color: "#3D0010",
              border: "2px solid rgba(128,0,32,0.22)",
              fontSize: "clamp(1.25rem, 3vw, 2rem)",
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
          >
            <Printer size={32} />
            Print Token
          </button>
          <button
            onClick={onHome}
            className="flex items-center gap-4 px-8 py-5 rounded-2xl text-white font-semibold shadow-lg transition-all duration-150 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #3D0010 0%, #800020 100%)",
              fontSize: "clamp(1.25rem, 3vw, 2rem)",
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
          >
            <Home size={32} />
            Return Home
            <span
              className="w-14 h-14 rounded-full flex items-center justify-center font-bold"
              style={{ background: "rgba(212,175,55,0.3)", color: "var(--gov-gold)", fontSize: "1.75rem" }}
            >
              {countdown}
            </span>
          </button>
        </div>
      </div>

      <div className="print-ticket" aria-hidden="true">
        <div className="ticket-center ticket-title">{RECEIPT_ORGANIZATION_NAME}</div>
        <div className="ticket-center ticket-subtitle">Queue Token</div>
        <div className="ticket-rule" />
        <div className="ticket-center ticket-service">{serviceEmoji} {serviceName}</div>
        <div className="ticket-center ticket-token"><span className="ticket-token-text">{token}</span></div>
        <div className="ticket-row"><span>Date</span><strong>{printedDate}</strong></div>
        <div className="ticket-row"><span>Time</span><strong>{printedTime}</strong></div>
        <div className="ticket-rule" />
        <div className="ticket-center ticket-note">{RECEIPT_NOTE}</div>
      </div>

      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .print-ticket {
          position: fixed;
          top: 0;
          left: -10000px;
          width: ${RECEIPT_SAFE_WIDTH_MM}mm;
          padding: ${RECEIPT_TOP_PADDING_MM}mm ${RECEIPT_SIDE_PADDING_MM}mm ${RECEIPT_BOTTOM_PADDING_MM}mm;
          box-sizing: border-box;
          background: #fff;
          color: #000;
          font-family: Arial, Helvetica, sans-serif;
          font-size: ${RECEIPT_BASE_FONT_PX}px;
          line-height: 1.35;
          overflow: hidden;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .ticket-center { text-align: center; }
        .ticket-title { font-size: ${RECEIPT_TITLE_FONT_PX}px; font-weight: 700; overflow-wrap: break-word; }
        .ticket-subtitle { margin-top: ${2 * TOKEN_SIZE_MULTIPLIER}px; font-size: ${RECEIPT_SUBTITLE_FONT_PX}px; text-transform: uppercase; letter-spacing: 0.5px; }
        .ticket-rule { margin: ${6 * TOKEN_SIZE_MULTIPLIER}px 0; border-top: 1px dashed #000; }
        .ticket-service { font-size: ${RECEIPT_SERVICE_FONT_PX}px; font-weight: 700; overflow-wrap: break-word; }
        .ticket-token { margin: ${8 * TOKEN_SIZE_MULTIPLIER}px 0; max-width: 100%; overflow: visible; font-family: "Arial Black", Arial, Helvetica, sans-serif; font-size: ${receiptTokenFontSize}mm; line-height: 1; font-weight: 900; letter-spacing: 0.5mm; white-space: nowrap; }
        .ticket-token-text { display: inline-block; transform: scaleX(${RECEIPT_TOKEN_WIDTH_SCALE}); transform-origin: center; }
        .ticket-row { display: flex; justify-content: space-between; gap: ${8 * TOKEN_SIZE_MULTIPLIER}px; margin: ${3 * TOKEN_SIZE_MULTIPLIER}px 0; }
        .ticket-note { font-size: ${RECEIPT_NOTE_FONT_PX}px; line-height: 1.2; padding-bottom: 2mm; }
        @media print {
          @page {
            size: ${RECEIPT_PAGE_WIDTH_MM}mm auto;
            margin: 0;
          }
          html,
          body {
            width: ${RECEIPT_PAGE_WIDTH_MM}mm !important;
            min-width: ${RECEIPT_PAGE_WIDTH_MM}mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          body * {
            visibility: hidden !important;
          }
          .print-ticket,
          .print-ticket * {
            visibility: visible !important;
          }
          .print-ticket {
            position: fixed;
            left: ${(RECEIPT_PAGE_WIDTH_MM - RECEIPT_SAFE_WIDTH_MM) / 2}mm;
            top: 0;
            width: ${RECEIPT_SAFE_WIDTH_MM}mm;
            max-width: ${RECEIPT_SAFE_WIDTH_MM}mm;
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}

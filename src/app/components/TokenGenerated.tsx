import { useEffect, useMemo, useState } from "react";
import { Home, Printer, CheckCircle } from "lucide-react";

const RECEIPT_ORGANIZATION_NAME = "Vavuniya South Tamil Pradeshiya Sabha";
const RECEIPT_NOTE = "Please wait until your token number is called.";
const RECEIPT_PAGE_WIDTH_MM = 80;
const RECEIPT_SAFE_WIDTH_MM = 80;
const RECEIPT_SIDE_PADDING_MM = 3;

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
  if (token.length <= 4) return 20;
  if (token.length <= 6) return 16;
  return 13;
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
      padding: 3mm ${RECEIPT_SIDE_PADDING_MM}mm 4mm;
      box-sizing: border-box;
      background: #fff;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      line-height: 1.35;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .ticket-center { text-align: center; }
    .ticket-title { font-size: 11px; font-weight: 700; overflow-wrap: break-word; }
    .ticket-subtitle { margin-top: 2px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .ticket-rule { margin: 6px 0; border-top: 1px dashed #000; }
    .ticket-service { font-size: 10px; font-weight: 700; overflow-wrap: break-word; }
    .ticket-token { margin: 8px 0; max-width: 100%; overflow: hidden; font-family: "Arial Black", Arial, Helvetica, sans-serif; font-size: ${tokenFontSize}mm; line-height: 1; font-weight: 900; letter-spacing: 0.5mm; white-space: nowrap; text-align: center; }
    .ticket-row { display: flex; justify-content: space-between; gap: 8px; margin: 3px 0; }
    .ticket-note { font-size: 9px; }
  </style>
</head>
<body>
  <div class="print-ticket">
    <div class="ticket-center ticket-title">${escapeHtml(RECEIPT_ORGANIZATION_NAME)}</div>
    <div class="ticket-center ticket-subtitle">Queue Token</div>
    <div class="ticket-rule"></div>
    <div class="ticket-center ticket-service">${escapeHtml(serviceName)}</div>
    <div class="ticket-token">${escapeHtml(token)}</div>
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
  iframe.style.height = "120mm";
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

      <div className="relative w-full max-w-md mx-auto flex flex-col items-center">
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
          className="w-full rounded-3xl overflow-hidden shadow-2xl mb-6"
          style={{ background: "#fff", border: "2px solid rgba(46,125,50,0.2)" }}
        >
          {/* Card header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ background: "linear-gradient(135deg, #2E7D32 0%, #388E3C 100%)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.18)" }}
              >
                <TokenIcon size={26} color="#fff" />
              </div>
              <div>
                <p className="text-white/80 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {serviceEmoji} {serviceName}
                </p>
                <p className="text-white font-semibold text-xs mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Service Token
                </p>
              </div>
            </div>
            <div
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontFamily: "'Inter', sans-serif" }}
            >
              VALID TODAY
            </div>
          </div>

          {/* Token number */}
          <div className="flex flex-col items-center py-10 px-6">
            <p
              className="text-sm mb-2"
              style={{ color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif", letterSpacing: "0.08em" }}
            >
              உங்கள் டோக்கன் இலக்கம் / Your Token Number
            </p>
            <div
              className="relative flex items-center justify-center w-48 h-28 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #3D0010 0%, #800020 100%)",
                boxShadow: "0 8px 32px rgba(128,0,32,0.3)",
              }}
            >
              <p
                style={{
                  fontSize: "4rem",
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
            <div className="flex gap-4 mt-5">
              <div className="text-center">
                <p className="text-xs text-muted-foreground" style={{ color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif" }}>
                  Date
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)", fontFamily: "'Inter', sans-serif" }}>
                  {printedDate}
                </p>
              </div>
              <div className="w-px" style={{ background: "var(--border)" }} />
              <div className="text-center">
                <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif" }}>
                  Time
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)", fontFamily: "'Inter', sans-serif" }}>
                  {printedTime}
                </p>
              </div>
              <div className="w-px" style={{ background: "var(--border)" }} />
              <div className="text-center">
                <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif" }}>
                  Counter
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)", fontFamily: "'Inter', sans-serif" }}>
                  A
                </p>
              </div>
            </div>
          </div>

          {/* Printer status */}
          <div
            className="flex items-center gap-3 px-6 py-4 border-t"
            style={{ borderColor: "var(--border)", background: "var(--gov-cream)" }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: printed ? "#E8F5E9" : "#FFF8E1", color: printed ? "#2E7D32" : "#F57F17" }}
            >
              <Printer size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)", fontFamily: "'Inter', sans-serif" }}>
                {printing ? "Printing token…" : "Token printed successfully"}
              </p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif" }}>
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
          style={{ fontSize: "clamp(1.1rem, 3vw, 1.4rem)", fontWeight: 700, color: "#2E7D32" }}
        >
          உங்கள் டோக்கன் வெற்றிகரமாக உருவாக்கப்பட்டது
        </p>
        <p
          className="text-center mb-6"
          style={{ color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif", fontSize: "0.9rem" }}
        >
          Your token has been generated successfully
        </p>

        {/* Countdown + action buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => startReceiptPrint(receiptPrintData)}
            className="flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold shadow-lg transition-all duration-150 active:scale-95"
            style={{
              background: "#fff",
              color: "#3D0010",
              border: "2px solid rgba(128,0,32,0.22)",
              fontSize: "1rem",
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
          >
            <Printer size={20} />
            Print Token
          </button>
          <button
            onClick={onHome}
            className="flex items-center gap-3 px-6 py-4 rounded-2xl text-white font-semibold shadow-lg transition-all duration-150 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #3D0010 0%, #800020 100%)",
              fontSize: "1rem",
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
          >
            <Home size={20} />
            Return Home
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: "rgba(212,175,55,0.3)", color: "var(--gov-gold)" }}
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
        <div className="ticket-center ticket-token">{token}</div>
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
          padding: 3mm ${RECEIPT_SIDE_PADDING_MM}mm 4mm;
          box-sizing: border-box;
          background: #fff;
          color: #000;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10px;
          line-height: 1.35;
          overflow: hidden;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .ticket-center { text-align: center; }
        .ticket-title { font-size: 11px; font-weight: 700; overflow-wrap: break-word; }
        .ticket-subtitle { margin-top: 2px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .ticket-rule { margin: 6px 0; border-top: 1px dashed #000; }
        .ticket-service { font-size: 10px; font-weight: 700; overflow-wrap: break-word; }
        .ticket-token { margin: 8px 0; max-width: 100%; overflow: hidden; font-family: "Arial Black", Arial, Helvetica, sans-serif; font-size: ${receiptTokenFontSize}mm; line-height: 1; font-weight: 900; letter-spacing: 0.5mm; white-space: nowrap; }
        .ticket-row { display: flex; justify-content: space-between; gap: 8px; margin: 3px 0; }
        .ticket-note { font-size: 9px; }
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

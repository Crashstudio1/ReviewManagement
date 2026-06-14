const governmentLogoUrl = new URL(
  "../../WhatsApp Image 2026-06-12 at 16.05.29.jpeg",
  import.meta.url,
).href;

interface GovernmentLogoProps {
  className?: string;
}

export function GovernmentLogo({ className = "" }: GovernmentLogoProps) {
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center overflow-hidden bg-white shadow-lg ${className}`}
    >
      <img
        src={governmentLogoUrl}
        alt="Vavuniya South Tamil Pradeshiya Sabha logo"
        className="h-full w-full object-contain"
        draggable={false}
      />
    </div>
  );
}

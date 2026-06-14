interface DevelopingPartnerProps {
  className?: string;
  linkClassName?: string;
}

export function DevelopingPartner({
  className = "",
  linkClassName = "",
}: DevelopingPartnerProps) {
  return (
    <span className={className}>
      Developing Partner:{" "}
      <a
        href="https://www.dazzleitsolution.com"
        target="_blank"
        rel="noreferrer"
        className={linkClassName}
      >
        www.dazzleitsolution.com
      </a>
    </span>
  );
}

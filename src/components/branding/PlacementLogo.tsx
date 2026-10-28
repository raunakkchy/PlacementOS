import React from "react";

interface PlacementLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  inverted?: boolean;
}

export const PlacementLogo: React.FC<PlacementLogoProps> = ({
  size = "md",
  className = "",
  inverted = false,
}) => {
  const iconSize = size === "xs" ? 15 : size === "sm" ? 18 : size === "lg" ? 26 : 22;
  const textSize =
    size === "xs"
      ? "text-[12px] tracking-wider"
      : size === "sm"
      ? "text-base tracking-wider"
      : size === "lg"
      ? "text-2xl tracking-wider"
      : "text-lg sm:text-xl tracking-wider";

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Minimal Target / OS Icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${inverted ? "text-[#FF6B00]" : "text-[#111315]"} flex-shrink-0`}
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9.5"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <circle
          cx="12"
          cy="12"
          r="5"
          stroke={inverted ? "#FFFFFF" : "currentColor"}
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />
        <circle cx="12" cy="12" r="2.2" fill={inverted ? "#FF6B00" : "currentColor"} />
      </svg>

      <span
        className={`font-extrabold font-mono sm:font-sans uppercase tracking-[0.14em] ${textSize} ${
          inverted ? "text-white" : "text-[#111315]"
        }`}
      >
        PLACEMENT <span className={inverted ? "text-[#FF6B00]" : ""}>OS</span>
      </span>
    </div>
  );
};


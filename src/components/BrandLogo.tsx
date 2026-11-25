interface BrandLogoProps {
  compact?: boolean;
  showSubtext?: boolean;
}

export function BrandLogo({ compact = false, showSubtext = false }: BrandLogoProps) {
  return (
    <div className="inline-flex items-center gap-3 shrink-0 select-none">
      <svg
        width={compact ? 32 : 36}
        height={compact ? 32 : 36}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          width="40"
          height="40"
          rx="10"
          fill="#131D33"
          stroke="#A3E635"
          strokeOpacity="0.35"
          strokeWidth="1.2"
        />
        <path
          d="M20 33.5C20 33.5 29.5 25.4 29.5 17.5C29.5 12.25 25.25 8 20 8C14.75 8 10.5 12.25 10.5 17.5C10.5 25.4 20 33.5 20 33.5Z"
          stroke="#E2E8F0"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M13.5 16.5L15.2 12.8H24.8L26.5 16.5H13.5Z" fill="#A3E635" />
        <path d="M15.5 21.5H24.5" stroke="#A3E635" strokeWidth="2" strokeLinecap="round" />
        <circle cx="20" cy="18.9" r="1.6" fill="#0B1120" stroke="#E2E8F0" strokeWidth="1.2" />
      </svg>
      <div className="flex flex-col leading-none">
        <span className="font-display text-base font-extrabold tracking-tight text-white whitespace-nowrap">
          BRAIN<span className="text-[#A3E635]">BAZAAR</span>
        </span>
        {showSubtext && (
          <span className="mt-1 text-[10px] font-medium tracking-wider text-slate-400 whitespace-nowrap">
            AI-POWERED VENDOR INTELLIGENCE
          </span>
        )}
      </div>
    </div>
  );
}

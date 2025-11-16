import { cn } from "@/lib/utils";

type CodeDashLogoProps = {
  className?: string;
};

export function CodeDashLogo({ className }: CodeDashLogoProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
      aria-label="CodeDash Logo"
    >
      {/* Background Circle */}
      <circle cx="60" cy="60" r="56" className="fill-primary/10 stroke-primary" strokeWidth="3" />

      {/* Code Brackets */}
      <path
        d="M40 35 L30 45 L40 55"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        className="text-primary"
      />
      <path
        d="M80 35 L90 45 L80 55"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        className="text-primary"
      />

      {/* Dash (Lightning Bolt) */}
      <path
        d="M55 50 L60 65 L58 80 M65 50 L60 65 L62 80"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      />

      {/* Inner Pulse Ring */}
      <circle cx="60" cy="60" r="36" className="stroke-primary/30" strokeWidth="2" />
      <circle cx="60" cy="60" r="24" className="stroke-primary/50" strokeWidth="1.5" />
    </svg>
  );
}

type StatusPillProps = {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger";
};

const toneClassMap = {
  neutral: "bg-[rgba(8,23,36,0.08)] text-[var(--ink)]",
  success: "bg-[rgba(0,127,115,0.14)] text-[var(--accent-strong)]",
  warning: "bg-[rgba(241,143,1,0.16)] text-[var(--warning)]",
  danger: "bg-[rgba(217,72,95,0.14)] text-[var(--danger)]"
} as const;

export function StatusPill({
  label,
  tone = "neutral"
}: StatusPillProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneClassMap[tone]}`}
    >
      {label}
    </span>
  );
}

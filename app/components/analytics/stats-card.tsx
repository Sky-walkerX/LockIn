import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="lk-card p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon size={14} />
        <span className="lk-mono text-[10px] font-bold uppercase tracking-[0.14em]">{label}</span>
      </div>
      <div className="lk-display mt-2 text-3xl font-black tracking-tight">{value}</div>
      {sub && (
        <div className="lk-mono mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{sub}</div>
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";

export function SectionCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

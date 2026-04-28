"use client";

interface GridProps {
  activeIndex: number | null;
}

export function Grid({ activeIndex }: GridProps) {
  return (
    <div className="grid grid-cols-3 gap-3 w-64 h-64">
      {Array.from({ length: 9 }, (_, i) => (
        <div
          key={i}
          className={[
            "rounded-lg border-2 transition-colors duration-100",
            activeIndex === i
              ? "bg-blue-500 border-blue-600"
              : "bg-muted border-muted-foreground/20",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

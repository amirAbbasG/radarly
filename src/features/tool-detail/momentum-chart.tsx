"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";

const RANGES = ["7D", "30D", "90D"] as const;
type Range = (typeof RANGES)[number];

function expandPoints(points: number[], count: number, offset: number) {
  return Array.from({ length: count }, (_, i) => {
    const position = (i / Math.max(1, count - 1)) * (points.length - 1);
    const left = Math.floor(position);
    const right = Math.min(points.length - 1, left + 1);
    const mix = position - left;
    const base = points[left] * (1 - mix) + points[right] * mix;
    const wave =
      Math.sin(i * 1.7 + offset) * 3 + Math.cos(i * 0.57 + offset) * 2;
    return Math.max(4, Math.min(100, Math.round(base + wave)));
  });
}

export function MomentumChart({ points }: { points: number[] }) {
  const [range, setRange] = useState<Range>("30D");
  const [hovered, setHovered] = useState<number | null>(null);

  const data = useMemo(() => {
    if (range === "7D") return expandPoints(points.slice(-6), 7, 1);
    if (range === "90D") return expandPoints(points, 20, 4);
    return expandPoints(points, 14, 2);
  }, [points, range]);

  const width = 800;
  const height = 280;
  const padX = 18;
  const padY = 24;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const min = Math.min(...data) - 6;
  const max = Math.max(...data) + 6;
  const rangeY = Math.max(1, max - min);
  const coords = data.map((value, i) => ({
    value,
    x: padX + (i / Math.max(1, data.length - 1)) * innerW,
    y: padY + innerH - ((value - min) / rangeY) * innerH,
  }));
  const line = coords.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${coords.at(-1)?.x},${height - padY} L${padX},${height - padY} Z`;
  const active = hovered === null ? coords.length - 1 : hovered;
  const activePoint = coords[active];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-4 sm:p-5">
        <div>
          <div className="text-xs text-muted-foreground">Current signal</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-heading text-2xl font-bold tabular-nums text-foreground">
              {activePoint.value}
            </span>
            <span className="text-xs font-medium text-secondary">
              momentum index
            </span>
          </div>
        </div>
        <div
          className="flex rounded-lg border border-border bg-muted p-1"
          aria-label="Chart range"
        >
          {RANGES.map(item => (
            <button
              key={item}
              type="button"
              onClick={() => setRange(item)}
              aria-pressed={range === item}
              className={
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors " +
                (range === item
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="relative p-3 sm:p-5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-64 w-full overflow-visible"
          role="img"
          aria-label={`${range} momentum chart ending at ${data.at(-1)}`}
          preserveAspectRatio="none"
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <linearGradient id="momentum-area" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--secondary)"
                stopOpacity="0.22"
              />
              <stop
                offset="100%"
                stopColor="var(--secondary)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3, 4].map(i => {
            const y = padY + (innerH / 4) * i;
            return (
              <line
                key={i}
                x1={padX}
                x2={width - padX}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          <motion.path
            key={`${range}-area`}
            d={area}
            fill="url(#momentum-area)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
          />
          <motion.path
            key={`${range}-line`}
            d={line}
            fill="none"
            stroke="var(--secondary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
          />
          {coords.map((p, i) => (
            <rect
              key={i}
              x={p.x - innerW / data.length / 2}
              y={0}
              width={innerW / data.length}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
            />
          ))}
          <motion.line
            x1={activePoint.x}
            x2={activePoint.x}
            y1={padY}
            y2={height - padY}
            stroke="var(--border)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            animate={{ x1: activePoint.x, x2: activePoint.x }}
          />
          <motion.circle
            cx={activePoint.x}
            cy={activePoint.y}
            r="5"
            fill="var(--secondary)"
            stroke="var(--card)"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
            animate={{ cx: activePoint.x, cy: activePoint.y }}
          />
        </svg>
        <div className="mt-1 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
          <span>
            {range === "7D"
              ? "7 days ago"
              : range === "30D"
                ? "30 days ago"
                : "90 days ago"}
          </span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}

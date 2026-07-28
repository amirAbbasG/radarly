export function Sparkline({
  points,
  className,
  strokeClassName = "text-secondary",
  fill = true,
  width = 120,
  height = 40,
}: {
  points: number[];
  className?: string;
  strokeClassName?: string;
  fill?: boolean;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(1, max - min);
  const stepX = width / (points.length - 1);
  const pad = 3;

  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = height - pad - ((p - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  const area = `${line} L${width},${height} L0,${height} Z`;
  const gid = `spark-${points.join("-").slice(0, 12)}-${width}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} className={strokeClassName} fill={`url(#${gid})`} />
        </>
      )}
      <path
        d={line}
        className={strokeClassName}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

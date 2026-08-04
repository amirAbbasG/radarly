"use client";

function faviconUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).origin}&sz=80`;
  } catch {
    return undefined;
  }
}

function initials(name: string) {
  return name
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const sizeMap = {
  sm: { container: "size-9 rounded-lg", text: "text-xs font-bold" },
  md: { container: "h-11 w-11 rounded-xl", text: "text-sm font-bold" },
  lg: { container: "size-16 rounded-2xl", text: "text-xl font-bold" },
} as const;

export function ToolAvatar({
  name,
  logo,
  website,
  size = "md",
}: {
  name: string;
  logo?: string | null;
  website?: string | null;
  size?: keyof typeof sizeMap;
}) {
  const s = sizeMap[size];
  return (
    <div
      className={
        "flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 font-heading text-foreground ring-1 ring-inset ring-border relative " +
        s.container +
        " " +
        s.text
      }
    >
      {initials(name)}
      {(logo || website) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo ?? faviconUrl(website)}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
          onError={e => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
          loading="lazy"
        />
      )}
    </div>
  );
}

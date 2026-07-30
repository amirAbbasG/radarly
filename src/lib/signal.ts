import { Flame, Minus, TrendingUp } from "lucide-react";
import type { Signal } from "@/lib/tools-data";

export const SIGNAL_CONFIG: Record<
  Signal,
  { label: string; icon: typeof Flame; className: string }
> = {
  hot: {
    label: "Hot",
    icon: Flame,
    className: "text-accent bg-accent/10 border-accent/20",
  },
  rising: {
    label: "Rising",
    icon: TrendingUp,
    className: "text-secondary bg-secondary/10 border-secondary/20",
  },
  steady: {
    label: "Steady",
    icon: Minus,
    className: "text-muted-foreground bg-muted border-border",
  },
};

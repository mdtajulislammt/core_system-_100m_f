import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-indigo-900/60 text-indigo-200 border-indigo-700/50",
        secondary:
          "border border-zinc-700 bg-zinc-800 text-zinc-300",
        destructive:
          "border border-rose-800/50 bg-rose-950/60 text-rose-300",
        outline:
          "text-zinc-300 border border-zinc-700",
        success:
          "border border-emerald-800/50 bg-emerald-950/60 text-emerald-300",
        warning:
          "border border-amber-800/50 bg-amber-950/60 text-amber-300",
        info:
          "border border-sky-800/50 bg-sky-950/60 text-sky-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

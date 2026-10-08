import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 active:scale-[0.98]",
        destructive:
          "bg-rose-600 text-white shadow-sm hover:bg-rose-500 active:scale-[0.98]",
        outline:
          "border border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-100 hover:text-white",
        secondary:
          "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
        ghost:
          "hover:bg-zinc-800 text-zinc-300 hover:text-white",
        link: "text-indigo-400 underline-offset-4 hover:underline",
        subtle: "bg-indigo-950/60 text-indigo-300 border border-indigo-700/50 hover:bg-indigo-900/60",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8 text-base",
        icon: "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

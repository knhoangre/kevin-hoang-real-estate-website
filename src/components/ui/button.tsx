import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { PILL_TONES } from "@/lib/pill"

/**
 * default, destructive, outline and secondary are the site's one button
 * (@/lib/pill) unless they are icon-sized. `field` is the old outline, for a
 * trigger that is really a form field — it sits among inputs and must look like
 * one. ghost and link are quiet controls and do not shine.
 */
const PILL_VARIANTS = ["default", "destructive", "outline", "secondary"] as const

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: PILL_TONES.ink,
        destructive: PILL_TONES.dangerSolid,
        outline: PILL_TONES.outline,
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        field:
          "rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "rounded-md hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    compoundVariants: [
      {
        variant: [...PILL_VARIANTS],
        size: ["default", "sm", "lg"],
        className: "btn-pill rounded-full font-semibold",
      },
      { variant: [...PILL_VARIANTS], size: "icon", className: "rounded-md" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

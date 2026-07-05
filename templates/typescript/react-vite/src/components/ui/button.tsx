import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps, ReactElement } from "react"

import { cn } from "@/lib/utils"

/** 按钮样式变体; 焦点细而可见, hover/active 有可见特效, respect reduced-motion. */
// eslint-disable-next-line react-refresh/only-export-components
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95",
        outline:
          "border border-border bg-background hover:bg-accent/10 active:scale-95",
        ghost: "hover:bg-accent/10 active:scale-95",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/** 按钮属性: 原生 button 属性 + variant/size. */
export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>

/**
 * 通用按钮原语.
 * @param props 原生 button 属性与 variant/size.
 * @returns 按钮元素.
 */
export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonProps): ReactElement {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

import { Menu } from "@base-ui/react/menu"
import { Check, Monitor, Moon, Sun } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import type { ReactElement } from "react"
import * as React from "react"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/components/theme-context"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ThemeOption = "light" | "dark" | "system"

const OPTION_ICON: Record<ThemeOption, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

/**
 * 右上角三态主题切换 (亮/暗/系统).
 * @returns 固定于右上角的主题切换控件.
 */
export function ThemeToggle(): ReactElement {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  const shouldReduceMotion = useReducedMotion()
  const [open, setOpen] = React.useState(false)

  const options: { value: ThemeOption; label: string }[] = [
    { value: "light", label: t("themeLight") },
    { value: "dark", label: t("themeDark") },
    { value: "system", label: t("themeSystem") },
  ]

  const CurrentIcon = OPTION_ICON[theme]

  return (
    <Menu.Root open={open} onOpenChange={setOpen}>
      <Menu.Trigger
        aria-label={t("themeToggle")}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "fixed top-4 right-4 z-50 rounded-xl hover:scale-105 data-[popup-open]:bg-accent/10"
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, rotate: -90, scale: 0.6 }
            }
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : { opacity: 1, rotate: 0, scale: 1 }
            }
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, rotate: 90, scale: 0.6 }
            }
            transition={{
              duration: shouldReduceMotion ? 0 : 0.2,
              ease: "easeOut",
            }}
            className="flex items-center justify-center"
          >
            <CurrentIcon className="size-5" aria-hidden />
          </motion.span>
        </AnimatePresence>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          sideOffset={8}
          align="end"
          className="z-50 outline-none"
        >
          <Menu.Popup
            className={cn(
              "min-w-36 origin-[var(--transform-origin)] rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg outline-none",
              "transition duration-200 ease-out data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
              "motion-reduce:transition-none"
            )}
          >
            <Menu.RadioGroup
              value={theme}
              onValueChange={(value) => {
                setTheme(value as ThemeOption)
                setOpen(false)
              }}
            >
              {options.map((option) => {
                const OptionIcon = OPTION_ICON[option.value]
                return (
                  <Menu.RadioItem
                    key={option.value}
                    value={option.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors outline-none select-none",
                      "data-[checked]:text-primary data-[highlighted]:bg-accent/10 motion-reduce:transition-none"
                    )}
                  >
                    <OptionIcon className="size-4" aria-hidden />
                    <span className="flex-1">{option.label}</span>
                    <Menu.RadioItemIndicator>
                      <Check className="size-4" aria-hidden />
                    </Menu.RadioItemIndicator>
                  </Menu.RadioItem>
                )
              })}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

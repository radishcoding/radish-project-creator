import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import type { ReactElement } from "react"
import { Outlet, useLocation } from "react-router"

import { ThemeToggle } from "@/components/theme-toggle"

/** 根布局, 提供白色背景, 右上角主题切换与页面过渡; 首页保持白屏. */
export function RootLayout(): ReactElement {
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="min-h-svh bg-background text-foreground">
      <ThemeToggle />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.2,
            ease: "easeOut",
          }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

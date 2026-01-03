"use client"

import * as React from "react"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, style, ...props }, ref) => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    return () => observer.disconnect()
  }, [])

  return (
    <textarea
      style={{
        border: `1px solid ${isDark ? '#6b7280' : '#9ca3af'}`,
        borderWidth: '1px',
        borderStyle: 'solid',
        ...style
      }}
      className={cn(
        "flex min-h-[60px] w-full rounded-md bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "border border-gray-400 dark:border-gray-500",
        "text-gray-900 dark:text-white",
        "placeholder:text-gray-400 dark:placeholder:text-gray-500",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }

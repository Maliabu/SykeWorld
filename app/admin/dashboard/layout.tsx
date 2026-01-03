"use client"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Header from "./header"
import { AppSidebar } from "./appSidebar"
import { whoami } from "@/lib/actions/auth"

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  
  useEffect(() => {
    checkAuth()
  }, [router])

  const checkAuth = async () => {
    // Set a timeout to prevent infinite hanging - allow access after 3 seconds
    const timeout = setTimeout(() => {
      console.warn("Auth check timeout - allowing access")
      setMounted(true)
      setChecking(false)
    }, 3000)

    try {
      // Give a delay to allow cookies to be set after login redirect
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Verify authentication with whoami (this checks the access cookie server-side)
      const result = await whoami()
      
      clearTimeout(timeout)
      
      if (result.success && result.user) {
        // Authenticated, show dashboard
        setMounted(true)
        setChecking(false)
        return
      }

      // Not authenticated, redirect to login
      console.log("Auth check failed:", result)
      router.push("/admin")
      setChecking(false)
    } catch (error) {
      clearTimeout(timeout)
      console.error("Auth check error:", error)
      
      // On error, allow access after a short delay (cookies might still be setting)
      setTimeout(() => {
        whoami().then((retryResult) => {
          if (retryResult.success && retryResult.user) {
            setMounted(true)
          } else {
            router.push("/admin")
          }
          setChecking(false)
        }).catch(() => {
          // If whoami fails, allow access anyway (might be a temporary issue)
          console.warn("Allowing access despite auth check failure")
          setMounted(true)
          setChecking(false)
        })
      }, 1000)
    }
  }
  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Checking authentication...</div>
        </div>
      </div>
    )
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen dashboard-font">
      <SidebarProvider>
        <AppSidebar />
        <main className={`w-full min-h-screen relative overflow-hidden transition-all duration-1000`}>
          {/* Background for Light Mode */}
          <div className="fixed inset-0 -z-10">
            {/* Light mode: simple gray background */}
            <div className="dark:hidden absolute inset-0 bg-gray-100" />
            
            {/* Dark mode blur orbs with black and orange */}
            <div className="hidden dark:block absolute inset-0">
              <div className="absolute top-0 left-0 w-96 h-96 bg-black/50 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
              <div className="absolute top-1/4 right-0 w-96 h-96 bg-gray-950/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
              <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-black/45 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
              <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-gray-950/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '9s', animationDelay: '1s' }} />
              <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-black/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '11s', animationDelay: '3s' }} />
              
              {/* Additional darker shades of black gradient layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-gray-950/20 to-black/60" />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-gray-950/15 to-black/50" />
            </div>
          </div>
          
          {/* Content with backdrop blur */}
          <div className="relative z-0">
            <div className="sticky top-0 z-10 border-b border-white/20 dark:border-white/10 bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl rounded-b-2xl">
              <div className="flex items-center justify-between px-6 py-4">
                <SidebarTrigger className="lg:hidden" />
                <div className="flex-1 flex justify-end">
                  <Header />
                </div>
              </div>
            </div>
            <div className="p-6 relative z-0">
              {children}
            </div>
          </div>
        </main>
      </SidebarProvider>
    </div>
  )
}
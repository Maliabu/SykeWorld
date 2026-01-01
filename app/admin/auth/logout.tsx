"use client"

import { Button } from "@/components/ui/button"
import { logout } from "@/lib/actions/auth"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export default function Logout(){
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleLogout(){
        try {
            setLoading(true)
            const result = await logout()
            
            // Logout always succeeds, just clear localStorage and redirect
            // Clear any localStorage items
            window.localStorage.removeItem("token")
            window.localStorage.removeItem("id")
            window.localStorage.removeItem("username")
            window.localStorage.removeItem("name")
            window.localStorage.removeItem("email")
            window.localStorage.removeItem("userType")
            window.localStorage.removeItem("access")
            window.localStorage.removeItem("refresh")
            
            // Redirect to admin login
            router.push("/admin")
            router.refresh()
        } catch (error: any) {
            console.error("Logout error:", error)
            toast.error("An error occurred during logout")
        } finally {
            setLoading(false)
        }
    }

    return(
        <Button 
            id="submit1" 
            onClick={handleLogout} 
            className="w-full"
            disabled={loading}
        >
            {loading ? "Logging out..." : "Logout"}
        </Button>
    )
}

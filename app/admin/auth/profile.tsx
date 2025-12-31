"use client"
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/hooks/useSession";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/actions/users";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Profile(){
    const { user } = useSession();
    const router = useRouter();
    const [profilePicture, setProfilePicture] = useState<string | null>(null);

    const displayName = user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username || "User";

    useEffect(() => {
        const loadProfilePicture = async () => {
            if (user) {
                const result = await getUserProfile();
                if (result.success && result.user?.profilePicture) {
                    setProfilePicture(result.user.profilePicture);
                }
            }
        };
        loadProfilePicture();
    }, [user]);

    const handleClick = () => {
        try {
            router.push("/admin/dashboard/profile");
        } catch (error) {
            console.error("Navigation error:", error);
            window.location.href = "/admin/dashboard/profile";
        }
    };

    return(
        <Button
            variant="ghost"
            onClick={handleClick}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
        >
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
              {profilePicture && profilePicture !== "default.jpg" ? (
                <img
                  src={profilePicture}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : user ? (
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:block">
              {displayName}
            </span>
        </Button>
    )
}
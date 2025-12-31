"use client"
import Link from "next/link";
import { useSession } from "@/lib/hooks/useSession";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/actions/users";
import { User } from "lucide-react";

export default function Logged(){
    const { user, loading } = useSession();
    const [profilePicture, setProfilePicture] = useState<string | null>(null);

    const displayName = user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username || user?.email || "User";

    useEffect(() => {
        const loadProfilePicture = async () => {
            if (user) {
                const result = await getUserProfile();
                if (result.success && result.user?.profilePicture) {
                    setProfilePicture(result.user.profilePicture);
                }
            }
        };
        if (!loading) {
            loadProfilePicture();
        }
    }, [user, loading]);

    if (loading) {
      return (
        <div className="flex flex-row justify-between bg-secondary rounded-md p-4">
          <div className="text-sm font-medium">Loading...</div>
        </div>
      );
    }

    const handleClick = () => {
        try {
            window.location.href = "/admin/dashboard/profile";
        } catch (error) {
            console.error("Navigation error:", error);
        }
    };

    return(
        <button
            onClick={handleClick}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-left"
        >
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold overflow-hidden">
              {profilePicture && profilePicture !== "default.jpg" ? (
                <img
                  src={profilePicture}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {displayName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">View Profile</div>
            </div>
        </button>
    )
}

"use client"

import { Moon, Sun, User as UserIcon, Bell, Ticket, ShoppingCart, ListChecks, Search } from "lucide-react";
import Profile from "../auth/profile";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useSession } from "@/lib/hooks/useSession";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { getLoggedInUsers, getUserProfile } from "@/lib/actions/users";
import { getNewNotificationsCount, getNewNotificationsForPopup, markNotificationAsRead } from "@/lib/actions/notifications";
import { getOpenTicketsCount } from "@/lib/actions/tickets";
import { getUserTaskCount } from "@/lib/actions/staff";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { navigationData } from "./appSidebar";
import { type LucideIcon } from "lucide-react";

export default function Header(){
    const { setTheme } = useTheme();
    const { user, loading } = useSession();
    const router = useRouter();
    const [loggedInUsers, setLoggedInUsers] = useState<any[]>([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [ticketCount, setTicketCount] = useState(0);
    const [taskCount, setTaskCount] = useState(0);
    const [hasShownLoginNotifications, setHasShownLoginNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [userProfilePicture, setUserProfilePicture] = useState<string | null>(null);

    useEffect(() => {
      const fetchLoggedInUsers = async () => {
        try {
          const result = await getLoggedInUsers();
          if (result.success) {
            setLoggedInUsers(result.users || []);
          }
        } catch (error) {
          console.error("Failed to fetch logged in users:", error);
        }
      };

      fetchLoggedInUsers();
      // Refresh every 30 seconds to keep avatars updated
      const interval = setInterval(fetchLoggedInUsers, 30000);
      return () => clearInterval(interval);
    }, []);

    // Load current user's profile picture
    useEffect(() => {
      const loadUserProfilePicture = async () => {
        if (!loading && user) {
          try {
            const result = await getUserProfile();
            if (result.success && result.user?.profilePicture) {
              setUserProfilePicture(result.user.profilePicture);
            }
          } catch (error) {
            console.error("Failed to fetch user profile picture:", error);
          }
        }
      };
      loadUserProfilePicture();
    }, [user, loading]);

    // Fetch notification, ticket, and task counts
    useEffect(() => {
      if (!loading && user) {
        const fetchCounts = async () => {
          try {
            const [notifResult, ticketResult, taskResult] = await Promise.all([
              getNewNotificationsCount(),
              getOpenTicketsCount(),
              getUserTaskCount(),
            ]);
            
            if (notifResult.success && notifResult.count !== undefined) {
              setNotificationCount(notifResult.count);
            }
            if (ticketResult.success && ticketResult.count !== undefined) {
              setTicketCount(ticketResult.count);
            }
            if (taskResult.success && taskResult.count !== undefined) {
              setTaskCount(taskResult.count);
            }
          } catch (error) {
            console.error("Failed to fetch counts:", error);
          }
        };

        fetchCounts();
        // Refresh counts every 30 seconds
        const interval = setInterval(fetchCounts, 30000);
        
        // Listen for notification updates
        const handleNotificationUpdate = () => {
          fetchCounts();
        };
        window.addEventListener('notificationUpdated', handleNotificationUpdate);
        window.addEventListener('taskUpdated', handleNotificationUpdate);
        
        return () => {
          clearInterval(interval);
          window.removeEventListener('notificationUpdated', handleNotificationUpdate);
          window.removeEventListener('taskUpdated', handleNotificationUpdate);
        };
      }
    }, [loading, user]);

    // Show notifications on login
    useEffect(() => {
      if (!loading && user && !hasShownLoginNotifications) {
        const showLoginNotifications = async () => {
          try {
            const result = await getNewNotificationsForPopup();
            if (result.success && result.notifications.length > 0) {
              // Show toasts for each new notification
              result.notifications.forEach((notif: any) => {
                toast.info(notif.title, {
                  description: notif.message,
                  duration: 5000,
                  action: {
                    label: "View",
                    onClick: () => {
                      markNotificationAsRead(notif.id);
                      router.push("/admin/dashboard/notifications");
                    },
                  },
                });
              });
              setHasShownLoginNotifications(true);
            }
          } catch (error) {
            console.error("Failed to show login notifications:", error);
          }
        };

        // Small delay to ensure page is loaded
        setTimeout(showLoginNotifications, 1000);
      }
    }, [loading, user, hasShownLoginNotifications, router]);

    const displayName = user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username || user?.email || "User";

    // Flatten navigation items for search
    const flattenedNavItems = useMemo(() => {
      const items: Array<{ title: string; url: string; icon?: LucideIcon; parent?: string; adminOnly?: boolean }> = [];
      
      navigationData.navMain.forEach((navItem) => {
        // Add parent item if it has a direct URL
        if (navItem.url && navItem.url !== "#") {
          items.push({
            title: navItem.title,
            url: navItem.url,
            icon: navItem.icon,
            adminOnly: navItem.adminOnly,
          });
        }
        
        // Add sub-items
        if (navItem.items && navItem.items.length > 0) {
          navItem.items.forEach((subItem) => {
            items.push({
              title: subItem.title,
              url: subItem.url,
              icon: subItem.icon,
              parent: navItem.title,
              adminOnly: subItem.adminOnly,
            });
          });
        }
      });
      
      return items;
    }, []);

    // Filter navigation items based on search query and permissions
    const searchResults = useMemo(() => {
      if (!searchQuery.trim()) return [];
      
      const query = searchQuery.toLowerCase();
      const isAdmin = user?.isSuperuser || user?.userType === "admin";
      
      return flattenedNavItems
        .filter((item) => {
          // Filter by adminOnly
          if (item.adminOnly && !isAdmin) return false;
          
          // Search in title and parent
          const titleMatch = item.title.toLowerCase().includes(query);
          const parentMatch = item.parent?.toLowerCase().includes(query);
          
          return titleMatch || parentMatch;
        })
        .slice(0, 10); // Limit to 10 results
    }, [searchQuery, flattenedNavItems, user]);

    const handleSearchItemClick = (url: string) => {
      setIsSearchOpen(false);
      setSearchQuery("");
      router.push(url);
    };

    return (
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          {/* Search Bar */}
          <Popover open={isSearchOpen || (searchQuery.trim().length > 0)} onOpenChange={setIsSearchOpen}>
            <PopoverTrigger asChild>
              <div className="relative flex-1 sm:flex-initial min-w-[120px]">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="pl-7 sm:pl-10 w-full sm:w-48 md:w-64 h-8 sm:h-9 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                />
              </div>
            </PopoverTrigger>
            {(isSearchOpen || searchQuery.trim().length > 0) && (
              <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 p-0" align="start" side="bottom" onOpenAutoFocus={(e) => e.preventDefault()}>
                <div className="max-h-96 overflow-y-auto">
                  {searchQuery.trim() ? (
                    searchResults.length > 0 ? (
                      <div className="p-2">
                        {searchResults.map((item, index) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={index}
                              onClick={() => handleSearchItemClick(item.url)}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                            >
                              {Icon && <Icon className="h-4 w-4 text-gray-500" />}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {item.title}
                                </div>
                                {item.parent && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.parent}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No results found
                      </div>
                    )
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                      Start typing to search...
                    </div>
                  )}
                </div>
              </PopoverContent>
            )}
          </Popover>
          {/* Logged In Users Avatars */}
          {loggedInUsers.length > 0 && (
            <div className="hidden md:flex relative w-48 lg:w-64 h-8 sm:h-9 rounded-md px-2 sm:px-3 items-center gap-1 sm:gap-2" style={{ backgroundColor: '#3A3F58' }}>
              <span className="text-[10px] sm:text-xs font-medium text-white whitespace-nowrap">Logged In:</span>
              <div className="flex items-center -space-x-1.5 sm:-space-x-2 flex-1 justify-end">
                {loggedInUsers.slice(0, 5).map((loggedUser, index) => {
                  const userName = loggedUser.firstName && loggedUser.lastName
                    ? `${loggedUser.firstName} ${loggedUser.lastName}`
                    : loggedUser.username || loggedUser.email || "User";
                  
                  return (
                    <Tooltip key={loggedUser.id || index}>
                      <TooltipTrigger asChild>
                        <div
                          className="relative w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 overflow-hidden hover:z-10 hover:scale-110 transition-transform cursor-pointer"
                          style={{ zIndex: 10 - index }}
                        >
                          {loggedUser.profilePicture && loggedUser.profilePicture !== "default.jpg" ? (
                            <img
                              src={loggedUser.profilePicture}
                              alt={userName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-400 text-[10px] font-semibold uppercase">
                              {(loggedUser.firstName?.[0] || loggedUser.username?.[0] || loggedUser.email?.[0] || "U").toUpperCase()}
                            </div>
                          )}
                          {/* Online indicator */}
                          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-green-500 border border-white dark:border-gray-800 rounded-full"></div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">{userName}</p>
                        <p className="text-xs text-muted-foreground">{loggedUser.email}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                {loggedInUsers.length > 5 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-orange-500 text-white flex items-center justify-center text-[10px] font-semibold hover:z-10 hover:scale-110 transition-transform cursor-pointer">
                        +{loggedInUsers.length - 5}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">{loggedInUsers.length - 5} more users online</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          )}
          {!loading && user && (
            <div className="hidden sm:flex items-center gap-2 lg:gap-3">
              <button
                onClick={() => {
                  try {
                    window.location.href = "/admin/dashboard/profile";
                  } catch (error) {
                    console.error("Navigation error:", error);
                  }
                }}
                className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {userProfilePicture && userProfilePicture !== "default.jpg" ? (
                    <img
                      src={userProfilePicture}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
                <div className="hidden lg:block">
                  <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    {displayName}
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                    {user.isSuperuser && (
                      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-[10px] sm:text-xs px-1 sm:px-1.5 py-0">
                        Admin
                      </Badge>
                    )}
                    {user.isStaff && !user.isSuperuser && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-[10px] sm:text-xs px-1 sm:px-1.5 py-0">
                        Staff
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Notifications Icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/admin/dashboard/notifications">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 sm:h-9 sm:w-9"
                  style={{ backgroundColor: '#3A3F58' }}
                >
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-orange-500 text-white text-[10px] sm:text-xs flex items-center justify-center font-semibold">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  )}
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Notifications {notificationCount > 0 && `(${notificationCount} new)`}</p>
            </TooltipContent>
          </Tooltip>

          {/* Tickets Icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/admin/dashboard/tickets">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 sm:h-9 sm:w-9"
                  style={{ backgroundColor: '#3A3F58' }}
                >
                  <Ticket className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  {ticketCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-orange-500 text-white text-[10px] sm:text-xs flex items-center justify-center font-semibold">
                      {ticketCount > 9 ? "9+" : ticketCount}
                    </span>
                  )}
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tickets {ticketCount > 0 && `(${ticketCount} open)`}</p>
            </TooltipContent>
          </Tooltip>

          {/* Tasks Icon */}
          {(user?.isStaff || user?.isSuperuser) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/admin/dashboard/staff/tasks">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 sm:h-9 sm:w-9"
                    style={{ backgroundColor: '#3A3F58' }}
                  >
                    <ListChecks className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    {taskCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-orange-500 text-white text-[10px] sm:text-xs flex items-center justify-center font-semibold">
                        {taskCount > 9 ? "9+" : taskCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tasks {taskCount > 0 && `(${taskCount} assigned)`}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* POS Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/admin/dashboard/pos">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 sm:h-9 sm:w-9"
                  style={{ backgroundColor: '#3A3F58' }}
                >
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Point of Sale</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="border-none shadow-none sm:w-auto sm:px-3 bg-white dark:bg-gray-800">
                <div className="flex justify-center border-none items-center gap-1.5 sm:gap-2">
                  <Sun className="h-4 w-4 sm:h-[1.2rem] sm:w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-gray-900 dark:text-white" />
                  <Moon className="h-4 w-4 sm:h-[1.2rem] sm:w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-gray-900 dark:text-white" />
                  <span className="hidden sm:inline text-gray-900 dark:text-white text-xs sm:text-sm">Light/Dark</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Profile />
        </div>
      </div>
    );
}
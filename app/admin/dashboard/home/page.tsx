"use client";

import { useEffect, useState } from "react";
import { getAllRooms } from "@/lib/actions/bookings";
import { getAllBookings } from "@/lib/actions/bookings";
import { getAllPayments, syncBookingStatuses } from "@/lib/actions/payments";
import { getLoggedInUsers, getRecentlyAddedUsers } from "@/lib/actions/users";
import { getMonthlyEarnings } from "@/lib/actions/reports";
import { getAllSubscriptions } from "@/lib/actions/subscriptions";
import { getUserActivityStats } from "@/lib/actions/activityLog";
import { getNewNotificationsCount } from "@/lib/actions/notifications";
import { getUserTaskCount } from "@/lib/actions/staff";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Bed,
  CheckCircle2,
  Clock,
  XCircle,
  UserCircle,
  UserPlus,
  Mail,
  LineChart,
  Mailbox,
  Activity,
  Bell,
  ListChecks
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useSession } from "@/lib/hooks/useSession";
import {
  AreaChart as RechartsAreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function DashboardHome() {
  const { user } = useSession();
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalSubscriptions: 0,
  });
  const [roomStatusCounts, setRoomStatusCounts] = useState({
    available: 0,
    occupied: 0,
    cleaning: 0,
    maintenance: 0,
    unavailable: 0,
  });
  const [loggedInUsers, setLoggedInUsers] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<any[]>([]);
  const [userActivityStats, setUserActivityStats] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [textColor, setTextColor] = useState("text-gray-900 dark:text-white");

  useEffect(() => {
    loadStats();
    
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  const loadStats = async () => {
    try {
      // First, sync booking statuses with completed payments (fix any mismatches)
      try {
        await syncBookingStatuses();
      } catch (syncError) {
        console.error("Failed to sync booking statuses:", syncError);
        // Continue anyway - don't block the dashboard
      }

      const [roomsResult, bookingsResult, paymentsResult, loggedInResult, recentUsersResult, earningsResult, subscriptionsResult, activityStatsResult, notifCountResult, taskCountResult] = await Promise.all([
        getAllRooms(),
        getAllBookings(undefined),
        getAllPayments(),
        getLoggedInUsers(),
        getRecentlyAddedUsers(5),
        getMonthlyEarnings(12),
        getAllSubscriptions(),
        getUserActivityStats(),
        getNewNotificationsCount(),
        getUserTaskCount(),
      ]);

      const rooms = roomsResult.success ? roomsResult.rooms || [] : [];
      const bookings = bookingsResult.success ? bookingsResult.bookings || [] : [];
      const payments = paymentsResult.success ? paymentsResult.payments || [] : [];

      // Debug: Log room data to diagnose issues
      if (typeof window !== "undefined") {
        console.log("Rooms result:", {
          success: roomsResult.success,
          error: roomsResult.error,
          roomsCount: rooms.length,
          firstRoom: rooms.length > 0 ? rooms[0] : null
        });
      }

      // Debug: Log status values to help diagnose issues (only in development)
      if (typeof window !== "undefined" && payments.length > 0) {
        const completedPayments = payments.filter((p: any) => {
          const status = (p.status || "").toUpperCase();
          return status === "COMPLETED" || status === "COMPLETE" || status === "SUCCESS";
        });
        console.log("Total payments:", payments.length, "Completed:", completedPayments.length);
        console.log("Payment statuses sample:", payments.slice(0, 5).map((p: any) => ({ status: p.status, amount: p.amount })));
      }
      if (typeof window !== "undefined" && bookings.length > 0) {
        const confirmedBookings = bookings.filter((b: any) => (b.status || "").toLowerCase() === "confirmed");
        console.log("Total bookings:", bookings.length, "Confirmed:", confirmedBookings.length);
        console.log("Booking statuses sample:", bookings.slice(0, 5).map((b: any) => ({ status: b.status })));
      }

      const availableRooms = rooms.filter((r: any) => r.status === "available").length;
      
      // Debug: Log room statuses to diagnose
      if (typeof window !== "undefined" && rooms.length > 0) {
        console.log("Total rooms:", rooms.length);
        console.log("Room statuses sample:", rooms.slice(0, 5).map((r: any) => ({ 
          roomNumber: r.roomNumber, 
          status: r.status,
          statusType: typeof r.status 
        })));
        const uniqueStatuses = [...new Set(rooms.map((r: any) => r.status))];
        console.log("Unique room statuses found:", uniqueStatuses);
      }
      
      // Count rooms by status (case-insensitive to handle any variations)
      // Also handle null/undefined statuses
      const statusCounts = {
        available: rooms.filter((r: any) => {
          const status = String(r?.status || "").toLowerCase().trim();
          return status === "available";
        }).length,
        occupied: rooms.filter((r: any) => {
          const status = String(r?.status || "").toLowerCase().trim();
          return status === "occupied" || status === "booked";
        }).length,
        cleaning: rooms.filter((r: any) => {
          const status = String(r?.status || "").toLowerCase().trim();
          return status === "cleaning";
        }).length,
        maintenance: rooms.filter((r: any) => {
          const status = String(r?.status || "").toLowerCase().trim();
          return status === "maintenance";
        }).length,
        unavailable: rooms.filter((r: any) => {
          const status = String(r?.status || "").toLowerCase().trim();
          return status === "unavailable";
        }).length,
      };
      
      if (typeof window !== "undefined") {
        console.log("Room status counts calculated:", statusCounts);
        console.log("Total rooms processed:", rooms.length);
      }
      setRoomStatusCounts(statusCounts);
      
      // Case-insensitive status checks for bookings
      const pendingBookings = bookings.filter((b: any) => 
        (b.status || "").toLowerCase() === "pending"
      ).length;
      const confirmedBookings = bookings.filter((b: any) => 
        (b.status || "").toLowerCase() === "confirmed"
      ).length;
      
      // Case-insensitive status checks for payments - check for COMPLETED, COMPLETE, or Success
      const totalRevenue = payments
        .filter((p: any) => {
          const status = (p.status || "").toUpperCase();
          return status === "COMPLETED" || status === "COMPLETE" || status === "SUCCESS";
        })
        .reduce((sum: number, p: any) => {
          const amount = parseFloat(p.amount || "0");
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

      const currentMonth = new Date().getMonth();
      const monthlyRevenue = payments
        .filter((p: any) => {
          const status = (p.status || "").toUpperCase();
          if (status !== "COMPLETED" && status !== "COMPLETE" && status !== "SUCCESS") return false;
          // Try different date field names
          const paymentDate = p.createdAt || p.created_at || p.created;
          if (!paymentDate) return false;
          try {
            const date = new Date(paymentDate);
            return date.getMonth() === currentMonth;
          } catch {
            return false;
          }
        })
        .reduce((sum: number, p: any) => {
          const amount = parseFloat(p.amount || "0");
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

      const subscriptions = subscriptionsResult.success ? subscriptionsResult.subscriptions || [] : [];

      setStats({
        totalRooms: rooms.length,
        availableRooms,
        totalBookings: bookings.length,
        pendingBookings,
        confirmedBookings,
        totalRevenue,
        monthlyRevenue,
        totalSubscriptions: subscriptions.length,
      });

      // Set logged in users
      if (loggedInResult.success) {
        setLoggedInUsers(loggedInResult.users || []);
      }

      // Set recently added users
      if (recentUsersResult.success) {
        setRecentUsers(recentUsersResult.users || []);
      }

      // Set monthly earnings
      if (earningsResult.success) {
        setMonthlyEarnings(earningsResult.data || []);
      }

      // Set user activity stats
      if (activityStatsResult.success) {
        setUserActivityStats(activityStatsResult.stats || []);
      }

      // Set notification count
      if (notifCountResult.success) {
        setNotificationCount(notifCountResult.count || 0);
      }

      // Set task count
      if (taskCountResult.success) {
        setTaskCount(taskCountResult.count || 0);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading dashboard...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Rooms",
      value: stats.totalRooms,
      description: `${stats.availableRooms} available`,
      icon: Home,
      iconBgColor: "#3A3F58", // Dark color
    },
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      description: `${stats.confirmedBookings} confirmed`,
      icon: Calendar,
      iconBgColor: "#3A3F58", // Dark color
    },
    {
      title: "Pending Bookings",
      value: stats.pendingBookings,
      description: "Requires attention",
      icon: Clock,
      iconBgColor: "#3A3F58", // Dark color
    },
    {
      title: "Total Revenue",
      value: `UGX ${stats.totalRevenue.toLocaleString()}`,
      description: `UGX ${stats.monthlyRevenue.toLocaleString()} this month`,
      icon: DollarSign,
      iconBgColor: "#3A3F58", // Dark color
    },
    {
      title: "Subscriptions",
      value: stats.totalSubscriptions,
      description: "Newsletter subscribers",
      icon: Mailbox,
      iconBgColor: "#3A3F58", // Dark color
    },
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getTimezone = () => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Get timezone abbreviation
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZoneName: 'short',
      });
      const parts = formatter.formatToParts(new Date());
      const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || '';
      return timeZoneName || timezone.split('/').pop()?.replace('_', ' ') || 'UTC';
    } catch {
      return 'UTC';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return "It's Morning";
    if (hour >= 12 && hour < 17) return "It's Afternoon";
    if (hour >= 17 && hour < 21) return "It's Evening";
    return "It's Night";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Card with Time-based Gradient */}
      <div className="space-y-4">
        <Card className="overflow-hidden border-0 backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className={`text-3xl md:text-4xl font-bold ${textColor} mb-8`}>
                  {getGreeting()}!
                </h1>
                <p className={`text-sm font-bold ${textColor} opacity-90`}>
                  Hi, {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.username || user?.email?.split('@')[0] || "there"},!
                </p>
                <p className={`text-sm ${textColor} opacity-80 mt-2`}>
                  Here's what's happening with your hotel today.
                </p>
              </div>
              <div className="flex flex-col items-end md:items-start md:ml-auto">
                <div className={`text-4xl md:text-5xl font-bold ${textColor} mb-2 font-mono tabular-nums`}>
                  {formatTime(currentTime)}
                  <sup className="text-lg md:text-xl font-normal ml-1 opacity-75">
                    {getTimezone()}
                  </sup>
                </div>
                <div className={`text-sm font-medium ${textColor} opacity-90 mt-2`}>
                  {formatDate(currentTime)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rooms Tally Card */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Bed className="h-5 w-5 text-orange-600" />
              Room Status Overview
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Current room availability and status counts</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg relative">
              <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-green-600"></div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {roomStatusCounts.available}
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Available</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg relative">
              <div className="absolute top-2 left-2 w-3 h-3 rounded-full" style={{ backgroundColor: '#F9AC67' }}></div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {roomStatusCounts.occupied}
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Booked</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg relative">
              <div className="absolute top-2 left-2 w-3 h-3 rounded-full" style={{ backgroundColor: '#ECE6CD' }}></div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {roomStatusCounts.cleaning}
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Cleaning</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg relative">
              <div className="absolute top-2 left-2 w-3 h-3 rounded-full" style={{ backgroundColor: '#EE6A59' }}></div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {roomStatusCounts.maintenance}
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Maintenance</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg relative">
              <div className="absolute top-2 left-2 w-3 h-3 rounded-full" style={{ backgroundColor: '#3A3F58' }}></div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {roomStatusCounts.unavailable}
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Unavailable</div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification and Task Count Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-lg transition-all backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3A3F58' }}>
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Notifications</p>
                  <p className="text-2xl font-bold text-foreground">{notificationCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">New notifications</p>
                </div>
              </div>
              {notificationCount > 0 && (
                <Badge className="bg-orange-500 text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {(user?.isStaff || user?.isSuperuser) && (
          <Card className="rounded-lg transition-all backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3A3F58' }}>
                    <ListChecks className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tasks</p>
                    <p className="text-2xl font-bold text-foreground">{taskCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Assigned tasks</p>
                  </div>
                </div>
                {taskCount > 0 && (
                  <Badge className="bg-orange-500 text-white">
                    {taskCount > 9 ? "9+" : taskCount}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card 
              key={index}
              className="border-0  transition-all backdrop-blur-md bg-white/80 dark:bg-gray-900/80"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </CardTitle>
                <div className="p-2 rounded-lg" style={{ backgroundColor: card.iconBgColor }}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monthly Earnings Chart */}
      <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-orange-600" />
                Monthly Earnings
              </CardTitle>
              <CardDescription>Revenue trends over the last 12 months</CardDescription>
            </div>
            <Link
              href="/admin/dashboard/reports"
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              View Reports →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {monthlyEarnings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No earnings data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsAreaChart data={monthlyEarnings}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F9AC67" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#F9AC67" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="formattedMonth"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `UGX ${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value: number | undefined) => [`UGX ${(value || 0).toLocaleString()}`, "Earnings"]}
                  labelStyle={{ color: "#000" }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#F9AC67"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEarnings)"
                  name="Earnings (UGX)"
                />
              </RechartsAreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <a
                href="/admin/dashboard/rooms"
                className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950 transition"
              >
                <Bed className="h-6 w-6 text-orange-600 mb-2" />
                <span className="text-sm font-medium">Add Room</span>
              </a>
              <a
                href="/admin/dashboard/bookings"
                className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950 transition"
              >
                <Calendar className="h-6 w-6 text-orange-600 mb-2" />
                <span className="text-sm font-medium">View Bookings</span>
              </a>
              <a
                href="/admin/dashboard/payments"
                className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950 transition"
              >
                <DollarSign className="h-6 w-6 text-orange-600 mb-2" />
                <span className="text-sm font-medium">Payments</span>
              </a>
              <a
                href="/admin/dashboard/gallery"
                className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950 transition"
              >
                <TrendingUp className="h-6 w-6 text-orange-600 mb-2" />
                <span className="text-sm font-medium">Gallery</span>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
          <CardHeader>
            <CardTitle>Booking Status</CardTitle>
            <CardDescription>Current booking overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-600 dark:bg-green-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                  <span className="font-medium text-white">Confirmed</span>
                </div>
                <span className="text-2xl font-bold text-white">{stats.confirmedBookings}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#F9AC67' }}>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-white" />
                  <span className="font-medium text-white">Pending</span>
                </div>
                <span className="text-2xl font-bold text-white">{stats.pendingBookings}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#3A3F58' }}>
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-white" />
                  <span className="font-medium text-white">Total</span>
                </div>
                <span className="text-2xl font-bold text-white">{stats.totalBookings}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Logged In Users */}
        <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5 text-orange-600" />
                  Logged In Users
                </CardTitle>
                <CardDescription>Currently active users</CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {loggedInUsers.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loggedInUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users currently logged in
              </div>
            ) : (
              <div className="space-y-3">
                {loggedInUsers.slice(0, 5).map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm transition"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative">
                        {user.profilePicture && user.profilePicture !== "default.jpg" ? (
                          <img
                            src={user.profilePicture}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold uppercase">
                            {(user.firstName?.[0] || user.username?.[0] || user.email?.[0] || "U").toUpperCase()}
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground truncate">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.username || user.email}
                        </div>
                        <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                        {user.lastLogin && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant="outline"
                        className={
                          user.userType === "admin" || user.isSuperuser
                            ? "border-purple-500 text-purple-700 dark:text-purple-400"
                            : user.userType === "staff" || user.isStaff
                            ? "border-blue-500 text-blue-700 dark:text-blue-400"
                            : "border-gray-500 text-gray-700 dark:text-gray-400"
                        }
                      >
                        {user.userType === "admin" || user.isSuperuser
                          ? "Admin"
                          : user.userType === "staff" || user.isStaff
                          ? "Staff"
                          : "Guest"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {loggedInUsers.length > 5 && (
                  <Link
                    href="/admin/dashboard/users"
                    className="block text-center text-sm text-orange-600 hover:text-orange-700 font-medium pt-2"
                  >
                    View all {loggedInUsers.length} logged in users →
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Added Users */}
        <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-orange-600" />
                  Recently Added Users
                </CardTitle>
                <CardDescription>New user registrations</CardDescription>
              </div>
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                {recentUsers.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent users
              </div>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm transition"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div>
                        {user.profilePicture && user.profilePicture !== "default.jpg" ? (
                          <img
                            src={user.profilePicture}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold uppercase">
                            {(user.firstName?.[0] || user.username?.[0] || user.email?.[0] || "U").toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground truncate">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.username || user.email}
                        </div>
                        <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                        {user.dateJoined && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Joined {formatDistanceToNow(new Date(user.dateJoined), { addSuffix: true })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant="outline"
                        className={
                          user.userType === "admin" || user.isSuperuser
                            ? "border-purple-500 text-purple-700 dark:text-purple-400"
                            : user.userType === "staff" || user.isStaff
                            ? "border-blue-500 text-blue-700 dark:text-blue-400"
                            : "border-gray-500 text-gray-700 dark:text-gray-400"
                        }
                      >
                        {user.userType === "admin" || user.isSuperuser
                          ? "Admin"
                          : user.userType === "staff" || user.isStaff
                          ? "Staff"
                          : "Guest"}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Link
                  href="/admin/dashboard/users"
                  className="block text-center text-sm text-orange-600 hover:text-orange-700 font-medium pt-2"
                >
                  View all users →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Activity Analytics */}
      <div className="mt-8">
        <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <CardTitle>User Activity Analytics</CardTitle>
            </div>
            <CardDescription>
              Dashboard activity count by user - showing the most active users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userActivityStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activity data available yet.
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                {/* Pie Chart */}
                <div className="w-full md:w-1/2 h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={userActivityStats.map((stat) => ({
                          name: stat.userName || stat.username || stat.email,
                          value: stat.activityCount,
                          userId: stat.userId,
                          profilePicture: stat.profilePicture,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {userActivityStats.map((stat, index) => {
                          const colors = ['#F9AC67', '#EE6A59', '#3A3F58', '#ECE6CD', '#10b981'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  {data.profilePicture && data.profilePicture !== "default.jpg" ? (
                                    <img
                                      src={data.profilePicture}
                                      alt={data.name}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-semibold uppercase">
                                      {(data.name?.[0] || "U").toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-semibold text-foreground">{data.name}</p>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Activities: <span className="font-semibold text-orange-600 dark:text-orange-400">{data.value}</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                {/* User List */}
                <div className="w-full md:w-1/2 space-y-3">
                  {userActivityStats.map((stat, index) => {
                    const colors = ['#F9AC67', '#EE6A59', '#3A3F58', '#ECE6CD', '#10b981'];
                    const total = userActivityStats.reduce((sum, s) => sum + s.activityCount, 0);
                    const percentage = ((stat.activityCount / total) * 100).toFixed(1);
                    return (
                      <div key={stat.userId} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }}></div>
                        <div className="flex items-center gap-2 flex-1">
                          {stat.profilePicture && stat.profilePicture !== "default.jpg" ? (
                            <img
                              src={stat.profilePicture}
                              alt={stat.userName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-semibold uppercase">
                              {(stat.userName?.[0] || stat.username?.[0] || "U").toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{stat.userName || stat.username || stat.email}</p>
                            <p className="text-xs text-muted-foreground">{stat.activityCount} activities ({percentage}%)</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

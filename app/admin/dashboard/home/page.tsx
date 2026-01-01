"use client";

import { useEffect, useState } from "react";
import { getAllRooms } from "@/lib/actions/bookings";
import { getAllBookings } from "@/lib/actions/bookings";
import { getAllPayments } from "@/lib/actions/payments";
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
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
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

      const availableRooms = rooms.filter((r: any) => r.status === "available").length;
      const pendingBookings = bookings.filter((b: any) => b.status === "pending").length;
      const confirmedBookings = bookings.filter((b: any) => b.status === "confirmed").length;
      
      const totalRevenue = payments
        .filter((p: any) => p.status === "COMPLETED")
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

      const currentMonth = new Date().getMonth();
      const monthlyRevenue = payments
        .filter((p: any) => {
          if (p.status !== "COMPLETED") return false;
          const paymentDate = new Date(p.createdAt || p.created_at);
          return paymentDate.getMonth() === currentMonth;
        })
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

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
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      borderColor: "border-orange-200 dark:border-orange-800",
    },
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      description: `${stats.confirmedBookings} confirmed`,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      borderColor: "border-orange-200 dark:border-orange-800",
    },
    {
      title: "Pending Bookings",
      value: stats.pendingBookings,
      description: "Requires attention",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      borderColor: "border-orange-200 dark:border-orange-800",
    },
    {
      title: "Total Revenue",
      value: `UGX ${stats.totalRevenue.toLocaleString()}`,
      description: `UGX ${stats.monthlyRevenue.toLocaleString()} this month`,
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      borderColor: "border-orange-200 dark:border-orange-800",
    },
    {
      title: "Subscriptions",
      value: stats.totalSubscriptions,
      description: "Newsletter subscribers",
      icon: Mailbox,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      borderColor: "border-orange-200 dark:border-orange-800",
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
                <p className={`text-xl md:text-2xl ${textColor} opacity-90 font-medium`}>
                  Hi, {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.username || user?.email?.split('@')[0] || "there"},!
                </p>
                <p className={`text-lg ${textColor} opacity-80 mt-2`}>
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date Card with Cutout Effect */}
        <div className="relative">
          <div className="relative border-0 backdrop-blur-md bg-white/90 dark:bg-gray-900/90 rounded-lg overflow-visible">
            <div className="p-4 relative">
              {/* Card background with circular cutout using clip-path */}
              <div 
                className="absolute inset-0 backdrop-blur-md bg-white/90 dark:bg-gray-900/90 rounded-lg"
                style={{
                  clipPath: 'polygon(0% 0%, 0% 100%, 20% 100%, 20% 45%, 80% 45%, 80% 100%, 100% 100%, 100% 0%)',
                }}
              />
              {/* Date text in the center cutout - shows page gradient behind */}
              <div className="relative z-20 flex items-center justify-center py-3 min-h-[2.5rem]">
                <span className={`text-sm font-medium ${textColor} opacity-90`}>
                  {formatDate(currentTime)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification and Task Count Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 rounded-lg  transition-all backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-orange-600 dark:text-orange-400" />
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
          <Card className="border-0 rounded-lg  transition-all backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    <ListChecks className="h-6 w-6 text-orange-600 dark:text-orange-400" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
                <div className={`${card.bgColor} ${card.color} p-2 rounded-lg`}>
                  <Icon className="h-5 w-5" />
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
      <Card className="border-0  backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
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
              <RechartsLineChart data={monthlyEarnings}>
                <CartesianGrid strokeDasharray="3 3" />
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
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="rgb(249 115 22)"
                  strokeWidth={3}
                  dot={{ fill: "rgb(249 115 22)", r: 4 }}
                  name="Earnings (UGX)"
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0  backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
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

        <Card className="border-0  backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
          <CardHeader>
            <CardTitle>Booking Status</CardTitle>
            <CardDescription>Current booking overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Confirmed</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{stats.confirmedBookings}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span className="font-medium">Pending</span>
                </div>
                <span className="text-2xl font-bold text-orange-600">{stats.pendingBookings}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Total</span>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBookings}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logged In Users */}
        <Card className="border-0  backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
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
        <Card className="border-0  backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
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
        <Card className="border-0  backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
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
              <div className="flex gap-6">
                {/* Bar Chart */}
                <div className="flex-1 h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={userActivityStats.map((stat, index) => ({
                        userId: stat.userId,
                        name: stat.userName,
                        activities: stat.activityCount,
                        profilePicture: stat.profilePicture,
                        username: stat.username,
                        email: stat.email,
                        index: index,
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
                      <XAxis
                        dataKey="index"
                        tick={false}
                        axisLine={false}
                        label={{ value: "Users", position: "insideBottom", offset: -10 }}
                      />
                      <YAxis
                        tick={{ fill: "currentColor" }}
                        label={{ value: "Activity Count", angle: -90, position: "insideLeft" }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg  p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  {data.profilePicture && data.profilePicture !== "default.jpg" ? (
                                    <img
                                      src={data.profilePicture}
                                      alt={data.name}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-semibold uppercase">
                                      {(data.name?.[0] || data.username?.[0] || "U").toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-semibold text-foreground">{data.name}</p>
                                    <p className="text-xs text-muted-foreground">{data.username || data.email}</p>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Activities: <span className="font-semibold text-orange-600 dark:text-orange-400">{payload[0].value}</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="activities"
                        fill="#f97316"
                        radius={[8, 8, 0, 0]}
                        className="hover:opacity-80 transition-opacity"
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                  {/* Avatar labels below X-axis */}
                  <div className="flex justify-around -mt-12 px-4 relative z-10">
                    {userActivityStats.map((stat, index) => (
                      <div
                        key={stat.userId}
                        className="flex flex-col items-center gap-1"
                        style={{ width: `${100 / userActivityStats.length}%` }}
                      >
                        {stat.profilePicture && stat.profilePicture !== "default.jpg" ? (
                          <img
                            src={stat.profilePicture}
                            alt={stat.userName}
                            className="w-8 h-8 rounded-full object-cover border-2 border-orange-500"
                            title={stat.userName}
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-semibold border-2 border-orange-600 uppercase"
                            title={stat.userName}
                          >
                            {(stat.userName?.[0] || stat.username?.[0] || stat.email?.[0] || "U").toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* User List */}
                <div className="w-64 border-l border-white/20 dark:border-white/10 pl-6">
                  <h3 className="font-semibold text-sm text-foreground mb-4">User Activity List</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {userActivityStats.map((stat) => (
                      <div
                        key={stat.userId}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                      >
                        <div className="flex-shrink-0">
                          {stat.profilePicture && stat.profilePicture !== "default.jpg" ? (
                            <img
                              src={stat.profilePicture}
                              alt={stat.userName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold text-sm uppercase">
                              {(stat.userName?.[0] || stat.username?.[0] || stat.email?.[0] || "U").toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {stat.userName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {stat.email}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            {stat.activityCount}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

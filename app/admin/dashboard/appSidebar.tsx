/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { BarChart, Calendar, CalendarArrowDown, ChartBar, ChartBarIcon, CheckCheck, Delete, File, FileArchive, FileArchiveIcon, FileEdit, GraduationCap, Home, ImageIcon, Info, LineChart, List, ListChecks, LucideFileImage, Mail, MailCheck, Mic, Paperclip, PenToolIcon, Pill, Play, Plus, Receipt, Settings, Settings2, ShoppingBasket, Star, Store, StoreIcon, Sun, Tag, Ticket, TicketCheck, TruckIcon, User, UserCheck2, UserCheck2Icon, Users, Video, Videotape, View, Wallet, Newspaper, Activity, Mailbox, FileText, Bell, ShoppingCart, Utensils, GlassWater, Shield } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import Logout from "../auth/logout"
import Logged from "../auth/user"
import Logo from '@/public/images/logo.png'
import Image from "next/image"
import { NavMain } from "./navMain"

// This is sample data.
export const navigationData = {
  navMain: [
    {
      title: "Home",
      url: "/admin/dashboard/home",
      icon: Home,
      isActive: true,
      items: [
        {
          title: "Overview",
          icon: LineChart,
          url: "/admin/dashboard/home",
        },
      ],
    },
    {
      title: "Rooms",
      url: "#",
      icon: File,
      isActive: false,
      items: [
        {
          title: "Add Room",
          icon: Plus,
          url: "/admin/dashboard/rooms",
        },        
        {
          title: "View Rooms",
          icon: View,
          url: "/admin/dashboard/rooms/view",
        },
        {
          title: "Room Allocations",
          icon: Activity,
          url: "/admin/dashboard/rooms/allocations",
        },
        {
          title: "Room Types",
          icon: Tag,
          url: "/admin/dashboard/rooms/types",
        },
        {
          title: "Services",
          icon: ShoppingBasket,
          url: "/admin/dashboard/rooms/services",
        },
      ],
    },
    {
      title: "Bookings",
      url: "#",
      icon: Calendar,
      isActive: false,
      items: [
        {
          title: "Add Booking",
          icon: Plus,
          url: "/admin/dashboard/bookings/add",
        },
        {
          title: "All Bookings",
          icon: List,
          url: "/admin/dashboard/bookings",
        },
        {
          title: "Pending",
          icon: CalendarArrowDown,
          url: "/admin/dashboard/bookings?status=pending",
        },
        {
          title: "Confirmed",
          icon: CheckCheck,
          url: "/admin/dashboard/bookings?status=confirmed",
        },
      ],
    },
    {
      title: "Payments",
      url: "#",
      icon: Wallet,
      isActive: false,
      items: [
        {
          title: "All Payments",
          icon: Receipt,
          url: "/admin/dashboard/payments",
        },
        {
          title: "Transactions",
          icon: TicketCheck,
          url: "/admin/dashboard/payments/transactions",
        },
      ],
    },
    {
      title: "Reviews",
      url: "/admin/dashboard/reviews",
      icon: Star,
      isActive: false,
      items: [],
    },
    {
      title: "Messages",
      url: "/admin/dashboard/messages",
      icon: Mail,
      isActive: false,
      items: [],
    },
    {
      title: "Gallery",
      url: "/admin/dashboard/gallery",
      icon: ImageIcon,
      isActive: false,
      items: [],
    },
    {
      title: "Point of Sale",
      url: "#",
      icon: ShoppingCart,
      isActive: false,
      items: [
        {
          title: "POS Terminal",
          icon: Store,
          url: "/admin/dashboard/pos",
        },
        {
          title: "Menu Categories",
          icon: Tag,
          url: "/admin/dashboard/pos/menu-categories",
        },
        {
          title: "Menu Items",
          icon: Utensils,
          url: "/admin/dashboard/pos/menu-items",
        },
        {
          title: "Drink Categories",
          icon: Tag,
          url: "/admin/dashboard/pos/drink-categories",
        },
        {
          title: "Drinks",
          icon: GlassWater,
          url: "/admin/dashboard/pos/drinks",
        },
        {
          title: "Receipts",
          icon: Receipt,
          url: "/admin/dashboard/pos/receipts",
        },
      ],
    },
    {
      title: "Staff",
      url: "#",
      icon: Users,
      isActive: false,
      items: [
        {
          title: "All Staff",
          icon: UserCheck2,
          url: "/admin/dashboard/staff",
        },
        {
          title: "Roles",
          icon: GraduationCap,
          url: "/admin/dashboard/staff/roles",
        },
        {
          title: "Permissions Setup",
          icon: Shield,
          url: "/admin/dashboard/permissions/setup",
          adminOnly: true,
        },
        {
          title: "Tasks",
          icon: ListChecks,
          url: "/admin/dashboard/staff/tasks",
        },
      ],
    },
    {
      title: "Users",
      url: "/admin/dashboard/users",
      icon: UserCheck2,
      isActive: false,
      items: [],
      adminOnly: true,
    },
    {
      title: "Newsletter",
      url: "/admin/dashboard/newsletter",
      icon: Newspaper,
      isActive: false,
      items: [],
    },
    {
      title: "Subscriptions",
      url: "/admin/dashboard/subscriptions",
      icon: Mailbox,
      isActive: false,
      items: [],
    },
    {
      title: "Notifications",
      url: "/admin/dashboard/notifications",
      icon: Bell,
      isActive: false,
      items: [],
    },
    {
      title: "Tickets",
      url: "/admin/dashboard/tickets",
      icon: Ticket,
      isActive: false,
      items: [],
    },
    {
      title: "Reports",
      url: "/admin/dashboard/reports",
      icon: FileText,
      isActive: false,
      items: [],
      adminOnly: true,
    },
    {
      title: "Activity Log",
      url: "/admin/dashboard/activity-log",
      icon: Activity,
      isActive: false,
      items: [],
      adminOnly: true,
    },
    {
      title: "Profile",
      url: "/admin/dashboard/profile",
      icon: Settings,
      isActive: false,
      items: [],
    },
  ],
};

export function AppSidebar() {
  return (
    <Sidebar className="bg-white [&>div]:bg-white [&_[data-sidebar=sidebar]]:bg-white">
      <SidebarHeader>
        <div className="p-3 flex justify-between items-center gap-4 mx-4">
          <Image src={Logo} alt="logo" className="w-15 h-10"/>
          <div className="text-xl font-black flex-1 text-right tracking-tight leading-tight">SYKE WORLD<br/>HOTEL</div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <NavMain items={navigationData.navMain} />
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-2">
        <Logged/>
        <Logout/>
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2">
          &copy; {new Date().getFullYear()} Syke World Hotel
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
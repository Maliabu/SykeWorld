/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react"
import { useSession } from "@/lib/hooks/useSession"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    adminOnly?: boolean
    items?: {
      title: string
      icon: LucideIcon
      url: string
      adminOnly?: boolean
    }[]
  }[]
}) {
  const { user } = useSession()
  const isAdmin = user?.isSuperuser || user?.userType === "admin"

  // Filter items based on permissions
  const filteredItems = items.filter(item => {
    // Hide Users section if not admin
    if (item.adminOnly && !isAdmin) {
      return false;
    }
    // Filter sub-items
    if (item.items) {
      item.items = item.items.filter(subItem => {
        if (subItem.adminOnly && !isAdmin) {
          return false;
        }
        return true;
      });
    }
    return true;
  });
  
  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>Dashboard</SidebarGroupLabel> */}
      <SidebarMenu>
        {filteredItems.map((item) => {
          // If item has no sub-items and has a direct URL, render as link
          if (!item.items || item.items.length === 0) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  tooltip={item.title}
                  className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <a href={item.url} className="flex items-center gap-3">
                    {item.icon && <item.icon className="h-5 w-5" />}
                    <span className="font-medium text-sm">{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // If item has sub-items, render as collapsible
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className={item.isActive == true?"group/collapsible":"group/collapsible"}
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {item.icon && <item.icon className="h-5 w-5" />}
                    <span className="font-medium text-sm">{item.title}</span>
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton 
                          asChild
                          className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <a href={subItem.url} className="flex items-center gap-3">
                            {<subItem.icon className="h-4 w-4"/>}
                            <span className="text-sm">{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
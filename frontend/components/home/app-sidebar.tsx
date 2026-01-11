"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Search,
  Library,
  FolderPlus,
  Plus,
  FileText,
  Grid3X3,
  Smartphone,
  Settings2,
} from "lucide-react";

export function AppSidebar() {
  return (
    <Sidebar className="border-r-0" collapsible="icon">
      <SidebarHeader className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-foreground group-data-[collapsible=icon]:hidden">
            toto
          </span>
          <SidebarTrigger className="h-10 w-10" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="bg-sidebar-accent h-12 text-base"
                tooltip="新建任务"
              >
                <Plus className="h-5 w-5" />
                <span>新建任务</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton className="h-12 text-base" tooltip="搜索">
                <Search className="h-5 w-5" />
                <span>搜索</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton className="h-12 text-base" tooltip="库">
                <Library className="h-5 w-5" />
                <span>库</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between group-data-[collapsible=icon]:hidden text-base h-10">
            <span>项目</span>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="h-4 w-4" />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="h-12 text-base" tooltip="新项目">
                  <FolderPlus className="h-5 w-5" />
                  <span>新项目</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between group-data-[collapsible=icon]:hidden text-base h-10">
            <span>所有任务</span>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Settings2 className="h-4 w-4" />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex flex-col items-center justify-center py-12 text-center group-data-[collapsible=icon]:hidden">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30">
                <FileText className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-base text-muted-foreground">
                新建一个任务以开始
              </p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6">
        <div className="flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[state=expanded]:flex-row group-data-[state=expanded]:justify-between">
          <div className="flex gap-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[state=expanded]:flex-row">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              title="设置"
            >
              <Settings2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              title="网格视图"
            >
              <Grid3X3 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              title="移动端"
            >
              <Smartphone className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

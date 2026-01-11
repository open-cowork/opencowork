"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/home/app-sidebar";
import { MainContent } from "@/components/home/main-content";

export default function HomePage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <MainContent />
      </SidebarInset>
    </SidebarProvider>
  );
}

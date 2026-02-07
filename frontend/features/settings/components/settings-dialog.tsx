"use client";

import { useTheme } from "next-themes";
import { useUserAccount } from "@/features/user/hooks/use-user-account";
import { useRouter } from "next/navigation";
import { useAppShell } from "@/components/shared/app-shell-context";

import * as React from "react";
import {
  User,
  Settings,
  Activity,
  Calendar,
  Plug,
  ExternalLink,
  HelpCircle,
  UserCog,
  Sparkles,
  RefreshCw,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { ScheduledTasksHeader } from "@/features/scheduled-tasks/components/scheduled-tasks-header";
import { ScheduledTasksTable } from "@/features/scheduled-tasks/components/scheduled-tasks-table";
import { CreateScheduledTaskDialog } from "@/features/scheduled-tasks/components/create-scheduled-task-dialog";
import { ScheduledTaskEditDialog } from "@/features/scheduled-tasks/components/scheduled-task-edit-dialog";
import { useScheduledTasksStore } from "@/features/scheduled-tasks/hooks/use-scheduled-tasks-store";
import type { ScheduledTask } from "@/features/scheduled-tasks/types";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SIDEBAR_ITEMS = [
  { icon: User, label: "Account", id: "account" },
  { icon: Settings, label: "Settings", id: "settings" },
  { icon: Activity, label: "Usage", id: "usage" },
  { icon: Calendar, label: "Scheduled Tasks", id: "scheduled" },
  { icon: Plug, label: "Connectors", id: "connectors" },
];

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = React.useState("account");
  const { profile, credits, isLoading } = useUserAccount();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const router = useRouter();
  const { lng } = useAppShell();

  // Scheduled tasks state
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false);
  const [editTaskOpen, setEditTaskOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<ScheduledTask | null>(
    null,
  );
  const scheduledTasksStore = useScheduledTasksStore();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "account":
        return (
          <div className="flex-1 overflow-y-auto p-5">
            {/* User Profile Card */}
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="size-14 bg-primary">
                <AvatarFallback className="text-xl text-primary-foreground bg-primary">
                  {profile?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                  </div>
                ) : (
                  <>
                    <div className="text-base font-medium truncate">
                      {profile?.email}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {profile?.id}
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="size-8">
                  <UserCog className="size-4" />
                </Button>
                <Button variant="outline" size="icon" className="size-8">
                  <ExternalLink className="size-4" />
                </Button>
              </div>
            </div>

            {/* Plan Card */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-border border-dashed">
                <span className="font-medium">
                  {profile?.planName}
                </span>
                <Button
                  size="sm"
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-7 px-4 text-xs font-bold"
                >
                  Upgrade
                </Button>
              </div>
              <div className="p-4 space-y-5">
                {/* Credits */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Sparkles className="size-4" />
                      <span className="text-sm font-medium">Credits</span>
                      <HelpCircle className="size-3.5 opacity-50" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">
                      {credits?.total}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground/60 pl-6">
                    <span>Free Credits</span>
                    <span>{credits?.free}</span>
                  </div>
                </div>

                {/* Daily Refresh */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <RefreshCw className="size-4" />
                      <span className="text-sm font-medium">
                        Daily Refresh Credits
                      </span>
                      <HelpCircle className="size-3.5 opacity-50" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">
                      {credits?.dailyRefreshCurrent}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground/60 pl-6">
                    Refreshes to {credits?.dailyRefreshMax} every day at{" "}
                    {credits?.refreshTime}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">General Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Moon className="size-4 text-muted-foreground" />
                  <span className="text-sm">Dark Mode</span>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? "dark" : "light")
                  }
                  disabled={!mounted}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <span className="text-sm">Language</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Simplified Chinese
                </span>
              </div>
            </div>
          </div>
        );
      case "usage":
        return (
          <div className="p-6">
            <div className="text-center text-muted-foreground py-10">
              No usage data yet
            </div>
          </div>
        );
      case "scheduled":
        return (
          <div className="flex flex-1 flex-col overflow-hidden min-h-0">
            <div className="px-6 pt-4 pb-2 shrink-0">
              <ScheduledTasksHeader
                onAddClick={() => setCreateTaskOpen(true)}
              />
            </div>
            <PullToRefresh
              onRefresh={scheduledTasksStore.refresh}
              isLoading={scheduledTasksStore.isLoading}
            >
              <div className="flex flex-1 flex-col px-6 py-6 overflow-auto min-h-0">
                <div className="w-full max-w-6xl mx-auto">
                  <ScheduledTasksTable
                    tasks={scheduledTasksStore.tasks}
                    savingId={scheduledTasksStore.savingId}
                    onToggleEnabled={async (task) => {
                      await scheduledTasksStore.updateTask(
                        task.scheduled_task_id,
                        {
                          enabled: !task.enabled,
                        },
                      );
                    }}
                    onOpen={(task) => {
                      router.push(
                        `/${lng}/capabilities/scheduled-tasks/${task.scheduled_task_id}`,
                      );
                    }}
                    onEdit={(task) => {
                      setEditingTask(task);
                      setEditTaskOpen(true);
                    }}
                    onTrigger={async (task) => {
                      const resp = await scheduledTasksStore.triggerTask(
                        task.scheduled_task_id,
                      );
                      if (resp?.session_id) {
                        router.push(`/${lng}/chat/${resp.session_id}`);
                      }
                    }}
                    onDelete={async (task) => {
                      await scheduledTasksStore.removeTask(
                        task.scheduled_task_id,
                      );
                    }}
                  />
                </div>
              </div>
            </PullToRefresh>
            <CreateScheduledTaskDialog
              open={createTaskOpen}
              onOpenChange={setCreateTaskOpen}
              onCreate={async (input) => {
                const created = await scheduledTasksStore.createTask(input);
                if (created) {
                  router.push(
                    `/${lng}/capabilities/scheduled-tasks/${created.scheduled_task_id}`,
                  );
                }
              }}
              isSaving={scheduledTasksStore.savingId === "create"}
            />
            <ScheduledTaskEditDialog
              open={editTaskOpen}
              onOpenChange={setEditTaskOpen}
              task={editingTask}
              isSaving={
                !!editingTask &&
                scheduledTasksStore.savingId === editingTask.scheduled_task_id
              }
              onSave={async (payload) => {
                if (!editingTask) return;
                await scheduledTasksStore.updateTask(
                  editingTask.scheduled_task_id,
                  payload,
                );
                await scheduledTasksStore.refresh();
              }}
            />
          </div>
        );
      case "connectors":
        return (
          <div className="p-6">
            <div className="text-center text-muted-foreground py-10">
              Connected services will appear here
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-[1000px] w-[90vw] p-0 gap-0 overflow-hidden !h-[75vh] min-h-[500px] max-h-[800px] bg-background text-foreground flex flex-col"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="flex flex-1 min-h-0">
          {/* Left Sidebar */}
          <div className="w-64 bg-muted/30 border-r border-border flex flex-col shrink-0">
            <div className="p-4 flex items-center gap-2 font-semibold text-lg">
              <Sparkles className="size-5 text-foreground" />
              <span>Poco</span>
            </div>
            <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 min-h-0">
              {SIDEBAR_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    activeTab === item.id
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-border shrink-0">
              <button
                onClick={() => window.open("https://open-cowork.com", "_blank")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <HelpCircle className="size-4" />
                <span>Get Help</span>
                <ExternalLink className="size-3 ml-auto" />
              </button>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 bg-background flex flex-col min-w-0 min-h-0">
            {activeTab !== "scheduled" && (
              <div className="flex items-center justify-between p-5 pb-2 shrink-0">
                <h2 className="text-xl font-semibold">
                  {SIDEBAR_ITEMS.find((i) => i.id === activeTab)?.label}
                </h2>
              </div>
            )}
            {renderContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

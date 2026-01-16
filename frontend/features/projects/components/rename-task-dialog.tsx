"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RenameTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskName: string;
  onRename: (newName: string) => void;
}

/**
 * Dialog for renaming a task
 */
export function RenameTaskDialog({
  open,
  onOpenChange,
  taskName,
  onRename,
}: RenameTaskDialogProps) {
  const { t } = useT("translation");
  const [name, setName] = React.useState(taskName);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Update input value when taskName changes
  React.useEffect(() => {
    setName(taskName);
  }, [taskName]);

  // Focus and select input when dialog opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name.trim() !== taskName) {
      onRename(name.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("sidebar.rename")}</DialogTitle>
            <DialogDescription>输入新的任务名称</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="task-name">任务名称</Label>
              <Input
                ref={inputRef}
                id="task-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入任务名称"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    onOpenChange(false);
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || name.trim() === taskName}
            >
              确定
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

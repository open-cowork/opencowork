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

interface RenameProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onRename: (newName: string) => void;
}

export function RenameProjectDialog({
  open,
  onOpenChange,
  projectName,
  onRename,
}: RenameProjectDialogProps) {
  const { t } = useT("translation");
  const [name, setName] = React.useState(projectName);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setName(projectName);
  }, [projectName]);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === projectName) return;
    onRename(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("project.rename")}</DialogTitle>
            <DialogDescription>
              {t("project.renameDescription", "Please enter a new project name")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">
                {t("project.nameLabel", "Project Name")}
              </Label>
              <Input
                ref={inputRef}
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("project.namePlaceholder", "Enter project name")}
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
              {t("common.cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {t("common.save", "Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

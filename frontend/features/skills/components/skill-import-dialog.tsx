"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCheck, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/client";
import { skillsService } from "@/features/skills/services/skills-service";
import type {
  SkillImportCandidate,
  SkillImportCommitResponse,
} from "@/features/skills/types";

type SourceTab = "zip" | "github";

interface CandidateSelectionState {
  selected: boolean;
  nameOverride: string;
}

const CANDIDATES_PAGE_SIZE = 5;

export interface SkillImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImported?: () => void | Promise<void>;
}

export function SkillImportDialog({
  open,
  onClose,
  onImported,
}: SkillImportDialogProps) {
  const { t } = useT("translation");
  const [tab, setTab] = useState<SourceTab>("zip");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [githubUrl, setGithubUrl] = useState("");

  const [archiveKey, setArchiveKey] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<SkillImportCandidate[]>([]);
  const [candidatePage, setCandidatePage] = useState(1);
  const [selections, setSelections] = useState<
    Record<string, CandidateSelectionState>
  >({});

  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitJobId, setCommitJobId] = useState<string | null>(null);
  const [commitProgress, setCommitProgress] = useState<number | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [commitResult, setCommitResult] =
    useState<SkillImportCommitResponse | null>(null);

  const isActiveRef = React.useRef(true);
  React.useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  const reset = React.useCallback(() => {
    setTab("zip");
    setZipFile(null);
    setGithubUrl("");
    setArchiveKey(null);
    setCandidates([]);
    setCandidatePage(1);
    setSelections({});
    setIsDiscovering(false);
    setIsCommitting(false);
    setCommitJobId(null);
    setCommitProgress(null);
    setCommitError(null);
    setCommitResult(null);
  }, []);

  const handleClose = React.useCallback(() => {
    onClose();
    // Reset state after close so the dialog animation is not affected.
    setTimeout(reset, 0);
  }, [onClose, reset]);

  const selectedCandidates = useMemo(() => {
    return candidates.filter((c) => selections[c.relative_path]?.selected);
  }, [candidates, selections]);

  const totalCandidatePages = useMemo(() => {
    return Math.max(1, Math.ceil(candidates.length / CANDIDATES_PAGE_SIZE));
  }, [candidates.length]);

  React.useEffect(() => {
    setCandidatePage((prev) => Math.min(prev, totalCandidatePages));
  }, [totalCandidatePages]);

  const candidatePageClamped = useMemo(() => {
    return Math.min(candidatePage, totalCandidatePages);
  }, [candidatePage, totalCandidatePages]);

  const pagedCandidates = useMemo(() => {
    const start = (candidatePageClamped - 1) * CANDIDATES_PAGE_SIZE;
    return candidates.slice(start, start + CANDIDATES_PAGE_SIZE);
  }, [candidates, candidatePageClamped]);

  const isPageFullySelected = useMemo(() => {
    if (pagedCandidates.length === 0) return false;
    return pagedCandidates.every((c) => selections[c.relative_path]?.selected);
  }, [pagedCandidates, selections]);

  const isAllSelected = useMemo(() => {
    if (candidates.length === 0) return false;
    return candidates.every((c) => selections[c.relative_path]?.selected);
  }, [candidates, selections]);

  const overwriteCount = useMemo(() => {
    return selectedCandidates.filter((c) => c.will_overwrite).length;
  }, [selectedCandidates]);

  const canCommit = useMemo(() => {
    if (!archiveKey) return false;
    if (selectedCandidates.length === 0) return false;
    for (const c of selectedCandidates) {
      if (c.requires_name) {
        const name = selections[c.relative_path]?.nameOverride?.trim() || "";
        if (!name) return false;
      }
    }
    return true;
  }, [archiveKey, selectedCandidates, selections]);

  const onDiscover = async () => {
    setIsDiscovering(true);
    setCommitResult(null);
    setCommitError(null);
    try {
      const formData = new FormData();
      if (tab === "zip") {
        if (!zipFile) {
          toast.error(
            t("library.skillsImport.toasts.missingZip", "Please select a zip file"),
          );
          return;
        }
        formData.append("file", zipFile);
      } else {
        const url = githubUrl.trim();
        if (!url) {
          toast.error(
            t(
              "library.skillsImport.toasts.missingGithubUrl",
              "Please enter a GitHub URL",
            ),
          );
          return;
        }
        formData.append("github_url", url);
      }

      const resp = await skillsService.importDiscover(formData);
      setArchiveKey(resp.archive_key);
      setCandidates(resp.candidates || []);
      setCandidatePage(1);

      const next: Record<string, CandidateSelectionState> = {};
      for (const c of resp.candidates || []) {
        next[c.relative_path] = {
          selected: true,
          nameOverride: "",
        };
      }
      setSelections(next);

      toast.success(
        t(
          "library.skillsImport.toasts.discovered",
          "Parsed successfully. Please confirm the skills to import",
        ),
      );
    } catch (error) {
      console.error("[SkillsImport] discover failed:", error);
      toast.error(
        t("library.skillsImport.toasts.discoverError", "Parsing failed. Please try again later"),
      );
    } finally {
      setIsDiscovering(false);
    }
  };

  const onCommit = async () => {
    if (!archiveKey) return;
    if (!canCommit) return;

    setIsCommitting(true);
    setCommitError(null);
    setCommitResult(null);
    setCommitProgress(0);
    setCommitJobId(null);
    try {
      const payload = {
        archive_key: archiveKey,
        selections: selectedCandidates.map((c) => ({
          relative_path: c.relative_path,
          name_override: c.requires_name
            ? selections[c.relative_path]?.nameOverride?.trim() || null
            : null,
        })),
      };

      const enqueue = await skillsService.importCommit(payload);
      setCommitJobId(enqueue.job_id);

      const startedAt = Date.now();
      let finalError: string | null = null;
      let finalResult: SkillImportCommitResponse | null = null;
      while (true) {
        if (!isActiveRef.current) return;

        const job = await skillsService.getImportJob(enqueue.job_id);
        if (!isActiveRef.current) return;

        setCommitProgress(typeof job.progress === "number" ? job.progress : 0);

        if (job.status === "success") {
          finalResult = job.result;
          setCommitResult(job.result);
          break;
        }

        if (job.status === "failed") {
          finalError = job.error || "";
          finalResult = job.result;
          setCommitError(finalError);
          setCommitResult(job.result);
          break;
        }

        // Safety net: avoid polling forever if something goes wrong.
        if (Date.now() - startedAt > 10 * 60 * 1000) {
          finalError = t(
            "library.skillsImport.toasts.commitTimeout",
            "Import timed out. Please refresh later to see results",
          );
          setCommitError(finalError);
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (!isActiveRef.current) return;

      if (finalError) {
        toast.error(
          finalError ||
            t(
              "library.skillsImport.toasts.commitError",
              "Import failed. Please try again later",
            ),
        );
        return;
      }

      const failed = (finalResult?.items || []).filter(
        (i) => i.status !== "success",
      );
      if (failed.length > 0) {
        toast.error(
          t(
            "library.skillsImport.toasts.partialFailed",
            "Some skills failed to import. See details",
          ),
        );
        return;
      }

      toast.success(t("library.skillsImport.toasts.committed", "Skills imported successfully"));
      await onImported?.();
      handleClose();
    } catch (error) {
      console.error("[SkillsImport] commit failed:", error);
      toast.error(
        t("library.skillsImport.toasts.commitError", "Import failed. Please try again later"),
      );
    } finally {
      setIsCommitting(false);
    }
  };

  const hasPreview = candidates.length > 0 && !!archiveKey;
  const selectionDisabled = isCommitting || isDiscovering;
  const pageSelectionTitle = isPageFullySelected
    ? t("library.skillsImport.preview.selection.clearPage", "Clear selection on this page")
    : t("library.skillsImport.preview.selection.selectPage", "Select all on this page");
  const allSelectionTitle = isAllSelected
    ? t("library.skillsImport.preview.selection.clearAll", "Clear all selections")
    : t("library.skillsImport.preview.selection.selectAll", "Select all");

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-3xl p-0 gap-0 max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b bg-muted/5">
          <DialogTitle className="text-lg font-semibold">
            {t("library.skillsImport.title", "Import Skills")}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 bg-background space-y-6 overflow-y-auto flex-1 min-h-0">
          {!hasPreview && (
            <Tabs value={tab} onValueChange={(v) => setTab(v as SourceTab)}>
              <TabsList>
                <TabsTrigger value="zip">
                  {t("library.skillsImport.tabs.zip", "Upload Zip")}
                </TabsTrigger>
                <TabsTrigger value="github">
                  {t("library.skillsImport.tabs.github", "GitHub URL")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="zip" className="space-y-3">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("library.skillsImport.fields.zip", "Zip File")}
                </Label>
                <Input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                />
                {zipFile && (
                  <div className="text-xs text-muted-foreground">
                    {zipFile.name} ({Math.round(zipFile.size / 1024)} KB)
                  </div>
                )}
              </TabsContent>

              <TabsContent value="github" className="space-y-3">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t(
                    "library.skillsImport.fields.githubUrl",
                    "Public GitHub repository URL",
                  )}
                </Label>
                <Input
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder={t(
                    "library.skillsImport.placeholders.githubUrl",
                    "https://github.com/owner/repo",
                  )}
                />
                <div className="text-xs text-muted-foreground">
                  {t(
                    "library.skillsImport.hints.github",
                    "Defaults to main/master (only github.com public repos supported)",
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          {hasPreview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  {t("library.skillsImport.preview.found", "Found")}{" "}
                  <span className="text-foreground font-medium">
                    {candidates.length}
                  </span>{" "}
                  {t("library.skillsImport.preview.items", "skill definitions")}
                  {overwriteCount > 0 && (
                    <span className="ml-2">
                      · {t("library.skillsImport.preview.overwrite", "Will overwrite")}{" "}
                      <span className="text-foreground font-medium">
                        {overwriteCount}
                      </span>{" "}
                      {t(
                        "library.skillsImport.preview.overwriteItems",
                        "skills with the same name",
                      )}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={selectionDisabled || pagedCandidates.length === 0}
                    onClick={() => {
                      const targetSelected = !isPageFullySelected;
                      setSelections((prev) => {
                        const next = { ...prev };
                        for (const c of pagedCandidates) {
                          const current = next[c.relative_path] || {
                            selected: false,
                            nameOverride: "",
                          };
                          next[c.relative_path] = {
                            ...current,
                            selected: targetSelected,
                          };
                        }
                        return next;
                      });
                    }}
                    title={pageSelectionTitle}
                    aria-label={pageSelectionTitle}
                    className={
                      isPageFullySelected
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    <ListChecks className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={selectionDisabled || candidates.length === 0}
                    onClick={() => {
                      const targetSelected = !isAllSelected;
                      setSelections((prev) => {
                        const next = { ...prev };
                        for (const c of candidates) {
                          const current = next[c.relative_path] || {
                            selected: false,
                            nameOverride: "",
                          };
                          next[c.relative_path] = {
                            ...current,
                            selected: targetSelected,
                          };
                        }
                        return next;
                      });
                    }}
                    title={allSelectionTitle}
                    aria-label={allSelectionTitle}
                    className={
                      isAllSelected
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    <CheckCheck className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {pagedCandidates.map((c) => {
                  const sel = selections[c.relative_path] || {
                    selected: false,
                    nameOverride: "",
                  };
                  const disabled = selectionDisabled;
                  return (
                    <div
                      key={c.relative_path}
                      className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/10 px-4 py-3"
                    >
                      <Checkbox
                        className="self-center"
                        checked={sel.selected}
                        disabled={disabled}
                        onCheckedChange={(checked) => {
                          setSelections((prev) => ({
                            ...prev,
                            [c.relative_path]: {
                              ...sel,
                              selected: Boolean(checked),
                            },
                          }));
                        }}
                      />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">
                            {c.skill_name ||
                              t(
                                "library.skillsImport.preview.unnamed",
                                "Unnamed",
                              )}
                          </span>
                          {c.will_overwrite && (
                            <Badge variant="outline" className="text-xs">
                              {t(
                                "library.skillsImport.preview.willOverwrite",
                                "Will overwrite",
                              )}
                            </Badge>
                          )}
                          {c.relative_path === "." && (
                            <Badge variant="outline" className="text-xs">
                              {t("library.skillsImport.preview.root", "Root")}
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground font-mono">
                          {t("library.skillsImport.preview.path", "Path")}:{" "}
                          {c.relative_path}
                        </div>

                        {c.requires_name && sel.selected && (
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {t(
                                "library.skillsImport.fields.nameOverride",
                                "Skill name",
                              )}
                            </Label>
                            <Input
                              value={sel.nameOverride}
                              disabled={disabled}
                              onChange={(e) => {
                                const v = e.target.value;
                                setSelections((prev) => ({
                                  ...prev,
                                  [c.relative_path]: {
                                    ...sel,
                                    nameOverride: v,
                                  },
                                }));
                              }}
                              placeholder={t(
                                "library.skillsImport.placeholders.name",
                                "e.g., my-skill",
                              )}
                              className="font-mono"
                            />
                            <div className="text-xs text-muted-foreground">
                              {t(
                                "library.skillsImport.hints.nameRequired",
                                "SKILL.md detected at the root; you must enter the skill name manually",
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalCandidatePages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      isCommitting || isDiscovering || candidatePageClamped <= 1
                    }
                    onClick={() =>
                      setCandidatePage((prev) => Math.max(1, prev - 1))
                    }
                  >
                    {t(
                      "library.skillsImport.preview.pagination.prev",
                      "Previous",
                    )}
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    {t(
                      "library.skillsImport.preview.pagination.page",
                      "Page {{page}} / {{pages}}",
                      {
                        page: candidatePageClamped,
                        pages: totalCandidatePages,
                      },
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      isCommitting ||
                      isDiscovering ||
                      candidatePageClamped >= totalCandidatePages
                    }
                    onClick={() =>
                      setCandidatePage((prev) =>
                        Math.min(totalCandidatePages, prev + 1),
                      )
                    }
                  >
                    {t(
                      "library.skillsImport.preview.pagination.next",
                      "Next",
                    )}
                  </Button>
                </div>
              )}

              {commitResult && (
                <div className="rounded-xl border border-border/50 bg-muted/5 px-4 py-3 space-y-2">
                  <div className="text-sm font-medium">
                    {t("library.skillsImport.result.title", "Import Results")}
                  </div>
                  <div className="space-y-1">
                    {(commitResult.items || []).map((it) => (
                      <div
                        key={it.relative_path}
                        className="text-xs text-muted-foreground flex items-center justify-between gap-2"
                      >
                        <span className="font-mono truncate">
                          {it.skill_name || it.relative_path}
                        </span>
                        <span className="shrink-0">
                          {it.status === "success"
                            ? t("library.skillsImport.result.success", "Success")
                            : t("library.skillsImport.result.failed", "Failed")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isCommitting && (
                <div className="rounded-xl border border-border/50 bg-muted/5 px-4 py-3 space-y-2">
                  <div className="text-sm font-medium">
                    {t("library.skillsImport.progress.title", "Importing")}
                  </div>
                  {typeof commitProgress === "number" && (
                    <div className="text-xs text-muted-foreground">
                      {t("library.skillsImport.progress.value", "Progress")}:{" "}
                      {commitProgress}%
                    </div>
                  )}
                  {commitJobId && (
                    <div className="text-xs text-muted-foreground font-mono">
                      {t("library.skillsImport.progress.jobId", "Job")}:{" "}
                      {commitJobId}
                    </div>
                  )}
                </div>
              )}

              {commitError && !isCommitting && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 space-y-1">
                  <div className="text-sm font-medium">
                    {t("library.skillsImport.result.failed", "Import Failed")}
                  </div>
                  <div className="text-xs text-muted-foreground break-words">
                    {commitError}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isCommitting}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          {!hasPreview ? (
            <Button onClick={onDiscover} disabled={isDiscovering}>
              {isDiscovering
                ? t("library.skillsImport.actions.discovering", "Parsing...")
                : t("library.skillsImport.actions.discover", "Parse")}
            </Button>
          ) : (
            <Button onClick={onCommit} disabled={!canCommit || isCommitting}>
              {isCommitting
                ? t("library.skillsImport.actions.committing", "Importing...")
                : t("library.skillsImport.actions.commit", "Import and Install")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

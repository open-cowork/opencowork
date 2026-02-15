"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCheck, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/client";
import { pluginsService } from "@/features/capabilities/plugins/services/plugins-service";
import type {
  PluginImportCandidate,
  PluginImportCommitResponse,
} from "@/features/capabilities/plugins/types";
import { CapabilityDialogContent } from "@/features/capabilities/components/capability-dialog-content";
import { logger } from "@/lib/logger";

type SourceTab = "zip" | "github";

interface CandidateSelectionState {
  selected: boolean;
  nameOverride: string;
}

const CANDIDATES_PAGE_SIZE = 5;

export interface PluginImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImported?: () => void | Promise<void>;
}

export function PluginImportDialog({
  open,
  onClose,
  onImported,
}: PluginImportDialogProps) {
  const { t } = useT("translation");
  const [tab, setTab] = useState<SourceTab>("zip");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [githubUrl, setGithubUrl] = useState("");

  const [archiveKey, setArchiveKey] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<PluginImportCandidate[]>([]);
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
    useState<PluginImportCommitResponse | null>(null);

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
          toast.error(t("library.pluginsImport.toasts.missingZip"));
          return;
        }
        formData.append("file", zipFile);
      } else {
        const url = githubUrl.trim();
        if (!url) {
          toast.error(t("library.pluginsImport.toasts.missingGithubUrl"));
          return;
        }
        formData.append("github_url", url);
      }

      const resp = await pluginsService.importDiscover(formData);
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

      toast.success(t("library.pluginsImport.toasts.discovered"));
    } catch (error) {
      logger.error("[PluginsImport] discover failed:", error);
      toast.error(t("library.pluginsImport.toasts.discoverError"));
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

      const enqueue = await pluginsService.importCommit(payload);
      setCommitJobId(enqueue.job_id);

      const startedAt = Date.now();
      let finalError: string | null = null;
      let finalResult: PluginImportCommitResponse | null = null;
      while (true) {
        if (!isActiveRef.current) return;

        const job = await pluginsService.getImportJob(enqueue.job_id);
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

        if (Date.now() - startedAt > 10 * 60 * 1000) {
          finalError = t("library.pluginsImport.toasts.commitTimeout");
          setCommitError(finalError);
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (!isActiveRef.current) return;

      if (finalError) {
        toast.error(
          finalError || t("library.pluginsImport.toasts.commitError"),
        );
        return;
      }

      const failed = (finalResult?.items || []).filter(
        (i) => i.status !== "success",
      );
      if (failed.length > 0) {
        toast.error(t("library.pluginsImport.toasts.partialFailed"));
        return;
      }

      toast.success(t("library.pluginsImport.toasts.committed"));
      await onImported?.();
      handleClose();
    } catch (error) {
      logger.error("[PluginsImport] commit failed:", error);
      toast.error(t("library.pluginsImport.toasts.commitError"));
    } finally {
      setIsCommitting(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    const next: Record<string, CandidateSelectionState> = { ...selections };
    for (const c of candidates) {
      next[c.relative_path] = {
        selected: checked,
        nameOverride: next[c.relative_path]?.nameOverride || "",
      };
    }
    setSelections(next);
  };

  const toggleSelectPage = (checked: boolean) => {
    const next: Record<string, CandidateSelectionState> = { ...selections };
    for (const c of pagedCandidates) {
      next[c.relative_path] = {
        selected: checked,
        nameOverride: next[c.relative_path]?.nameOverride || "",
      };
    }
    setSelections(next);
  };

  const toggleCandidate = (relativePath: string, checked: boolean) => {
    setSelections((prev) => ({
      ...prev,
      [relativePath]: {
        selected: checked,
        nameOverride: prev[relativePath]?.nameOverride || "",
      },
    }));
  };

  const updateNameOverride = (relativePath: string, value: string) => {
    setSelections((prev) => ({
      ...prev,
      [relativePath]: {
        selected: prev[relativePath]?.selected ?? true,
        nameOverride: value,
      },
    }));
  };

  const headerTitle = t("library.pluginsImport.title");

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? null : handleClose())}>
      <CapabilityDialogContent
        title={headerTitle}
        description={t("library.pluginsImport.description")}
      >
        <div className="space-y-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as SourceTab)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="zip">
                {t("library.pluginsImport.tabs.zip")}
              </TabsTrigger>
              <TabsTrigger value="github">
                {t("library.pluginsImport.tabs.github")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="zip" className="space-y-2">
              <Label htmlFor="plugin-zip">
                {t("library.pluginsImport.fields.zip")}
              </Label>
              <Input
                id="plugin-zip"
                type="file"
                accept=".zip"
                onChange={(e) => setZipFile(e.target.files?.[0] || null)}
              />
            </TabsContent>

            <TabsContent value="github" className="space-y-2">
              <Label htmlFor="plugin-github">
                {t("library.pluginsImport.fields.githubUrl")}
              </Label>
              <Input
                id="plugin-github"
                placeholder={t("library.pluginsImport.placeholders.githubUrl")}
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="secondary"
              onClick={onDiscover}
              disabled={isDiscovering || isCommitting}
            >
              {isDiscovering
                ? t("library.pluginsImport.actions.discovering")
                : t("library.pluginsImport.actions.discover")}
            </Button>

            {archiveKey && (
              <div className="text-xs text-muted-foreground">
                {t("library.pluginsImport.preview.found")} {candidates.length}{" "}
                {t("library.pluginsImport.preview.items")}
              </div>
            )}
          </div>

          {archiveKey && candidates.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={(v) => toggleSelectAll(Boolean(v))}
                      id="plugins-select-all"
                    />
                    <Label htmlFor="plugins-select-all" className="text-sm">
                      {t("library.pluginsImport.preview.selection.selectAll")}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isPageFullySelected}
                      onCheckedChange={(v) => toggleSelectPage(Boolean(v))}
                      id="plugins-select-page"
                    />
                    <Label htmlFor="plugins-select-page" className="text-sm">
                      {t("library.pluginsImport.preview.selection.selectPage")}
                    </Label>
                  </div>
                </div>

                {overwriteCount > 0 && (
                  <Badge variant="secondary">
                    {t("library.pluginsImport.preview.overwrite")}{" "}
                    {overwriteCount}{" "}
                    {t("library.pluginsImport.preview.overwriteItems")}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                {pagedCandidates.map((c) => {
                  const state = selections[c.relative_path];
                  const isSelected = Boolean(state?.selected);
                  const requiresName = Boolean(c.requires_name);
                  const displayName = c.plugin_name || c.relative_path;
                  return (
                    <div
                      key={c.relative_path}
                      className="rounded-xl border border-border/60 bg-card p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(v) =>
                              toggleCandidate(c.relative_path, Boolean(v))
                            }
                            id={`plugin-cand-${c.relative_path}`}
                          />
                          <div className="min-w-0">
                            <Label
                              htmlFor={`plugin-cand-${c.relative_path}`}
                              className="text-sm font-medium"
                            >
                              {displayName}
                            </Label>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {t("library.pluginsImport.relativePath")}:{" "}
                              {c.relative_path}
                            </div>
                            {(c.version || c.description) && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {c.version ? `v${c.version}` : null}
                                {c.version && c.description ? " · " : null}
                                {c.description}
                              </div>
                            )}
                          </div>
                        </div>

                        {c.will_overwrite && (
                          <Badge variant="outline">
                            {t("library.pluginsImport.preview.willOverwrite")}
                          </Badge>
                        )}
                      </div>

                      {requiresName && isSelected && (
                        <div className="space-y-1">
                          <Label className="text-xs">
                            {t("library.pluginsImport.fields.nameOverride")}
                          </Label>
                          <Input
                            value={state?.nameOverride || ""}
                            onChange={(e) =>
                              updateNameOverride(
                                c.relative_path,
                                e.target.value,
                              )
                            }
                            placeholder={t(
                              "library.pluginsImport.placeholders.name",
                            )}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {totalCandidatePages > 1 && (
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={candidatePageClamped <= 1}
                    onClick={() => setCandidatePage((p) => Math.max(1, p - 1))}
                  >
                    {t("library.pluginsImport.preview.pagination.prev")}
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    {t("library.pluginsImport.preview.pagination.page", {
                      page: candidatePageClamped,
                      pages: totalCandidatePages,
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={candidatePageClamped >= totalCandidatePages}
                    onClick={() =>
                      setCandidatePage((p) =>
                        Math.min(totalCandidatePages, p + 1),
                      )
                    }
                  >
                    {t("library.pluginsImport.preview.pagination.next")}
                  </Button>
                </div>
              )}
            </div>
          )}

          {commitJobId && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ListChecks className="size-4 text-muted-foreground" />
                  <span>{t("library.pluginsImport.progress.title")}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {t("library.pluginsImport.progress.value")}:{" "}
                  {commitProgress ?? 0}%
                </span>
              </div>
              {commitError && (
                <div className="mt-2 text-xs text-destructive">
                  {commitError}
                </div>
              )}
            </div>
          )}

          {commitResult && (
            <div className="rounded-xl border border-border/60 bg-card p-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCheck className="size-4 text-muted-foreground" />
                <span>{t("library.pluginsImport.result.title")}</span>
              </div>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {(commitResult.items || []).map((item) => (
                  <div key={item.relative_path}>
                    {item.plugin_name || item.relative_path}: {item.status}
                    {item.error ? ` (${item.error})` : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDiscovering || isCommitting}
          >
            {t("library.pluginsImport.actions.back")}
          </Button>
          <Button
            onClick={onCommit}
            disabled={!canCommit || isDiscovering || isCommitting}
          >
            {isCommitting
              ? t("library.pluginsImport.actions.committing")
              : t("library.pluginsImport.actions.commit")}
          </Button>
        </DialogFooter>
      </CapabilityDialogContent>
    </Dialog>
  );
}

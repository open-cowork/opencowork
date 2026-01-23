"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
  const [commitResult, setCommitResult] =
    useState<SkillImportCommitResponse | null>(null);

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
    try {
      const formData = new FormData();
      if (tab === "zip") {
        if (!zipFile) {
          toast.error(
            t("library.skillsImport.toasts.missingZip", "请选择一个 zip 文件"),
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
              "请输入 GitHub 地址",
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
          "解析成功，请确认要导入的技能",
        ),
      );
    } catch (error) {
      console.error("[SkillsImport] discover failed:", error);
      toast.error(
        t("library.skillsImport.toasts.discoverError", "解析失败，请稍后重试"),
      );
    } finally {
      setIsDiscovering(false);
    }
  };

  const onCommit = async () => {
    if (!archiveKey) return;
    if (!canCommit) return;

    setIsCommitting(true);
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

      const resp = await skillsService.importCommit(payload);
      setCommitResult(resp);

      const failed = (resp.items || []).filter((i) => i.status !== "success");
      if (failed.length > 0) {
        toast.error(
          t(
            "library.skillsImport.toasts.partialFailed",
            "部分技能导入失败，请查看详情",
          ),
        );
        return;
      }

      toast.success(t("library.skillsImport.toasts.committed", "技能导入成功"));
      await onImported?.();
      handleClose();
    } catch (error) {
      console.error("[SkillsImport] commit failed:", error);
      toast.error(
        t("library.skillsImport.toasts.commitError", "导入失败，请稍后重试"),
      );
    } finally {
      setIsCommitting(false);
    }
  };

  const hasPreview = candidates.length > 0 && !!archiveKey;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl p-0 gap-0 max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b bg-muted/5">
          <DialogTitle className="text-lg font-semibold">
            {t("library.skillsImport.title", "导入技能")}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 bg-background space-y-6 overflow-y-auto flex-1 min-h-0">
          {!hasPreview && (
            <Tabs value={tab} onValueChange={(v) => setTab(v as SourceTab)}>
              <TabsList>
                <TabsTrigger value="zip">
                  {t("library.skillsImport.tabs.zip", "上传压缩包")}
                </TabsTrigger>
                <TabsTrigger value="github">
                  {t("library.skillsImport.tabs.github", "GitHub 地址")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="zip" className="space-y-3">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("library.skillsImport.fields.zip", "Zip 文件")}
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
                    "GitHub 公共仓库地址",
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
                    "默认尝试 main/master 分支（仅支持 github.com 公共仓库）",
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          {hasPreview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  {t("library.skillsImport.preview.found", "发现")}{" "}
                  <span className="text-foreground font-medium">
                    {candidates.length}
                  </span>{" "}
                  {t("library.skillsImport.preview.items", "个技能定义")}
                  {overwriteCount > 0 && (
                    <span className="ml-2">
                      · {t("library.skillsImport.preview.overwrite", "将覆盖")}{" "}
                      <span className="text-foreground font-medium">
                        {overwriteCount}
                      </span>{" "}
                      {t(
                        "library.skillsImport.preview.overwriteItems",
                        "个同名技能",
                      )}
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setArchiveKey(null);
                    setCandidates([]);
                    setCandidatePage(1);
                    setSelections({});
                    setCommitResult(null);
                  }}
                >
                  {t("library.skillsImport.actions.back", "返回")}
                </Button>
              </div>

              {totalCandidatePages > 1 && (
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    {t(
                      "library.skillsImport.preview.pagination.range",
                      "显示 {{from}}-{{to}} / {{total}}",
                      {
                        from:
                          (candidatePageClamped - 1) * CANDIDATES_PAGE_SIZE + 1,
                        to: Math.min(
                          candidatePageClamped * CANDIDATES_PAGE_SIZE,
                          candidates.length,
                        ),
                        total: candidates.length,
                      },
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        isCommitting ||
                        isDiscovering ||
                        candidatePageClamped <= 1
                      }
                      onClick={() =>
                        setCandidatePage((prev) => Math.max(1, prev - 1))
                      }
                    >
                      {t(
                        "library.skillsImport.preview.pagination.prev",
                        "上一页",
                      )}
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      {t(
                        "library.skillsImport.preview.pagination.page",
                        "第 {{page}} / {{pages}} 页",
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
                        "下一页",
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {pagedCandidates.map((c) => {
                  const sel = selections[c.relative_path] || {
                    selected: false,
                    nameOverride: "",
                  };
                  const disabled = isCommitting || isDiscovering;
                  return (
                    <div
                      key={c.relative_path}
                      className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/10 px-4 py-3"
                    >
                      <Checkbox
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
                                "未命名",
                              )}
                          </span>
                          {c.will_overwrite && (
                            <Badge variant="outline" className="text-xs">
                              {t(
                                "library.skillsImport.preview.willOverwrite",
                                "将覆盖",
                              )}
                            </Badge>
                          )}
                          {c.relative_path === "." && (
                            <Badge variant="outline" className="text-xs">
                              {t("library.skillsImport.preview.root", "根目录")}
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground font-mono">
                          {t("library.skillsImport.preview.path", "路径")}:{" "}
                          {c.relative_path}
                        </div>

                        {c.requires_name && sel.selected && (
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {t(
                                "library.skillsImport.fields.nameOverride",
                                "技能名称",
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
                                "例如：my-skill",
                              )}
                              className="font-mono"
                            />
                            <div className="text-xs text-muted-foreground">
                              {t(
                                "library.skillsImport.hints.nameRequired",
                                "检测到 SKILL.md 位于根目录，必须手动填写技能名称",
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {commitResult && (
                <div className="rounded-xl border border-border/50 bg-muted/5 px-4 py-3 space-y-2">
                  <div className="text-sm font-medium">
                    {t("library.skillsImport.result.title", "导入结果")}
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
                            ? t("library.skillsImport.result.success", "成功")
                            : t("library.skillsImport.result.failed", "失败")}
                        </span>
                      </div>
                    ))}
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
            {t("common.cancel", "取消")}
          </Button>
          {!hasPreview ? (
            <Button onClick={onDiscover} disabled={isDiscovering}>
              {isDiscovering
                ? t("library.skillsImport.actions.discovering", "解析中...")
                : t("library.skillsImport.actions.discover", "解析")}
            </Button>
          ) : (
            <Button onClick={onCommit} disabled={!canCommit || isCommitting}>
              {isCommitting
                ? t("library.skillsImport.actions.committing", "导入中...")
                : t("library.skillsImport.actions.commit", "导入并安装")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

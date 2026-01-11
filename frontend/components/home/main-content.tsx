"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Sparkles, Mic, ArrowUp } from "lucide-react";

export function MainContent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-3xl space-y-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-foreground">
            我能为你做什么？
          </h1>
        </div>

        {/* Input Area */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <Textarea
            placeholder="分配一个任务或提问任何问题"
            className="min-h-[100px] resize-none border-0 bg-transparent p-0 text-lg focus-visible:ring-0"
          />
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Plus className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Sparkles className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Mic className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                className="h-10 w-10 rounded-full bg-muted text-muted-foreground"
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plug } from "lucide-react";
import { ConnectorIcons } from "../model/connectors";
import { ConnectorsDialog } from "./connectors/connectors-dialog";

/**
 * Connectors Bar Entry Component
 *
 * Displays a clickable bar that opens the connectors dialog
 * Shows popular connector icons as a preview
 */
export function ConnectorsBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className="mt-4 flex w-full items-center justify-between rounded-lg border border-border bg-card/50 px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors group"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
          <Plug className="size-5" />
          <span className="text-sm">将您的工具连接到 Poco</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient-right">
          {[
            ConnectorIcons.gmail,
            ConnectorIcons.calendar,
            ConnectorIcons.drive,
            ConnectorIcons.slack,
            ConnectorIcons.github,
            ConnectorIcons.notion,
          ].map((Icon, i) => (
            <div
              key={i}
              className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground"
            >
              <Icon className="size-3.5" />
            </div>
          ))}
        </div>
      </div>

      <ConnectorsDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}

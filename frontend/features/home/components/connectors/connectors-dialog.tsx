import { useState } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ConnectorDetail } from "./connector-detail";
import { ConnectorCard } from "./connector-card";
import {
  AVAILABLE_CONNECTORS,
  Connector,
  ConnectorType,
} from "../../model/connectors";

interface ConnectorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Connectors dialog with tabs, search, and connector grid
 */
export function ConnectorsDialog({
  open,
  onOpenChange,
}: ConnectorsDialogProps) {
  const [activeTab, setActiveTab] = useState<ConnectorType>("app");
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(
    null,
  );

  const filteredConnectors = AVAILABLE_CONNECTORS.filter(
    (c) => c.type === activeTab || (activeTab === "app" && c.type === "app"),
  );

  // Reset selection when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedConnector(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl p-0 h-[600px] flex flex-col gap-0 bg-[#1e1e1e] border-[#333] text-foreground overflow-hidden">
        {selectedConnector ? (
          <ConnectorDetail
            connector={selectedConnector}
            onBack={() => setSelectedConnector(null)}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
              <DialogTitle>连接器</DialogTitle>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Tabs & Search */}
              <div className="px-6 py-4 pb-2">
                <div className="flex items-center justify-between gap-4">
                  <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as ConnectorType)}
                    className="w-auto"
                  >
                    <TabsList className="bg-transparent p-0 h-auto gap-2 justify-start">
                      <TabsTrigger
                        value="app"
                        className="rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/20 hover:text-foreground transition-all"
                      >
                        应用
                      </TabsTrigger>
                      <TabsTrigger
                        value="mcp"
                        className="rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/20 hover:text-foreground transition-all"
                      >
                        MCP
                      </TabsTrigger>
                      <TabsTrigger
                        value="skill"
                        className="rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/20 hover:text-foreground transition-all"
                      >
                        Skill
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索"
                      className="pl-9 h-9 bg-[#252525] border-[#333] focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                </div>
              </div>
              <Separator className="bg-[#333]" />

              <div className="flex-1 w-full overflow-y-auto custom-scrollbar">
                <div className="p-6 grid grid-cols-2 gap-4 pb-20">
                  {filteredConnectors.map((connector) => (
                    <ConnectorCard
                      key={connector.id}
                      connector={connector}
                      isComingSoon={true}
                      onClick={() => setSelectedConnector(connector)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

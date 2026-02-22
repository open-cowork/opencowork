"use client";

import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type {
  ExcalidrawInitialDataState,
  ExcalidrawProps,
} from "@excalidraw/excalidraw/types";

export interface ExcalidrawViewerClientProps {
  initialData: ExcalidrawInitialDataState;
  theme: "light" | "dark";
}

const EXCALIDRAW_UI_OPTIONS: ExcalidrawProps["UIOptions"] = {
  canvasActions: {
    changeViewBackgroundColor: false,
    clearCanvas: false,
    export: false,
    loadScene: false,
    saveToActiveFile: false,
    toggleTheme: false,
    saveAsImage: false,
  },
  tools: {
    image: false,
  },
};

export function ExcalidrawViewerClient({
  initialData,
  theme,
}: ExcalidrawViewerClientProps) {
  return (
    <div className="h-full w-full [&_.excalidraw]:h-full [&_.excalidraw]:w-full">
      <Excalidraw
        initialData={initialData}
        theme={theme}
        viewModeEnabled
        UIOptions={EXCALIDRAW_UI_OPTIONS}
      />
    </div>
  );
}

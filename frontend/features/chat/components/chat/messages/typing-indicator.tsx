"use client";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 h-5">
      <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" />
    </div>
  );
}

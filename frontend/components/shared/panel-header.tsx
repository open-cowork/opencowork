import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import type { LucideIcon } from "lucide-react";

/**
 * PanelHeader Props
 */
export interface PanelHeaderProps {
  /**
   * Icon component to display in the header
   */
  icon?: LucideIcon;
  /**
   * Main title text
   */
  title: string;
  /**
   * Optional description text below the title
   */
  description?: string;
  /**
   * Optional action button or element to display on the right side
   */
  action?: ReactNode;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  /**
   * Additional CSS classes for the title
   */
  titleClassName?: string;
  /**
   * Whether to show the icon
   * @default true
   */
  showIcon?: boolean;
  /**
   * Icon color class
   * @default "text-foreground"
   */
  iconClassName?: string;
  /**
   * Optional click handler for the icon
   */
  onIconClick?: () => void;
}

/**
 * PanelHeader Component
 * ...
 */
export function PanelHeader({
  icon: Icon,
  title,
  description,
  action,
  className,
  titleClassName,
  showIcon = true,
  iconClassName = "text-foreground",
  onIconClick,
}: PanelHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b px-4 py-3",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {Icon && showIcon && (
          <div
            onClick={onIconClick}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg bg-muted",
              iconClassName,
              onIconClick &&
                "cursor-pointer hover:bg-muted/80 active:bg-muted/90",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="flex flex-col">
          <h2 className={cn("text-sm font-semibold", titleClassName)}>
            {title}
          </h2>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="flex items-center">{action}</div>}
    </div>
  );
}

/**
 * PanelHeaderAction Props
 */
export interface PanelHeaderActionProps {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * PanelHeaderAction Component
 *
 * A button component specifically designed for panel header actions.
 * Optionally renders as a child component using Radix UI Slot.
 */
export function PanelHeaderAction({
  children,
  asChild = false,
  className,
  onClick,
  disabled = false,
}: PanelHeaderActionProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
        // Apply hover styles only when not disabled
        !disabled && "hover:bg-accent hover:text-accent-foreground",
        "h-8 w-8 p-0",
        className,
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Comp>
  );
}

/**
 * PanelHeaderButton Props
 */
export interface PanelHeaderButtonProps {
  children: ReactNode;
  variant?: "default" | "ghost";
  size?: "default" | "sm" | "icon";
  className?: string;
  onClick?: () => void;
}

/**
 * PanelHeaderButton Component
 *
 * A button component for panel headers with predefined variants.
 */
export function PanelHeaderButton({
  children,
  variant = "ghost",
  size = "default",
  className,
  onClick,
}: PanelHeaderButtonProps) {
  const sizeClasses = {
    default: "h-9 px-3",
    sm: "h-8 px-2 text-xs",
    icon: "h-8 w-8 p-0",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        variant === "default" &&
          "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
        sizeClasses[size],
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

import { AnimatePresence, motion } from "framer-motion";
import { GripVertical, Maximize2, Pin, X } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { cn } from "#/lib/utils";

/**
 * Widget chrome for Mission Control: a glass panel with a drag handle,
 * pin toggle and an expand-to-fullscreen mode via shared layout animation.
 */
export function WidgetFrame({
  id,
  label,
  title,
  action,
  children,
  className,
  pinned = false,
  onPinToggle,
  dragHandleProps,
  expandable = true,
}: {
  id: string;
  label?: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  pinned?: boolean;
  onPinToggle?: () => void;
  /** Spread onto the grip so a parent dnd library can own dragging. */
  dragHandleProps?: Record<string, unknown>;
  expandable?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const header = (isExpanded: boolean) => (
    <div className="mb-4 flex items-center gap-2">
      {!isExpanded && (
        <span
          {...dragHandleProps}
          className="-ml-1 cursor-grab text-slate-600 opacity-0 transition-opacity hover:text-slate-400 active:cursor-grabbing group-hover/widget:opacity-100"
          aria-label={`Move ${title}`}
        >
          <GripVertical className="h-4 w-4" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        {label && <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-500">{label}</p>}
        <h3 className="mt-0.5 truncate text-base font-bold tracking-tight text-white">{title}</h3>
      </div>
      {action}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/widget:opacity-100">
        {onPinToggle && (
          <button
            onClick={onPinToggle}
            aria-label={pinned ? `Unpin ${title}` : `Pin ${title}`}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
              pinned ? "text-crew-300" : "text-slate-500 hover:bg-white/[0.06] hover:text-white",
            )}
          >
            <Pin className={cn("h-3.5 w-3.5", pinned && "fill-current")} />
          </button>
        )}
        {expandable && (
          <button
            onClick={() => setExpanded(!isExpanded)}
            aria-label={isExpanded ? `Close ${title}` : `Expand ${title}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            {isExpanded ? <X className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <motion.section
        layoutId={`widget-${id}`}
        className={cn("glass group/widget rounded-3xl p-5", expanded && "invisible", className)}
      >
        {header(false)}
        {children}
      </motion.section>

      <AnimatePresence>
        {expanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(false)}
              className="fixed inset-0 z-[70] bg-[#020308]/70 backdrop-blur-sm"
            />
            <motion.section
              layoutId={`widget-${id}`}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="glass-deep group/widget fixed inset-4 z-[75] overflow-y-auto rounded-3xl p-7 sm:inset-10"
              role="dialog"
              aria-label={title}
            >
              {header(true)}
              {children}
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

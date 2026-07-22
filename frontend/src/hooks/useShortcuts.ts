import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { NAV_ENTRIES } from "#/lib/navigation";
import { useUiStore } from "#/stores/uiStore";

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
}

/**
 * Global OS shortcuts:
 *   g + <key>  navigate (see NAV_ENTRIES chords)
 *   shift+d    toggle theme
 *   shift+a    toggle AI assistant
 */
export function useShortcuts() {
  const navigate = useNavigate();
  const chordArmed = useRef<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;

      const armed = chordArmed.current !== null && Date.now() - chordArmed.current < 1200;
      if (armed) {
        chordArmed.current = null;
        const entry = NAV_ENTRIES.find((n) => n.chord === e.key.toLowerCase());
        if (entry) {
          e.preventDefault();
          navigate(entry.to);
        }
        return;
      }

      if (e.key === "g" && !e.shiftKey) {
        chordArmed.current = Date.now();
        return;
      }
      if (e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        useUiStore.getState().toggleTheme();
      } else if (e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        const s = useUiStore.getState();
        s.setAssistantOpen(!s.assistantOpen);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);
}

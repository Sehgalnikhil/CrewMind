import { useCallback, useEffect, useState } from "react";

export interface WidgetLayout {
  order: string[];
  hidden: string[];
  pinned: string[];
  wide: string[];
}

const KEY = "crewmind-mission-layout";

export function useWidgetLayout(allIds: string[], defaultHidden: string[], defaultWide: string[]) {
  const [layout, setLayout] = useState<WidgetLayout>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const l = JSON.parse(raw) as WidgetLayout;
        // keep newly-registered widgets appended
        const known = new Set(l.order);
        return { ...l, order: [...l.order.filter((id) => allIds.includes(id)), ...allIds.filter((id) => !known.has(id))] };
      }
    } catch {
      /* fall through to defaults */
    }
    return { order: allIds, hidden: defaultHidden, pinned: [], wide: defaultWide };
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(layout));
  }, [layout]);

  const toggle = useCallback((field: "hidden" | "pinned" | "wide", id: string) => {
    setLayout((l) => ({
      ...l,
      [field]: l[field].includes(id) ? l[field].filter((x) => x !== id) : [...l[field], id],
    }));
  }, []);

  const swap = useCallback((a: string, b: string) => {
    setLayout((l) => {
      const order = [...l.order];
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia === -1 || ib === -1) return l;
      [order[ia], order[ib]] = [order[ib], order[ia]];
      return { ...l, order };
    });
  }, []);

  const move = useCallback((id: string, dir: -1 | 1) => {
    setLayout((l) => {
      const order = [...l.order];
      const i = order.indexOf(id);
      const j = i + dir;
      if (i === -1 || j < 0 || j >= order.length) return l;
      [order[i], order[j]] = [order[j], order[i]];
      return { ...l, order };
    });
  }, []);

  const reset = useCallback(
    () => setLayout({ order: allIds, hidden: defaultHidden, pinned: [], wide: defaultWide }),
    [allIds, defaultHidden, defaultWide],
  );

  /** pinned first, stable within groups */
  const sorted = [...layout.order].sort((a, b) => Number(layout.pinned.includes(b)) - Number(layout.pinned.includes(a)));

  return { layout, sorted, toggle, swap, move, reset };
}

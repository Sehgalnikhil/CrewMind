import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Minus, Plus, Search, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { listDocuments } from "#/api/documents";
import { AppShell } from "#/components/layout/AppShell";
import { GlowChip } from "#/components/os/ui";
import { NODE_TYPE_META, buildGraph } from "#/components/graph/data";
import type { GraphNode, NodeType } from "#/components/graph/data";
import { cn } from "#/lib/utils";

const W = 1600;
const H = 1100;
const TYPES = Object.keys(NODE_TYPE_META) as NodeType[];

export function KnowledgeGraphPage() {
  const { data: documents } = useQuery({ queryKey: ["documents"], queryFn: listDocuments });
  const graph = useMemo(() => buildGraph(documents ?? []), [documents]);

  const [view, setView] = useState({ x: -W / 2 + 500, y: -H / 2 + 350, k: 0.62 });
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<Set<NodeType>>(new Set());
  const [monthMax, setMonthMax] = useState(11);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const dragRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const byId = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph]);

  const q = query.trim().toLowerCase();
  const visible = useCallback(
    (n: GraphNode) =>
      (!types.size || types.has(n.type)) && n.month <= monthMax,
    [types, monthMax],
  );
  const matches = useCallback(
    (n: GraphNode) => !!q && `${n.label} ${n.type}`.toLowerCase().includes(q),
    [q],
  );

  const neighborIds = useMemo(() => {
    const focus = hovered ?? selected;
    if (!focus) return null;
    const s = new Set<string>([focus]);
    for (const e of graph.edges) {
      if (e.a === focus) s.add(e.b);
      if (e.b === focus) s.add(e.a);
    }
    return s;
  }, [hovered, selected, graph]);

  const sel = selected ? byId.get(selected) : null;
  const selEdges = useMemo(
    () => (selected ? graph.edges.filter((e) => e.a === selected || e.b === selected) : []),
    [selected, graph],
  );

  /* pan / zoom */
  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as Element).closest("[data-node]")) return;
    dragRef.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    setView((v) => ({ ...v, x: d.vx + (e.clientX - d.x), y: d.vy + (e.clientY - d.y) }));
  }
  function zoomBy(f: number, cx?: number, cy?: number) {
    setView((v) => {
      const k = Math.min(Math.max(v.k * f, 0.28), 2.6);
      const rect = svgRef.current?.getBoundingClientRect();
      const px = cx ?? (rect?.width ?? 800) / 2;
      const py = cy ?? (rect?.height ?? 600) / 2;
      return { k, x: px - ((px - v.x) / v.k) * k, y: py - ((py - v.y) / v.k) * k };
    });
  }

  function focusNode(n: GraphNode) {
    const rect = svgRef.current?.getBoundingClientRect();
    const k = Math.max(view.k, 0.9);
    setView({ k, x: (rect?.width ?? 800) / 2 - n.x * k, y: (rect?.height ?? 600) / 2 - n.y * k });
    setSelected(n.id);
  }

  const visibleNodes = graph.nodes.filter(visible);
  const visibleIds = new Set(visibleNodes.map((n) => n.id));

  return (
    <AppShell title="Knowledge Graph" wide flush>
      <div className="relative h-full w-full overflow-hidden">
        {/* canvas */}
        <svg
          ref={svgRef}
          className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => (dragRef.current = null)}
          onWheel={(e) => zoomBy(e.deltaY < 0 ? 1.12 : 0.89, e.clientX - (svgRef.current?.getBoundingClientRect().left ?? 0), e.clientY - (svgRef.current?.getBoundingClientRect().top ?? 0))}
          role="application"
          aria-label="Interactive knowledge graph. Drag to pan, scroll to zoom, click nodes to explore."
        >
          <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
            {graph.edges.map((e, i) => {
              const a = byId.get(e.a)!;
              const b = byId.get(e.b)!;
              if (!visibleIds.has(e.a) || !visibleIds.has(e.b)) return null;
              const lit = neighborIds ? e.a === (hovered ?? selected) || e.b === (hovered ?? selected) : false;
              return (
                <line
                  key={i}
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={lit ? NODE_TYPE_META[a.type].color : "rgba(138,123,239,0.16)"}
                  strokeWidth={lit ? 1.6 : 0.8}
                  className={lit ? "dash-flow" : undefined}
                  opacity={neighborIds && !lit ? 0.25 : 1}
                />
              );
            })}
            {visibleNodes.map((n) => {
              const m = NODE_TYPE_META[n.type];
              const r = 7 + Math.min(n.degree, 8) * 1.6;
              const dim = (neighborIds && !neighborIds.has(n.id)) || (q && !matches(n));
              const isSel = selected === n.id;
              return (
                <g
                  key={n.id}
                  data-node
                  transform={`translate(${n.x},${n.y})`}
                  className="cursor-pointer"
                  opacity={dim ? 0.22 : 1}
                  onClick={() => setSelected(n.id)}
                  onDoubleClick={() => focusNode(n)}
                  onMouseEnter={() => setHovered(n.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {isSel && (
                    <circle r={r + 7} fill="none" stroke={m.color} strokeWidth="1.5" strokeDasharray="4 5" opacity="0.9">
                      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="8s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle r={r} fill={`${m.color}2e`} stroke={m.color} strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 ${isSel || hovered === n.id ? 12 : 5}px ${m.color})` }} />
                  <circle r={2.5} fill={m.color} />
                  {(view.k > 0.75 || hovered === n.id || isSel || matches(n)) && (
                    <text y={r + 14} textAnchor="middle" fontSize={11} fontWeight={700} fill="#e6e9f2" stroke="#05060c" strokeWidth={3} paintOrder="stroke">
                      {n.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* top controls */}
        <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-wrap items-start justify-between gap-3">
          <div className="pointer-events-auto flex max-w-full flex-col gap-2">
            <div className="glass-deep flex w-72 items-center gap-2.5 rounded-2xl px-4 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-crew-300" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Semantic search…"
                aria-label="Search graph"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
              {query && (
                <button onClick={() => setQuery("")} aria-label="Clear" className="text-slate-500 hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex max-w-[560px] flex-wrap gap-1.5">
              {TYPES.map((t) => {
                const on = types.has(t);
                const m = NODE_TYPE_META[t];
                return (
                  <button
                    key={t}
                    onClick={() =>
                      setTypes((s) => {
                        const n = new Set(s);
                        if (n.has(t)) n.delete(t);
                        else n.add(t);
                        return n;
                      })
                    }
                    aria-pressed={on}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-md transition-all",
                      !on && "border-white/10 bg-[#0a0c16]/60 text-slate-400 hover:text-slate-200",
                    )}
                    style={on ? { borderColor: `${m.color}77`, backgroundColor: `${m.color}25`, color: m.color } : undefined}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pointer-events-auto glass-deep flex items-center gap-3 rounded-2xl px-4 py-2.5">
            <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
              {visibleNodes.length} nodes · {graph.edges.length} edges
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-emerald-400">
              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400 status-ping" /> indexed 4m ago
            </span>
          </div>
        </div>

        {/* bottom-left: zoom + timeline */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-2">
          <div className="glass-deep flex items-center gap-1 rounded-2xl p-1.5">
            <button onClick={() => zoomBy(1.25)} aria-label="Zoom in" className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white">
              <Plus className="h-4 w-4" />
            </button>
            <button onClick={() => zoomBy(0.8)} aria-label="Zoom out" className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white">
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-2 font-mono text-[10px] text-slate-500">{Math.round(view.k * 100)}%</span>
          </div>
          <div className="glass-deep rounded-2xl px-4 py-3">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
                timeline · last {monthMax + 1} months
              </span>
              <input
                type="range"
                min={0}
                max={11}
                value={monthMax}
                onChange={(e) => setMonthMax(Number(e.target.value))}
                className="w-44 accent-[#8A7BEF]"
                aria-label="Timeline window in months"
              />
            </label>
          </div>
        </div>

        {/* minimap */}
        <div className="glass-deep absolute bottom-4 right-4 hidden overflow-hidden rounded-2xl p-2 sm:block">
          <svg
            width={150}
            height={104}
            viewBox={`0 0 ${W} ${H}`}
            className="cursor-pointer"
            role="img"
            aria-label="Graph minimap"
            onClick={(e) => {
              const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
              const gx = ((e.clientX - r.left) / r.width) * W;
              const gy = ((e.clientY - r.top) / r.height) * H;
              const rect = svgRef.current?.getBoundingClientRect();
              setView((v) => ({ ...v, x: (rect?.width ?? 800) / 2 - gx * v.k, y: (rect?.height ?? 600) / 2 - gy * v.k }));
            }}
          >
            {visibleNodes.map((n) => (
              <circle key={n.id} cx={n.x} cy={n.y} r={10} fill={NODE_TYPE_META[n.type].color} opacity={0.7} />
            ))}
            {(() => {
              const rect = svgRef.current?.getBoundingClientRect();
              const vw = (rect?.width ?? 800) / view.k;
              const vh = (rect?.height ?? 600) / view.k;
              return <rect x={-view.x / view.k} y={-view.y / view.k} width={vw} height={vh} fill="none" stroke="#8A7BEF" strokeWidth={14} rx={20} />;
            })()}
          </svg>
        </div>

        {/* explorer drawer */}
        <AnimatePresence>
          {sel && (
            <motion.aside
              initial={{ x: "110%" }}
              animate={{ x: 0 }}
              exit={{ x: "110%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="glass-deep absolute bottom-4 right-4 top-16 z-10 flex w-[min(92vw,340px)] flex-col overflow-y-auto rounded-3xl p-5 sm:bottom-32"
              role="dialog"
              aria-label={`Node: ${sel.label}`}
              onKeyDown={(e) => e.key === "Escape" && setSelected(null)}
            >
              <div className="flex items-start justify-between gap-3">
                <GlowChip color={NODE_TYPE_META[sel.type].color}>{NODE_TYPE_META[sel.type].label}</GlowChip>
                <button onClick={() => setSelected(null)} aria-label="Close explorer" className="text-slate-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <h3 className="mt-2.5 text-lg font-extrabold tracking-tight text-white">{sel.label}</h3>
              <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
                {sel.degree} connections · added {sel.month === 0 ? "this month" : `${sel.month}mo ago`}
              </p>
              <div className="mt-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Relationships</p>
                <div className="flex flex-col gap-1.5">
                  {selEdges.map((e, i) => {
                    const other = byId.get(e.a === sel.id ? e.b : e.a)!;
                    return (
                      <button
                        key={i}
                        onClick={() => focusNode(other)}
                        className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-left transition-colors hover:bg-white/[0.06]"
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: NODE_TYPE_META[other.type].color }} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold text-white">{other.label}</span>
                          <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-600">{e.rel}</span>
                        </span>
                        <ArrowRight className="h-3 w-3 shrink-0 text-slate-500" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

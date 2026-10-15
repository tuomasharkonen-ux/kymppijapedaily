import {
  canBuyPiece,
  findOwned,
  isGrandfathered,
  isPieceBuilt,
  MOKKI_LANES,
  MOKKI_PIECES,
  pieceProgress,
  type MokkiLaneId,
  type MokkiPieceDef,
  type OwnedPieceRecord,
} from "@/lib/mokki";

export interface TreeMetrics {
  nodeW: number;
  nodeH: number;
  colW: number;
  rowH: number;
  /** Width of the sticky lane labels. */
  left: number;
  /** Height of the sticky era header. */
  header: number;
  laneGap: number;
}

export const METRICS_MOBILE: TreeMetrics = { nodeW: 148, nodeH: 58, colW: 184, rowH: 74, left: 44, header: 46, laneGap: 10 };
export const METRICS_WIDE: TreeMetrics = { nodeW: 176, nodeH: 64, colW: 220, rowH: 84, left: 128, header: 52, laneGap: 12 };

export const COLUMNS = 5;

export interface TreeGeometry {
  laneTop: Record<MokkiLaneId, number>;
  width: number;
  /** Height of the node area (below the era header). */
  height: number;
}

export function treeGeometry(m: TreeMetrics): TreeGeometry {
  const laneTop = {} as Record<MokkiLaneId, number>;
  let y = 8;
  for (const lane of MOKKI_LANES) {
    laneTop[lane.id] = y;
    y += lane.rows * m.rowH + m.laneGap;
  }
  return { laneTop, width: m.left + COLUMNS * m.colW + 16, height: y + 8 };
}

export function nodePos(def: MokkiPieceDef, m: TreeMetrics, g: TreeGeometry) {
  return {
    x: m.left + def.col * m.colW + (m.colW - m.nodeW) / 2,
    y: g.laneTop[def.lane] + def.row * m.rowH + (m.rowH - m.nodeH) / 2,
  };
}

// Edges that skip columns turn in the empty gap between columns, so they never run under another card
const rowFree = (lane: MokkiLaneId, row: number, fromCol: number, toCol: number) =>
  !MOKKI_PIECES.some((p) => p.lane === lane && p.row === row && p.col > fromCol && p.col < toCol);

export function edgePath(parent: MokkiPieceDef, child: MokkiPieceDef, m: TreeMetrics, g: TreeGeometry): string {
  const a = nodePos(parent, m, g);
  const b = nodePos(child, m, g);
  const x1 = a.x + m.nodeW;
  const y1 = a.y + m.nodeH / 2;
  const x2 = b.x;
  const y2 = b.y + m.nodeH / 2;
  const gap = m.colW - m.nodeW;
  let gx: number | null = null;
  if (child.col - parent.col > 1) {
    if (rowFree(child.lane, child.row, parent.col, child.col)) gx = x1 + gap / 2;
    else if (rowFree(parent.lane, parent.row, parent.col, child.col)) gx = x2 - gap / 2;
  }
  if (gx === null || y1 === y2) {
    const dx = Math.max(gap, (x2 - x1) / 2);
    return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
  }
  const r = 10;
  const s = y2 > y1 ? 1 : -1;
  return `M${x1},${y1} H${gx - r} Q${gx},${y1} ${gx},${y1 + s * r} V${y2 - s * r} Q${gx},${y2} ${gx + r},${y2} H${x2}`;
}

export type NodeState =
  | { kind: "built"; grandfathered: boolean }
  | { kind: "building"; remainingDays: number; buildDays: number }
  | { kind: "available" }
  | { kind: "locked"; reason: string }
  | { kind: "soon" };

export function nodeState(def: MokkiPieceDef, owned: OwnedPieceRecord[], gamesPlayed: number): NodeState {
  const record = findOwned(owned, def.id);
  if (record) {
    const progress = pieceProgress(record, gamesPlayed);
    if (progress.complete) return { kind: "built", grandfathered: isGrandfathered(owned, def.id) };
    return { kind: "building", remainingDays: progress.remainingDays, buildDays: record.build_days };
  }
  if (def.comingSoon) return { kind: "soon" };
  const check = canBuyPiece(def.id, owned, gamesPlayed);
  return check.ok === false ? { kind: "locked", reason: check.reason } : { kind: "available" };
}

export type EdgeState = "done" | "ready" | "locked";

export function edgeState(parent: MokkiPieceDef, child: NodeState, owned: OwnedPieceRecord[], gamesPlayed: number): EdgeState {
  if (!isPieceBuilt(owned, parent.id, gamesPlayed)) return "locked";
  if (child.kind === "built" || child.kind === "building") return "done";
  if (child.kind === "available") return "ready";
  return "locked";
}

export const laneColor = (id: MokkiLaneId) => MOKKI_LANES.find((l) => l.id === id)?.color ?? "#8fa6bc";

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function statusText(state: NodeState): string {
  switch (state.kind) {
    case "built":
      return state.grandfathered ? "✓ Built ahead of its time" : "✓ Built";
    case "building":
      return `🔨 Building · ${plural(state.remainingDays, "played day")} left`;
    case "available":
      return "Ready to build";
    case "locked":
      return `🔒 ${state.reason}`;
    case "soon":
      return "🚧 Tulossa · coming in a later update";
  }
}

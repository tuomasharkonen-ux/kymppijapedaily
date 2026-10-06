import { useCallback, useMemo, useState } from "react";
import { getPieceDef, pieceProgress, type MokkiPieceId } from "@/lib/mokki";
import type { MokkiOwnedPiece } from "@/hooks/useMokki";
import type { ScenePiece } from "./scene/MokkiScene";
import { playHammer } from "./mokkiSound";

const seenKey = (ownerId: string) => `kymppijape_mokki_seen_${ownerId}`;

function readSeen(ownerId: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(seenKey(ownerId)) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * Turns owned pieces into scene pieces. On your own island, a piece that has
 * finished since you last looked gets the drop-in "just built" moment once.
 */
export function useScenePieces(ownerId: string | null, owned: MokkiOwnedPiece[], gamesPlayed: number, celebrate: boolean) {
  const [seen, setSeen] = useState<string[]>(() => (ownerId ? readSeen(ownerId) : []));

  const pieces: ScenePiece[] = useMemo(
    () =>
      owned
        .filter((p) => getPieceDef(p.piece_id))
        .map((p) => {
          const progress = pieceProgress(p, gamesPlayed);
          return {
            id: p.piece_id as MokkiPieceId,
            status: progress.complete ? "complete" : "building",
            remainingDays: progress.remainingDays,
            justCompleted: celebrate && progress.complete && !seen.includes(p.piece_id),
          };
        }),
    [owned, gamesPlayed, celebrate, seen],
  );

  const onPieceLanded = useCallback(
    (id: MokkiPieceId) => {
      playHammer();
      if (!ownerId) return;
      const next = [...new Set([...readSeen(ownerId), id])];
      localStorage.setItem(seenKey(ownerId), JSON.stringify(next));
      // Keep the piece "just completed" for this render pass; it's remembered from the next visit
      setTimeout(() => setSeen(next), 1500);
    },
    [ownerId],
  );

  return { pieces, onPieceLanded };
}

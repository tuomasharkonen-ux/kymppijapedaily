import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMokki } from "@/hooks/useMokki";
import { computeEnvironment } from "./environment";
import { MokkiHeroView } from "./MokkiHeroView";
import { useScenePieces } from "./useScenePieces";
import { playLoyly } from "./mokkiSound";

export interface MokkiHeroProps {
  userId: string;
  hasPlayedToday: boolean; // chimney smoke
  activeSkin: string; // die on the porch table
  purchasedItems: string[]; // e.g. sieni_dice → autumn mushrooms
  hasMail: boolean; // mailbox flag raised (unrevealed Päivän Potti result)
  onMailboxClick: () => void;
  potTotal: number | null; // kiulu on the porch fills with coins; null = hide kiulu (no betting licence)
  onKiuluClick: () => void;
  onNoticeBoardClick: () => void; // badges
}

/** Re-evaluates season/time of day every few minutes so the island follows real Helsinki time. */
export function useLiveEnvironment() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return computeEnvironment(now);
}

/** Home-screen hero: the player's living mökki diorama. Only render for Mökkitontti owners. */
export const MokkiHero = ({
  userId,
  hasPlayedToday,
  activeSkin,
  purchasedItems,
  hasMail,
  onMailboxClick,
  potTotal,
  onKiuluClick,
  onNoticeBoardClick,
}: MokkiHeroProps) => {
  const navigate = useNavigate();
  const env = useLiveEnvironment();
  const { data, markLoylySeen } = useMokki(userId);
  const { pieces, onPieceLanded } = useScenePieces(userId, data.pieces, data.gamesPlayed, true);
  const [loylyKey, setLoylyKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  // Friends sent löyly: puff of steam, a note, then mark as seen
  useEffect(() => {
    if (data.loylyFrom.length === 0) return;
    const names = data.loylyFrom;
    const who = names.length === 1 ? names[0] : `${names[0]} and ${names.length - 1} other${names.length > 2 ? "s" : ""}`;
    setNotice(`${who} sent you löyly 💨`);
    const t1 = setTimeout(() => {
      setLoylyKey((k) => k + 1);
      playLoyly();
    }, 900);
    const t2 = setTimeout(() => markLoylySeen(), 4000);
    const t3 = setTimeout(() => setNotice(null), 7000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [data.loylyFrom, markLoylySeen]);

  return (
    <MokkiHeroView
      env={env}
      pieces={pieces}
      showSmoke={hasPlayedToday}
      loylyKey={loylyKey}
      mushrooms={purchasedItems.includes("sieni_dice")}
      skin={activeSkin}
      hasMail={hasMail}
      potTotal={potTotal}
      onMailboxClick={onMailboxClick}
      onKiuluClick={onKiuluClick}
      onNoticeBoardClick={onNoticeBoardClick}
      onOpen={() => navigate("/mokki")}
      onPieceLanded={onPieceLanded}
      notice={notice}
    />
  );
};

export default MokkiHero;

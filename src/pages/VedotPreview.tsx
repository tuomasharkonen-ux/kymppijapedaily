// Dev-only preview of the betting UI with mock data: /vedot-preview?view=sheet|tracker|stamp|settlement|jackpot|reveal|stakes|teaser|promo|customize|game|shop(&item=mokki_plot)
import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { GameBoard } from "@/components/GameBoard";
import { ShopItemModal } from "@/components/ShopItemModal";
import { CustomizationSection } from "@/components/CustomizationSection";
import { shopItems } from "@/lib/shopItems";
import { useSearchParams } from "react-router-dom";
import { Dice, type DiceSkin } from "@/components/Dice";
import { type BackgroundStyle, getBackgroundStyles } from "@/lib/animations";
import { TwinkleStars } from "@/components/TwinkleStars";
import { cn } from "@/lib/utils";
import { BettingSheet } from "@/components/vedot/BettingSheet";
import { BetTracker } from "@/components/vedot/BetTracker";
import { BettingPromo } from "@/components/vedot/BettingPromo";
import { PelattuStamp } from "@/components/vedot/PelattuStamp";
import { SettlementModal } from "@/components/vedot/SettlementModal";
import { PottiRevealModal } from "@/components/vedot/PottiRevealModal";
import { DailyStakesCard, VedotTeaser } from "@/components/vedot/DailyStakesCard";
import { computeTierLines, getOpeningDice, helsinkiDate, priceSlip, type BetSpec } from "@/lib/kymppijape";
import type { BetRow, DailyBoard } from "@/lib/vedot";

const OPENING = [3, 3, 3, 5, 1, 6, 2, 3, 5, 4];

const bet = (over: Partial<BetRow>): BetRow => ({
  id: Math.random().toString(36).slice(2),
  bet_type: "nopea",
  tier: "rohkea",
  lukitut: false,
  max_throws: 9,
  stake: 50,
  odds: 4.3,
  status: "open",
  payout: 0,
  ...over,
});

const BETS: BetRow[] = [
  bet({}),
  bet({ tier: "hullu", max_throws: 6, odds: 19.2, stake: 25, lukitut: true }),
  bet({ bet_type: "keskiarvo", tier: null, max_throws: 14, odds: 1.6, stake: 100 }),
];

const BOARD: DailyBoard = {
  gameDate: "2026-10-06",
  opening: OPENING,
  bettingDisabled: false,
  tierLines: computeTierLines(OPENING),
  personal: { keskiarvo: 14, ennatys: 7 },
  hasLicense: true,
  jackpot: { balance: 640, lastWin: { username: "Liisa", amount: 512, gameDate: "2026-09-28", throwsCount: 5 } },
  pot: { buyIn: 50, total: 150, entrants: [{ userId: "a", username: "Matti" }, { userId: "b", username: "Liisa" }, { userId: "c", username: "Jimmy" }], joined: false },
  myBets: BETS,
  reveals: [],
};

const noop = () => {};

const DICE_SKINS = ["default", "golden_dice", "diamond_dice", "german_supermarket_dice", "sauna_dice", "helldivers_dice", "sieni_dice"] as const satisfies readonly DiceSkin[];
const BACKGROUNDS = ["default", "casino_felt_bg", "starfield_bg"] as const satisfies readonly BackgroundStyle[];

const pickAllowed = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
  value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

/** The real GameBoard wired to the betting sheet with in-memory bets (no backend). */
const GamePreview = ({ skin = "default" }: { skin?: DiceSkin }) => {
  const opening = useMemo(() => getOpeningDice(helsinkiDate()), []);
  const [bettingOpen, setBettingOpen] = useState(false);
  const [bets, setBets] = useState<BetRow[]>(() => JSON.parse(sessionStorage.getItem("preview_bets") ?? "[]"));
  const [result, setResult] = useState<string | null>(null);

  const lockIn = (specs: BetSpec[]) => {
    const priced = priceSlip(specs, opening, { keskiarvo: 14, ennatys: 7 });
    if (priced.ok === false) return;
    const rows = priced.bets.map((b) =>
      bet({ bet_type: b.type, tier: b.tier, lukitut: b.lukitut, max_throws: b.maxThrows, stake: b.stake, odds: b.odds }),
    );
    sessionStorage.setItem("preview_bets", JSON.stringify(rows));
    setBets(rows);
    setBettingOpen(false);
  };

  return (
    <>
      <GameBoard
        userId="preview-user"
        hasPlayedToday={false}
        personalBest={7}
        activeSkin={skin}
        onGameComplete={(throws, winningNumber, _initial, _action, extras) =>
          setResult(JSON.stringify({ throws, winningNumber, logLength: extras.throwLog.length, firstIsOpening: extras.throwLog[0]?.join() === opening.join(), unlockedAny: extras.unlockedAny }))
        }
        bettingOpen={bettingOpen}
        lukitut={bets.some((b) => b.lukitut)}
        renderAboveDice={(progress) =>
          bets.length ? (
            <BetTracker bets={bets} inPot={false} progress={progress} />
          ) : (
            <AnimatePresence>
              {progress.throwCount === 1 && progress.lockedCount === 0 && (
                <BettingPromo key="promo" jackpot={640} onPlaceBets={() => setBettingOpen(true)} />
              )}
            </AnimatePresence>
          )
        }
      />
      {result && <pre data-testid="result" className="text-xs">{result}</pre>}
      <AnimatePresence>
        {bettingOpen && (
          <BettingSheet opening={opening} personal={{ keskiarvo: 14, ennatys: 7 }} balance={2480} jackpot={640} pot={BOARD.pot} isPlacing={false} onLockIn={lockIn} onSkip={() => setBettingOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

const CustomizePreview = () => {
  const [hidden, setHidden] = useState<string[]>(["mokki_plot"]);
  return (
    <CustomizationSection
      purchasedItems={["betting_license", "mokki_plot", "golden_dice", "sauna_dice"]}
      activeSkin="sauna_dice"
      activeActions={[]}
      activeThrowAnimation={null}
      activeBackground={null}
      onSkinChange={noop}
      onActionToggle={noop}
      onThrowAnimationChange={noop}
      onBackgroundChange={noop}
      hiddenFeatures={hidden}
      onFeatureToggle={(id) => setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]))}
    />
  );
};

const VedotPreview = () => {
  const [params] = useSearchParams();
  const view = params.get("view") ?? "sheet";
  const throws = Number(params.get("throws") ?? 7);
  const done = params.get("done") === "1";
  const skin = pickAllowed(params.get("skin"), DICE_SKINS, "default");
  const background = pickAllowed(params.get("bg"), BACKGROUNDS, "default");
  const bgClass = getBackgroundStyles(background);

  const progress = useMemo(
    () =>
      done
        ? { throwCount: throws, lockedCount: 10, showing: Array(10).fill(3), unlockedAny: false, complete: true, winningNumber: 3 }
        : { throwCount: throws, lockedCount: 8, showing: [3, 3, 3, 3, 3, 3, 3, 3, 5, 1], unlockedAny: false, complete: false, winningNumber: null },
    [throws, done],
  );

  return (
    <div className={cn("min-h-screen", bgClass || "bg-background", bgClass && "relative")}>
      {background === "starfield_bg" && <TwinkleStars />}
      <div className={cn("container relative z-[1] mx-auto max-w-lg space-y-4 px-4 py-6", bgClass && "text-white")}>
        <h1 className="text-center text-2xl font-bold">🎲 Kymppijape Daily</h1>
{view !== "game" && (
        <div className="grid grid-cols-5 justify-items-center gap-2 rounded-xl border bg-card p-4">
          {OPENING.map((v, i) => (
            <Dice key={i} value={v} isLocked={false} isRolling={false} onClick={noop} disabled />
          ))}
        </div>
        )}

        {view === "game" && <GamePreview skin={skin} />}
        {view === "customize" && <CustomizePreview />}
        {view === "promo" && <BettingPromo jackpot={640} onPlaceBets={noop} />}
        {view === "tracker" && <BetTracker bets={BETS} inPot progress={progress} />}
        {view === "stakes" && <DailyStakesCard board={BOARD} />}
        {view === "teaser" && <VedotTeaser board={BOARD} />}
      </div>

      {view === "sheet" && (
        <BettingSheet opening={OPENING} personal={BOARD.personal} balance={2480} jackpot={640} pot={BOARD.pot} isPlacing={false} onLockIn={noop} onSkip={noop} />
      )}
      {view === "stamp" && <PelattuStamp onDone={noop} />}
      {view === "shop" && (
        <ShopItemModal
          item={shopItems.find((i) => i.id === (params.get("item") ?? "betting_license")) ?? null}
          isOpen
          onClose={noop}
          isOwned={false}
          canAfford
          onPurchase={async () => ({ success: false })}
          isPurchasing={false}
          onPurchaseSuccess={noop}
        />
      )}
      {(view === "settlement" || view === "jackpot") && (
        <SettlementModal
          settlement={{
            bets: [bet({ status: "won", payout: 215 }), bet({ tier: "hullu", max_throws: 6, odds: 19.2, stake: 25, status: "lost" }), bet({ bet_type: "ennatys", tier: null, max_throws: 7, odds: 10.1, stake: 20, status: "won", payout: 202 })],
            jackpot: view === "jackpot" ? 640 : 0,
            newBalance: 2897,
          }}
          inPot
          onClose={noop}
        />
      )}
      {view === "reveal" && (
        <PottiRevealModal
          reveal={{
            gameDate: "2026-10-05",
            status: "settled",
            total: 200,
            winningThrows: 9,
            prizePerWinner: 180,
            entries: [
              { userId: "a", username: "Matti", throwsCount: 14, payout: 0, isMe: false },
              { userId: "b", username: "Liisa", throwsCount: 11, payout: 0, isMe: false },
              { userId: "me", username: "Tuomas", throwsCount: 9, payout: 180, isMe: true },
              { userId: "c", username: "Jimmy", throwsCount: null, payout: 0, isMe: false },
            ],
          }}
          onClose={noop}
        />
      )}
    </div>
  );
};

export default VedotPreview;

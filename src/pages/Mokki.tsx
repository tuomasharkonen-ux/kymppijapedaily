import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMokki } from "@/hooks/useMokki";
import { useBadges } from "@/hooks/useBadges";
import { useUserPurchases } from "@/hooks/useUserPurchases";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useGameRecords } from "@/hooks/useGameRecords";
import { saunaStatus } from "@/components/mokki/saunaStatus";
import { useLiveEnvironment } from "@/components/mokki/MokkiHero";
import { useScenePieces } from "@/components/mokki/useScenePieces";
import { BuildPanel } from "@/components/mokki/BuildPanel";
import { NeighborsSheet } from "@/components/mokki/NeighborsSheet";
import { MokkiPreview } from "@/components/mokki/MokkiPreview";
import { MokkiIllustration } from "@/components/mokki/MokkiIllustration";
import { hasWebGL } from "@/components/mokki/MokkiHeroView";
import { SkyBackdrop } from "@/components/mokki/SkyBackdrop";
import { playLoyly } from "@/components/mokki/mokkiSound";
import { ChoresTray } from "@/components/mokki/ChoresTray";
import { NeighborActions } from "@/components/mokki/NeighborActions";
import { InboxSheet } from "@/components/mokki/InboxSheet";
import { DogSheet } from "@/components/mokki/DogSheet";
import { DoorNoteSheet } from "@/components/mokki/DoorNoteSheet";
import { WalkButton } from "@/components/mokki/WalkButton";
import { walkActivities } from "@/components/mokki/walkActivities";
import { BadgeUnlockModal } from "@/components/BadgeUnlockModal";
import { choreCheck, neighborCheck, paljuGuestNames, sceneDog, sceneFlag } from "@/components/mokki/mokkiActions";
import { getActionDef, getPieceDef, REWARDS } from "@/lib/mokki";

const MokkiScene = lazy(() => import("@/components/mokki/scene/MokkiScene"));

const CenteredCard = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto max-w-lg px-4 py-10">
      <Card>
        <CardContent className="p-6 text-center">{children}</CardContent>
      </Card>
    </div>
  </div>
);

/** Full-screen mökki: build mode on your own island, visit mode on a friend's (/mokki/:userId). */
const Mokki = () => {
  const navigate = useNavigate();
  const { userId: visitId } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const ownerId = visitId ?? user?.id ?? null;
  const isOwn = !!user && ownerId === user.id;
  const env = useLiveEnvironment();
  const { data, isLoading, refetch, buyPiece, doAction, sendLoyly, markLoylySeen, markInboxSeen, leaveNote } = useMokki(ownerId, user?.id ?? null);
  const { userCredits, refetchBadges, checkAndAwardBadges, pendingBadges, dismissBadge } = useBadges(isOwn ? user?.id ?? null : null);
  const { purchasedItems } = useUserPurchases(isOwn ? user?.id ?? null : null);
  const { settings } = useUserSettings(isOwn ? user?.id ?? null : null);
  // Streaks are private (own game records only), so friends' islands keep the plain line
  const { currentStreak, streakNapped, hasPlayedToday, isLoading: recordsLoading, saveGameResult } = useGameRecords(isOwn ? user?.id ?? null : null);
  const { pieces, onPieceLanded } = useScenePieces(ownerId, data.pieces, data.gamesPlayed, isOwn);
  const [loylyKey, setLoylyKey] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [neighborsOpen, setNeighborsOpen] = useState(false);
  const [dogOpen, setDogOpen] = useState(false);
  // First-person walk around the island (own or a neighbor's)
  const [walking, setWalking] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [inboxOpen, setInboxOpen] = useState(() => searchParams.get("mail") === "1");
  const webgl = useMemo(() => hasWebGL(), []);
  const dog = useMemo(() => sceneDog(data.pieces, data.gamesPlayed), [data.pieces, data.gamesPlayed]);
  const effects = useMemo(() => data.effects.map((e) => ({ id: e.id, actionId: e.actionId })), [data.effects]);
  const paljuGuests = useMemo(() => paljuGuestNames(data), [data]);

  useEffect(() => setWalking(false), [ownerId]);

  // Today's Kymppijape on the porch table (walk mode): same saved game and same save as the main board
  const activeSkin = settings.activeSkin ?? "default";
  const porchGame = useMemo(
    () =>
      isOwn && user && !recordsLoading && !hasPlayedToday
        ? {
            userId: user.id,
            onComplete: async (throws: number, winningNumber: number, extras: { throwLog: number[][]; unlockedAny: boolean }) => {
              const saved = await saveGameResult(throws, winningNumber, extras);
              toast.success(`🎲 Today's Kymppijape done in ${throws} ${throws === 1 ? "throw" : "throws"}!`);
              if (saved?.settlement) toast("🎰 Your bets were settled, see the main board for details");
              refetchBadges();
              checkAndAwardBadges(false, activeSkin);
              refetch();
            },
          }
        : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOwn, user?.id, recordsLoading, hasPlayedToday, activeSkin],
  );

  // Received löyly: puff on arrival, then mark seen
  useEffect(() => {
    if (!isOwn || data.loylyFrom.length === 0) return;
    toast(`💨 ${data.loylyFrom.join(", ")} sent you löyly!`);
    const t = setTimeout(() => {
      setLoylyKey((k) => k + 1);
      playLoyly();
      markLoylySeen();
    }, 800);
    return () => clearTimeout(t);
  }, [isOwn, data.loylyFrom, markLoylySeen]);

  const handleBuy = async (pieceId: string, dogChoice?: { breed: string; name: string }) => {
    const res = await buyPiece(pieceId, dogChoice);
    if (!res.success) {
      toast.error(res.error ?? "Building failed");
      return false;
    }
    const piece = getPieceDef(pieceId);
    toast.success(`🔨 Builders are on ${piece?.name ?? "it"}! Play to finish it.`);
    refetchBadges();
    return true;
  };

  // The mailbox: closing it marks everything read; ?mail=1 (from the home screen) opens it
  const setInbox = (open: boolean) => {
    setInboxOpen(open);
    if (open) return;
    if (data.inbox.length > 0) markInboxSeen();
    if (searchParams.has("mail")) {
      searchParams.delete("mail");
      setSearchParams(searchParams, { replace: true });
    }
  };

  const handleEffectClick = async (effectId: string) => {
    const effect = data.effects.find((e) => e.id === effectId);
    if (!isOwn) {
      toast(`${effect?.fromName ?? "Someone"} did this 😈`);
      return;
    }
    const res = await doAction("cleanup", { effectId });
    if (!res.success) {
      toast.error(res.error ?? "Couldn't clean up");
      return;
    }
    toast.success(`🧹 All clean! +${REWARDS.cleanup} cr siivouspalkkio`);
    refetchBadges();
  };

  const handleDogClick = () => {
    if (isOwn) setDogOpen(true);
    else if (dog) toast(`🐕 Hau! ${dog.name} says hi`);
  };

  // Walk mode: the same chores / visits / pranks as the bottom bars, done by tapping markers in the world
  const runWalkActivity = async (id: string): Promise<string> => {
    if (id === "loyly") {
      const res = await sendLoyly();
      if (!res.success) throw new Error(res.error ?? "Couldn't send löyly");
      if (res.error) return "💨 You already sent löyly today";
      setLoylyKey((k) => k + 1);
      playLoyly();
      return `💨 Löyly sent to ${data.ownerName ?? "your friend"}!`;
    }
    const def = getActionDef(id);
    if (!def) throw new Error("Unknown activity");
    const check = isOwn ? choreCheck(def, data) : neighborCheck(def, data);
    if (check.ok === false) return `🔒 ${check.reason}`;
    const res = await doAction(id);
    if (!res.success || !res.outcome) throw new Error(res.error ?? "Something went wrong");
    const { reward, label, foiled } = res.outcome;
    if (reward > 0) refetchBadges();
    if (foiled) return `🐕 ${dog?.name ?? "Their dog"} caught you! Busted.`;
    if (isOwn) return reward > 0 ? `+${reward} cr · ${label}` : label;
    return `${def.emoji} ${def.name}!${reward > 0 ? ` +${reward} cr` : ""}`;
  };
  const walkActs = useMemo(() => ({ activities: walkActivities(data, isOwn), onRun: runWalkActivity }), [data, isOwn]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendLoyly = async () => {
    const res = await sendLoyly();
    if (!res.success) {
      toast.error(res.error ?? "Couldn't send löyly");
      return;
    }
    setLoylyKey((k) => k + 1);
    playLoyly();
    toast.success(res.error ? "You already sent löyly today" : `💨 Löyly sent to ${data.ownerName ?? "your friend"}!`);
  };

  if (authLoading || (isLoading && !!ownerId)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" role="status">
        <div className="animate-pulse text-4xl" aria-hidden="true">🏡</div>
        <span className="sr-only">Loading mökki...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <CenteredCard>
        <div className="mb-4 text-6xl" aria-hidden="true">🔒</div>
        <h2 className="mb-2 text-xl font-semibold">Login Required</h2>
        <p className="mb-4 text-muted-foreground">Log in to visit the mökki.</p>
        <Button asChild>
          <Link to="/">Go to Home</Link>
        </Button>
      </CenteredCard>
    );
  }

  if (!data.ownsPlot) {
    return isOwn ? (
      <CenteredCard>
        <div className="mb-4 flex justify-center">
          <MokkiPreview />
        </div>
        <h2 className="mb-2 text-xl font-semibold">Every Finn deserves a mökki</h2>
        <p className="mb-4 text-muted-foreground">
          Buy a Mökkitontti in the shop to get your own little island — then build a sauna, a laituri and more.
        </p>
        <Button asChild>
          <Link to="/shop">Visit the shop</Link>
        </Button>
      </CenteredCard>
    ) : (
      <CenteredCard>
        <div className="mb-4 text-6xl" aria-hidden="true">🌲</div>
        <h2 className="mb-2 text-xl font-semibold">No mökki here yet</h2>
        <p className="mb-4 text-muted-foreground">{data.ownerName ?? "This player"} hasn't bought a Mökkitontti.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </CenteredCard>
    );
  }

  const title = `${data.ownerName ?? (isOwn ? "Your" : "Friend")}'s mökki`;

  const visitNeighbor = (userId: string) => {
    setNeighborsOpen(false);
    // Hopping between neighbors replaces the entry so Back still returns home
    navigate(`/mokki/${userId}`, { replace: !isOwn });
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background">
      <div className="absolute inset-0">
        {webgl ? (
          <Suspense fallback={<SkyBackdrop env={env} />}>
            <MokkiScene
              env={env}
              pieces={pieces}
              showSmoke={data.playedToday}
              loylyKey={loylyKey}
              mushrooms={isOwn && purchasedItems.includes("sieni_dice")}
              skin={isOwn ? settings.activeSkin ?? "default" : "default"}
              mode="full"
              porch={isOwn ? { hasMail: data.inbox.length > 0, potTotal: null, onMailboxClick: () => setInbox(true) } : undefined}
              onPieceLanded={onPieceLanded}
              dog={dog}
              flag={sceneFlag(data.pieces)}
              effects={effects}
              paljuGuests={paljuGuests}
              onDogClick={dog ? handleDogClick : undefined}
              onEffectClick={handleEffectClick}
              firstPerson={walking}
              visit={isOwn ? undefined : { onNotepad: () => setNoteOpen(true), notes: data.myNotes.length }}
              porchGame={porchGame}
              walkActivities={walkActs}
              onExitFirstPerson={() => setWalking(false)}
            />
          </Suspense>
        ) : (
          <div className="absolute inset-0">
            <SkyBackdrop env={env} />
            <MokkiIllustration className="absolute inset-x-0 top-1/4 mx-auto w-full max-w-xl" />
          </div>
        )}
      </div>

      {/* Top bar */}
      {walking ? (
        <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3">
          <Button
            size="sm"
            className="pointer-events-auto bg-white text-slate-900 shadow-md ring-1 ring-black/10 hover:bg-slate-100"
            onClick={() => setWalking(false)}
          >
            <X className="mr-1 h-4 w-4" aria-hidden="true" />
            Stop walking
          </Button>
          <div className="truncate rounded-full bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">{title}</div>
        </header>
      ) : (
        <>
          <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3">
            <Button
              size="sm"
              className="pointer-events-auto bg-white text-slate-900 shadow-md ring-1 ring-black/10 hover:bg-slate-100"
              onClick={() => (isOwn ? navigate("/") : navigate(-1))}
            >
              <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
              {isOwn ? "Back to Game" : "Back"}
            </Button>
            <Button
              size="sm"
              className="pointer-events-auto bg-white text-slate-900 shadow-md ring-1 ring-black/10 hover:bg-slate-100"
              onClick={() => setNeighborsOpen(true)}
            >
              <span aria-hidden="true" className="mr-1">🏘️</span>
              Visit neighbors
            </Button>
          </header>

          {/* Floating title above the island */}
          <div className="pointer-events-none absolute inset-x-0 top-14 z-10 flex justify-center px-4">
            <div className="max-w-full rounded-2xl bg-black/45 px-4 py-1.5 text-center text-white backdrop-blur-sm">
              <h1 className="truncate font-display text-lg font-bold leading-tight drop-shadow">{title}</h1>
              <p className="text-[11px] text-white/85">
                {isOwn ? saunaStatus(data.playedToday, currentStreak, streakNapped) : data.playedToday ? "♨️ Sauna is warm today" : "🪵 Stove is cold today"} · {data.gamesPlayed} days played
              </p>
            </div>
          </div>

          {/* Walk mode: the main call to action, right under the title */}
          {webgl && (
            <div className="pointer-events-none absolute inset-x-0 top-[7.5rem] z-10 flex justify-center px-4">
              <WalkButton
                onClick={() => {
                  setPanelOpen(false);
                  setWalking(true);
                  if (porchGame) toast("🎲 Today's Kymppijape is waiting on the porch table");
                }}
              />
            </div>
          )}
        </>
      )}

      <NeighborsSheet
        open={neighborsOpen}
        onOpenChange={setNeighborsOpen}
        viewerId={user.id}
        currentOwnerId={ownerId}
        onVisit={visitNeighbor}
      />

      {isOwn ? (
        <>
          {!panelOpen && !walking && <ChoresTray data={data} onDo={doAction} onRewarded={refetchBadges} className="absolute inset-x-0 bottom-[5.25rem] z-10" />}
          {!walking && <BuildPanel owned={data.pieces} gamesPlayed={data.gamesPlayed} credits={userCredits} onBuy={handleBuy} open={panelOpen} onOpenChange={setPanelOpen} />}
          <InboxSheet open={inboxOpen} onOpenChange={setInbox} items={data.inbox} onMarkRead={() => setInbox(false)} />
          <BadgeUnlockModal pendingBadges={pendingBadges} onDismiss={dismissBadge} />
          {dog && <DogSheet open={dogOpen} onOpenChange={setDogOpen} data={data} onDo={doAction} onRewarded={refetchBadges} />}
        </>
      ) : (
        <>
          {!walking && <NeighborActions data={data} onDo={doAction} onSendLoyly={handleSendLoyly} onRewarded={refetchBadges} />}
          <DoorNoteSheet open={noteOpen} onOpenChange={setNoteOpen} ownerName={data.ownerName} myNotes={data.myNotes} onLeave={leaveNote} />
        </>
      )}
    </div>
  );
};

export default Mokki;

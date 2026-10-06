import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMokki } from "@/hooks/useMokki";
import { useBadges } from "@/hooks/useBadges";
import { useUserPurchases } from "@/hooks/useUserPurchases";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useLiveEnvironment } from "@/components/mokki/MokkiHero";
import { useScenePieces } from "@/components/mokki/useScenePieces";
import { BuildPanel } from "@/components/mokki/BuildPanel";
import { MokkiPreview } from "@/components/mokki/MokkiPreview";
import { MokkiIllustration } from "@/components/mokki/MokkiIllustration";
import { hasWebGL } from "@/components/mokki/MokkiHeroView";
import { SkyBackdrop } from "@/components/mokki/SkyBackdrop";
import { playLoyly } from "@/components/mokki/mokkiSound";
import { getPieceDef } from "@/lib/mokki";

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
  const { data, isLoading, buyPiece, sendLoyly, markLoylySeen } = useMokki(ownerId, user?.id ?? null);
  const { userCredits, refetchBadges } = useBadges(isOwn ? user?.id ?? null : null);
  const { purchasedItems } = useUserPurchases(isOwn ? user?.id ?? null : null);
  const { settings } = useUserSettings(isOwn ? user?.id ?? null : null);
  const { pieces, onPieceLanded } = useScenePieces(ownerId, data.pieces, data.gamesPlayed, isOwn);
  const [loylyKey, setLoylyKey] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const webgl = useMemo(() => hasWebGL(), []);

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

  const handleBuy = async (pieceId: string) => {
    const res = await buyPiece(pieceId);
    if (!res.success) {
      toast.error(res.error ?? "Building failed");
      return false;
    }
    const piece = getPieceDef(pieceId);
    toast.success(`🔨 Builders are on ${piece?.name ?? "it"}! Play to finish it.`);
    refetchBadges();
    return true;
  };

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

  const title = isOwn ? "Your mökki" : `${data.ownerName ?? "Friend"}'s mökki`;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background">
      {/* Scene shrinks above the build panel while it's open */}
      <div className={`absolute inset-x-0 top-0 ${isOwn && panelOpen ? "h-[42dvh]" : "h-full"}`}>
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
              porch={isOwn ? { hasMail: false, potTotal: null } : undefined}
              onPieceLanded={onPieceLanded}
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
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3">
        <Button
          size="sm"
          className="pointer-events-auto bg-white text-slate-900 shadow-md ring-1 ring-black/10 hover:bg-slate-100"
          onClick={() => (isOwn ? navigate("/") : navigate(-1))}
        >
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          {isOwn ? "Back to Game" : "Back"}
        </Button>
        <div className="rounded-2xl bg-black/55 px-3 py-1.5 text-right text-white backdrop-blur">
          <h1 className="text-base font-bold leading-tight">🏡 {title}</h1>
          <p className="text-[11px] text-white/90">
            {data.playedToday ? "♨️ Sauna is warm today" : "🪵 Stove is cold today"} · {data.gamesPlayed} days played
          </p>
        </div>
      </header>

      {isOwn ? (
        <BuildPanel owned={data.pieces} gamesPlayed={data.gamesPlayed} credits={userCredits} onBuy={handleBuy} open={panelOpen} onOpenChange={setPanelOpen} />
      ) : (
        <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center p-4">
          <Button size="lg" className="shadow-xl" disabled={data.loylySentToday} onClick={handleSendLoyly}>
            {data.loylySentToday ? "💨 Löyly sent today" : "Send löyly 💨"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Mokki;

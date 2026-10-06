import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GameBoard, type GameExtras } from "@/components/GameBoard";
import { ResultsPanel } from "@/components/ResultsPanel";
import { PracticeMode } from "@/components/PracticeMode";
import { BadgesSection } from "@/components/BadgesSection";
import { BadgeUnlockModal } from "@/components/BadgeUnlockModal";
import { DiceProShopCard } from "@/components/DiceProShopCard";
import { CustomizationSection } from "@/components/CustomizationSection";
import { TwinkleStars } from "@/components/TwinkleStars";
import { type ThrowAnimationStyle, type BackgroundStyle, getBackgroundStyles } from "@/lib/animations";
import { useGameRecords } from "@/hooks/useGameRecords";
import { useBadges } from "@/hooks/useBadges";
import { useUserPurchases } from "@/hooks/useUserPurchases";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useProfile } from "@/hooks/useProfile";
import { UsernamePromptModal } from "@/components/UsernamePromptModal";
import { SaunaDicePromoModal, getSaunaDicePromoShouldShow, markSaunaDicePromoShown } from "@/components/SaunaDicePromoModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "sonner";
import { Menu, LogOut, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { DiceSkin } from "@/components/Dice";
import { useDailyBoard } from "@/hooks/useDailyBoard";
import { BETTING_LICENSE_ID, MOKKI_PLOT_ID, type BetSpec, helsinkiDate } from "@/lib/kymppijape";
import { loadGame, updateSavedGame } from "@/lib/gameState";
import type { Settlement } from "@/lib/vedot";
import { BettingSheet } from "@/components/vedot/BettingSheet";
import { BetTracker } from "@/components/vedot/BetTracker";
import { PelattuStamp } from "@/components/vedot/PelattuStamp";
import { SettlementModal } from "@/components/vedot/SettlementModal";
import { PottiRevealModal } from "@/components/vedot/PottiRevealModal";
import { DailyStakesCard, VedotTeaser } from "@/components/vedot/DailyStakesCard";
import { MokkiHero } from "@/components/mokki/MokkiHero";
const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showCopied, setShowCopied] = useState(false);
  const [showPracticeMode, setShowPracticeMode] = useState(false);
  const [justCompletedGame, setJustCompletedGame] = useState(false);
  const [isVictoryAnimating, setIsVictoryAnimating] = useState(false);
  const {
    todayResult,
    personalBest,
    personalWorst,
    averageThrows,
    previousAverage,
    favoriteNumber,
    currentStreak,
    rankByAverage,
    rankByBest,
    totalPlayers,
    gamesPlayed,
    isLoading,
    hasPlayedToday,
    saveGameResult
  } = useGameRecords(user?.id || null);
  const {
    userBadges,
    userCredits,
    isLoading: badgesLoading,
    checkAndAwardBadges,
    checkShareFeature,
    pendingBadges,
    dismissBadge,
    refetchBadges
  } = useBadges(user?.id || null);
  const {
    purchasedItems,
    isLoading: purchasesLoading,
  } = useUserPurchases(user?.id || null);
  const {
    settings,
    isLoading: settingsLoading,
    updateSkin,
    toggleAction,
    updateThrowAnimation,
    updateBackground,
  } = useUserSettings(user?.id || null);

  // Profile hook for username
  const {
    profile,
    isLoading: profileLoading,
    updateUsername,
  } = useProfile(user?.id || null);

  // Bets, Pot of the Day & Jackpot (unlocked with the Betting License)
  const {
    board,
    isLoading: boardLoading,
    isPlacing,
    placeBets,
    applySettlement,
    markRevealSeen,
  } = useDailyBoard(user?.id || null);
  const hasLicense = purchasedItems.includes(BETTING_LICENSE_ID);
  const hasMokki = purchasedItems.includes(MOKKI_PLOT_ID);
  const [openingRevealed, setOpeningRevealed] = useState(false);
  const [bettingClosed, setBettingClosed] = useState(false);
  const [bettingOpen, setBettingOpen] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const [pendingSettlement, setPendingSettlement] = useState<Settlement | null>(null);
  const [showSettlement, setShowSettlement] = useState(false);
  const [revealOpen, setRevealOpen] = useState(false);
  const reveal = board?.reveals[0] ?? null;
  const hasBetsToday = !!board && (board.myBets.length > 0 || board.pot.joined);
  const lukitutActive = !!board?.myBets.some((b) => b.lukitut && b.status === "open");
  // Hold the dice while the board is still loading so bets can't follow a lock
  const bettingPending = openingRevealed && !bettingClosed && (purchasesLoading || (hasLicense && boardLoading));
  const gameInProgress = !!user && (loadGame(user.id, helsinkiDate())?.throwCount ?? 0) > 0;

  const handleOpeningRevealed = useCallback(() => {
    if (user && loadGame(user.id, helsinkiDate())?.bettingClosed) {
      setBettingClosed(true);
    }
    setOpeningRevealed(true);
  }, [user]);

  // Offer bets once the opening is on the table, but never after the first lock or re-roll
  useEffect(() => {
    if (!user || !openingRevealed || bettingClosed || !hasLicense || !board || board.bettingDisabled || hasBetsToday) return;
    const saved = loadGame(user.id, helsinkiDate());
    if (saved && (saved.throwCount > 1 || saved.dice.some((d) => d.isLocked))) return;
    setBettingOpen(true);
  }, [user, openingRevealed, bettingClosed, hasLicense, board, hasBetsToday]);

  const closeBetting = () => {
    setBettingOpen(false);
    setBettingClosed(true);
    if (user) updateSavedGame(user.id, helsinkiDate(), { bettingClosed: true });
  };

  const handleLockIn = async (bets: BetSpec[], joinPot: boolean) => {
    const result = await placeBets(bets, joinPot);
    if (result.ok === false) {
      toast.error(result.error);
      return;
    }
    closeBetting();
    setShowStamp(true);
    refetchBadges();
  };

  const handleStampDone = useCallback(() => setShowStamp(false), []);

  // Show bet results once any victory cinematic has finished
  useEffect(() => {
    if (pendingSettlement && !isVictoryAnimating) {
      const timer = setTimeout(() => setShowSettlement(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [pendingSettlement, isVictoryAnimating]);

  // Yesterday's pot: pops up on its own, or waits in the mökki mailbox
  useEffect(() => {
    if (!reveal) return;
    if (hasMokki) {
      toast("📬 Yesterday's Pot results are in your mailbox");
    } else {
      setRevealOpen(true);
    }
  }, [reveal?.gameDate, hasMokki]); // eslint-disable-line react-hooks/exhaustive-deps

  const closeReveal = () => {
    setRevealOpen(false);
    if (reveal) markRevealSeen(reveal.gameDate);
    refetchBadges();
  };

  // Show username prompt for logged-in users without a profile
  const showUsernamePrompt = !!user && !profileLoading && !profile;

  // Sauna Dice promo — shown once to logged-in users on/after 2026-03-30
  const [showSaunaPromo, setShowSaunaPromo] = useState(false);
  useEffect(() => {
    if (user && getSaunaDicePromoShouldShow()) {
      setShowSaunaPromo(true);
      markSaunaDicePromoShown();
    }
  }, [user]);

  // Get the active skin as DiceSkin type
  const activeSkin: DiceSkin = (settings.activeSkin as DiceSkin) || "default";
  const activeThrowAnimation: ThrowAnimationStyle = (settings.activeThrowAnimation as ThrowAnimationStyle) || "default";
  const activeBackground: BackgroundStyle = (settings.activeBackground as BackgroundStyle) || "default";
  const copyResultToClipboard = async () => {
    if (!todayResult) return;
    const today = format(new Date(), "dd.MM.yyyy");
    const diceEmojis = "🎲".repeat(todayResult.throws_count);
    const bestScore = personalBest && personalBest < todayResult.throws_count ? personalBest : todayResult.throws_count;
    
    // Build average line with movement indicator
    let averageLine = "";
    if (averageThrows !== null) {
      averageLine = `Average: ${averageThrows}`;
      if (previousAverage !== null) {
        const diff = averageThrows - previousAverage;
        if (diff !== 0) {
          const arrow = diff < 0 ? '↓' : '↑';
          const absDiff = Math.abs(diff).toFixed(1);
          averageLine += ` (${arrow}${absDiff})`;
        }
      }
    }
    
    const shareText = `Kymppijape daily ${today}
Throws today: ${todayResult.throws_count}
${diceEmojis}
 Personal best: ${bestScore}${averageLine ? `\n${averageLine}` : ""}
 
 kymppijape.com`;
    try {
      await navigator.clipboard.writeText(shareText);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);

      // Check for share feature badge
      await checkShareFeature();
    } catch {
      toast.error("Failed to copy");
    }
  };
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);
  const handleGameComplete = async (throws: number, winningNumber: number, _initialDice: number[], usedAction: boolean, extras: GameExtras) => {
    setJustCompletedGame(true);
    if (settings?.activeSkin === "helldivers_dice" || settings?.activeSkin === "sieni_dice") {
      setIsVictoryAnimating(true);
    }

    // Save game first (required before badge check can verify); this also settles bets
    const saved = await saveGameResult(throws, winningNumber, extras);
    if (saved?.settlement) {
      applySettlement(saved.settlement);
      setPendingSettlement(saved.settlement);
      refetchBadges();
    }

    // Check badges immediately after save - don't wait for fetchRecords
    checkAndAwardBadges(usedAction, activeSkin);
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };
  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-label="Loading game">
        <div className="animate-pulse text-4xl" aria-hidden="true">🎲</div>
        <span className="sr-only">Loading game...</span>
      </div>;
  }
  const hasPremiumBg = activeBackground !== "default";
  const bgClass = getBackgroundStyles(activeBackground);
  const textClass = hasPremiumBg ? "text-white" : "";

  return <div className={`min-h-screen ${hasPremiumBg ? bgClass : "bg-background"}`}>
      {activeBackground === "starfield_bg" && <TwinkleStars />}
      <div className={`container max-w-lg mx-auto px-4 py-6 md:py-10 ${textClass}`}>
        <header className="text-center mb-6 md:mb-8">
          <h1 className={`text-3xl md:text-4xl font-bold mb-1 ${hasPremiumBg ? "text-white" : "text-foreground"}`}>
            <span aria-hidden="true">🎲</span> Kymppijape Daily
          </h1>
          <p className={hasPremiumBg ? "text-white/70" : "text-muted-foreground"}>
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
          {user && <div className="mt-2 flex items-center justify-center gap-2">
              <span className={`text-sm ${hasPremiumBg ? "text-white/70" : "text-muted-foreground"}`}>{user.email}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" aria-label="User menu">
                    <Menu className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>}
        </header>

        {user && hasMokki && !showPracticeMode && (
          <div className="mb-6">
            <MokkiHero
              userId={user.id}
              hasPlayedToday={hasPlayedToday || justCompletedGame}
              activeSkin={activeSkin}
              purchasedItems={purchasedItems}
              hasMail={!!reveal}
              onMailboxClick={() => (reveal ? setRevealOpen(true) : toast("📭 No mail today"))}
              potTotal={hasLicense ? board?.pot.total ?? 0 : null}
              onKiuluClick={() =>
                toast(`♨️ Pot of the Day: ${board?.pot.total ?? 0} cr, ${board?.pot.entrants.length ?? 0} in`, {
                  description: board?.pot.joined ? "You're in! Results after midnight." : "Join after throwing your opening.",
                })
              }
              onNoticeBoardClick={() => navigate("/badges")}
            />
          </div>
        )}

        {!user ? <PracticeMode /> : showPracticeMode ? <div className="space-y-6">
            <div className="text-center">
              <Button variant="link" onClick={() => setShowPracticeMode(false)} className="text-muted-foreground">
                ← Back to Daily Game
              </Button>
            </div>
            <PracticeMode isLoggedIn activeSkin={activeSkin} purchasedItems={purchasedItems} activeActions={settings.activeActions} />
          </div> : <div className="space-y-6">
            {hasPlayedToday && !justCompletedGame ? <>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-6xl mb-4" aria-hidden="true">👋</div>
                    <h2 className="text-xl font-semibold mb-2">Come back tomorrow!</h2>
                    <p className="text-muted-foreground mb-4">
                      You've already played today's Kymppijape. New game unlocks at midnight!
                    </p>
                    <Button onClick={copyResultToClipboard} size="lg" className="w-full" variant={showCopied ? "secondary" : "default"}>
                      {showCopied ? "✓ Copied to clipboard!" : <><span aria-hidden="true">📋</span> Share Result with Friends</>}
                    </Button>
                    <div className="mt-4">
                      <Button variant="outline" onClick={() => setShowPracticeMode(true)} aria-label="Play Practice Mode" className="w-full">
                        <span aria-hidden="true">🎯</span> Play Practice Mode
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <ResultsPanel todayResult={todayResult} personalBest={personalBest} personalWorst={personalWorst} averageThrows={averageThrows} favoriteNumber={favoriteNumber} currentStreak={currentStreak} rankByAverage={rankByAverage} rankByBest={rankByBest} totalPlayers={totalPlayers} gamesPlayed={gamesPlayed} isLoading={isLoading} />

                {hasLicense && board && <DailyStakesCard board={board} />}
                {!hasLicense && board && gamesPlayed >= 3 && <VedotTeaser board={board} />}

                <BadgesSection userBadges={userBadges} isLoading={badgesLoading} userCredits={userCredits} />
                
                <DiceProShopCard userCredits={userCredits} />

                <CustomizationSection
                  purchasedItems={purchasedItems}
                  activeSkin={settings.activeSkin}
                  activeActions={settings.activeActions}
                  activeThrowAnimation={settings.activeThrowAnimation}
                  activeBackground={settings.activeBackground}
                  onSkinChange={updateSkin}
                  onActionToggle={toggleAction}
                  onThrowAnimationChange={updateThrowAnimation}
                  onBackgroundChange={updateBackground}
                  isLoading={purchasesLoading || settingsLoading}
                />
              </> : <>
                {hasLicense && board && !openingRevealed && !gameInProgress && !justCompletedGame && <DailyStakesCard board={board} />}
                {!hasLicense && board && gamesPlayed >= 3 && !justCompletedGame && <VedotTeaser board={board} />}

                <GameBoard
                  onGameComplete={handleGameComplete}
                  hasPlayedToday={hasPlayedToday}
                  personalBest={personalBest}
                  userId={user.id}
                  onShareClick={checkShareFeature}
                  activeSkin={activeSkin}
                  purchasedItems={purchasedItems}
                  activeActions={settings.activeActions}
                  activeThrowAnimation={activeThrowAnimation}
                  activeBackground={activeBackground}
                  onCopyResult={copyResultToClipboard}
                  isStatsLoading={isLoading}
                  showCopied={showCopied}
                  onVictoryAnimationEnd={() => setIsVictoryAnimating(false)}
                  bettingOpen={bettingOpen || bettingPending}
                  onOpeningRevealed={handleOpeningRevealed}
                  lukitut={lukitutActive}
                  renderAboveDice={(progress) =>
                    board && hasBetsToday ? <BetTracker bets={board.myBets} inPot={board.pot.joined} progress={progress} /> : null
                  }
                />
                
                <ResultsPanel todayResult={todayResult} personalBest={personalBest} personalWorst={personalWorst} averageThrows={averageThrows} favoriteNumber={favoriteNumber} currentStreak={currentStreak} rankByAverage={rankByAverage} rankByBest={rankByBest} totalPlayers={totalPlayers} gamesPlayed={gamesPlayed} isLoading={isLoading} />

                <BadgesSection userBadges={userBadges} isLoading={badgesLoading} userCredits={userCredits} />

                <DiceProShopCard userCredits={userCredits} />

                <CustomizationSection
                  purchasedItems={purchasedItems}
                  activeSkin={settings.activeSkin}
                  activeActions={settings.activeActions}
                  activeThrowAnimation={settings.activeThrowAnimation}
                  activeBackground={settings.activeBackground}
                  onSkinChange={updateSkin}
                  onActionToggle={toggleAction}
                  onThrowAnimationChange={updateThrowAnimation}
                  onBackgroundChange={updateBackground}
                  isLoading={purchasesLoading || settingsLoading}
                />

                <footer className={`text-center text-sm ${hasPremiumBg ? "text-white/70" : "text-muted-foreground"}`}>
                  <p>Lock all 10 dice on the same number to win!</p>
                  <p className="mt-1">New game available every day at midnight.</p>
                </footer>
              </>}
          </div>}

        {/* Badge unlock modal (after any bet settlement) */}
        {!isVictoryAnimating && !showSettlement && !pendingSettlement && <BadgeUnlockModal pendingBadges={pendingBadges} onDismiss={dismissBadge} />}

        {/* Bets & Pot of the Day */}
        <AnimatePresence>
          {bettingOpen && board && (
            <BettingSheet
              key="betting-sheet"
              opening={board.opening}
              personal={board.personal}
              balance={userCredits}
              jackpot={board.jackpot.balance}
              pot={board.pot}
              isPlacing={isPlacing}
              onLockIn={handleLockIn}
              onSkip={closeBetting}
            />
          )}
          {showStamp && <PelattuStamp key="stamp" onDone={handleStampDone} />}
          {showSettlement && pendingSettlement && (
            <SettlementModal
              key="settlement"
              settlement={pendingSettlement}
              inPot={!!board?.pot.joined}
              onClose={() => {
                setShowSettlement(false);
                setPendingSettlement(null);
              }}
            />
          )}
          {revealOpen && reveal && <PottiRevealModal key={`reveal-${reveal.gameDate}`} reveal={reveal} onClose={closeReveal} />}
        </AnimatePresence>

        {/* Sauna Dice promotional popup */}
        <SaunaDicePromoModal open={showSaunaPromo} onClose={() => setShowSaunaPromo(false)} />

        {/* Username prompt for new users */}
        <UsernamePromptModal
          isOpen={showUsernamePrompt}
          onComplete={updateUsername}
        />

        {/* Footer with Terms link */}
        <footer className={`mt-8 pt-4 border-t text-center text-xs ${hasPremiumBg ? "text-white/70 border-white/20" : "text-muted-foreground"}`}>
          <Link to="/terms" className="hover:underline">Terms and Conditions</Link>
        </footer>
      </div>
    </div>;
};
export default Index;
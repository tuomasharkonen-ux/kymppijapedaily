import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GameBoard } from "@/components/GameBoard";
import { ResultsPanel } from "@/components/ResultsPanel";
import { PracticeMode } from "@/components/PracticeMode";
import { BadgesSection } from "@/components/BadgesSection";
import { BadgeUnlockModal } from "@/components/BadgeUnlockModal";
import { DiceProShopCard } from "@/components/DiceProShopCard";
import { CustomizationSection } from "@/components/CustomizationSection";
import { type ThrowAnimationStyle, type BackgroundStyle, getBackgroundStyles } from "@/lib/animations";
import { useGameRecords } from "@/hooks/useGameRecords";
import { useBadges } from "@/hooks/useBadges";
import { useUserPurchases } from "@/hooks/useUserPurchases";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useProfile } from "@/hooks/useProfile";
import { UsernamePromptModal } from "@/components/UsernamePromptModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "sonner";
import { Menu, LogOut, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { DiceSkin } from "@/components/Dice";
const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showCopied, setShowCopied] = useState(false);
  const [showPracticeMode, setShowPracticeMode] = useState(false);
  const [justCompletedGame, setJustCompletedGame] = useState(false);
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
    dismissBadge
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

  // Show username prompt for logged-in users without a profile
  const showUsernamePrompt = !!user && !profileLoading && !profile;

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
  const handleGameComplete = async (throws: number, winningNumber: number, _initialDice: number[], usedAction: boolean) => {
    setJustCompletedGame(true);
    
    // Save game first (required before badge check can verify)
    await saveGameResult(throws, winningNumber);
    
    // Check badges immediately after save - don't wait for fetchRecords
    checkAndAwardBadges(usedAction);
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
      <div className={`container max-w-lg mx-auto px-4 py-6 md:py-10 ${textClass}`}>
        <header className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
            <span aria-hidden="true">🎲</span> Kymppijape Daily
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
          {user && <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">{user.email}</span>
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
                <GameBoard onGameComplete={handleGameComplete} hasPlayedToday={hasPlayedToday} personalBest={personalBest} userId={user.id} onShareClick={checkShareFeature} activeSkin={activeSkin} purchasedItems={purchasedItems} activeActions={settings.activeActions} activeThrowAnimation={activeThrowAnimation} activeBackground={activeBackground} onCopyResult={copyResultToClipboard} isStatsLoading={isLoading} showCopied={showCopied} />
                
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

                <footer className="text-center text-sm text-muted-foreground">
                  <p>Lock all 10 dice on the same number to win!</p>
                  <p className="mt-1">New game available every day at midnight.</p>
                </footer>
              </>}
          </div>}

        {/* Badge unlock modal */}
        <BadgeUnlockModal pendingBadges={pendingBadges} onDismiss={dismissBadge} />

        {/* Username prompt for new users */}
        <UsernamePromptModal
          isOpen={showUsernamePrompt}
          onComplete={updateUsername}
        />

        {/* Footer with Terms link */}
        <footer className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
          <Link to="/terms" className="hover:underline">Terms and Conditions</Link>
        </footer>
      </div>
    </div>;
};
export default Index;
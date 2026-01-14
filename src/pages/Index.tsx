import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GameBoard } from "@/components/GameBoard";
import { ResultsPanel } from "@/components/ResultsPanel";
import { PracticeMode } from "@/components/PracticeMode";
import { useGameRecords } from "@/hooks/useGameRecords";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showCopied, setShowCopied] = useState(false);
  const [showPracticeMode, setShowPracticeMode] = useState(false);
  const [justCompletedGame, setJustCompletedGame] = useState(false);
  
  const { 
    todayResult, 
    personalBest, 
    favoriteNumber,
    currentStreak,
    isLoading, 
    hasPlayedToday, 
    saveGameResult 
  } = useGameRecords(user?.id || null);

  const copyResultToClipboard = () => {
    if (!todayResult) return;

    const today = format(new Date(), "dd.MM.yyyy");
    const diceEmojis = "🎲".repeat(todayResult.throws_count);
    const bestScore = personalBest && personalBest < todayResult.throws_count ? personalBest : todayResult.throws_count;
    
    const shareText = `Kymppijape daily ${today}
Throws today: ${todayResult.throws_count}
${diceEmojis}
Personal best: ${bestScore}`;

    navigator.clipboard.writeText(shareText).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }).catch(() => {
      toast.error("Failed to copy");
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleGameComplete = (throws: number, winningNumber: number) => {
    setJustCompletedGame(true);
    saveGameResult(throws, winningNumber);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-4xl">🎲</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto px-4 py-6 md:py-10">
        <header className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
            🎲 Kymppijape Daily
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
          {user && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          )}
        </header>

        {!user ? (
          <PracticeMode />
        ) : showPracticeMode ? (
          <div className="space-y-6">
            <div className="text-center">
              <Button 
                variant="link" 
                onClick={() => setShowPracticeMode(false)}
                className="text-muted-foreground"
              >
                ← Back to Daily Game
              </Button>
            </div>
            <PracticeMode isLoggedIn />
          </div>
        ) : (
          <div className="space-y-6">
            {hasPlayedToday && !justCompletedGame ? (
              <>
                <Card className="max-w-md mx-auto">
                  <CardContent className="p-6 text-center">
                    <div className="text-6xl mb-4">🎲</div>
                    <h2 className="text-xl font-semibold mb-2">Come back tomorrow!</h2>
                    <p className="text-muted-foreground mb-4">
                      You've already played today's Kymppijape. New game unlocks at midnight!
                    </p>
                    <Button 
                      onClick={copyResultToClipboard}
                      size="lg"
                      className="min-w-[220px]"
                      variant={showCopied ? "secondary" : "default"}
                    >
                      {showCopied ? "✓ Copied to clipboard!" : "📋 Share Result with Friends"}
                    </Button>
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowPracticeMode(true)}
                      >
                        🎯 Play Practice Mode
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <ResultsPanel
                  todayResult={todayResult}
                  personalBest={personalBest}
                  favoriteNumber={favoriteNumber}
                  currentStreak={currentStreak}
                  isLoading={isLoading}
                />
              </>
            ) : (
              <>
                <GameBoard 
                  onGameComplete={handleGameComplete}
                  hasPlayedToday={hasPlayedToday}
                  personalBest={personalBest}
                />
                
                <ResultsPanel
                  todayResult={todayResult}
                  personalBest={personalBest}
                  favoriteNumber={favoriteNumber}
                  currentStreak={currentStreak}
                  isLoading={isLoading}
                />

                <footer className="text-center text-sm text-muted-foreground">
                  <p>Lock all 10 dice on the same number to win!</p>
                  <p className="mt-1">New game available every day at midnight.</p>
                </footer>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

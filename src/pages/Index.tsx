import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GameBoard } from "@/components/GameBoard";
import { ResultsPanel } from "@/components/ResultsPanel";
import { AuthForm } from "@/components/AuthForm";
import { useGameRecords } from "@/hooks/useGameRecords";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const { 
    todayResult, 
    personalBest, 
    favoriteNumber,
    isLoading, 
    hasPlayedToday, 
    saveGameResult 
  } = useGameRecords(user?.id || null);

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
          <AuthForm onSuccess={() => {}} />
        ) : (
          <div className="space-y-6">
            <GameBoard 
              onGameComplete={handleGameComplete}
              hasPlayedToday={hasPlayedToday}
            />
            
            <ResultsPanel
              todayResult={todayResult}
              personalBest={personalBest}
              favoriteNumber={favoriteNumber}
              isLoading={isLoading}
            />

            <footer className="text-center text-sm text-muted-foreground">
              <p>Lock all 10 dice on the same number to win!</p>
              <p className="mt-1">New game available every day at midnight.</p>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

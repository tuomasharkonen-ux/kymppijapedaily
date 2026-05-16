import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dice } from "@/components/Dice";
import { HelldiversVictory } from "@/components/victory/HelldiversVictory";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const ANIMATION_NAMES: Record<number, string> = {
  1: "Napalm",
  2: "Bastion Tank",
  3: "Autocannon Sentry",
  4: "Hellbomb",
  5: "Eagle 500kg",
  6: "Orbital Laser",
};

export default function AdminTest() {
  const [user, setUser] = useState<User | null>(null);
  const [isTestUser, setIsTestUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [victoryNumber, setVictoryNumber] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("is_test_user")
          .eq("user_id", session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            setIsTestUser(data?.is_test_user ?? false);
            setLoading(false);
          });
      } else {
        setIsTestUser(false);
        setLoading(false);
      }
    });
  }, []);

  const rollDice = useCallback(() => {
    if (isRolling) return;
    setIsRolling(true);
    setTimeout(() => {
      setDiceValue(Math.ceil(Math.random() * 6));
      setIsRolling(false);
    }, 800);
  }, [isRolling]);

  const triggerVictory = useCallback((n: number) => {
    setVictoryNumber(null);
    setTimeout(() => setVictoryNumber(n), 50);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (!user || !isTestUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground text-lg">Access denied.</p>
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Admin Test Page</h1>
      </div>

      {/* Dice section */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-1">Helldivers Dice</h2>
        <p className="text-sm text-muted-foreground mb-4">
          All 6 faces (static), plus a rollable preview.
        </p>

        {/* Static face grid */}
        <div className="grid grid-cols-6 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground font-mono">{n}</span>
              <Dice
                value={n}
                isLocked={false}
                isRolling={false}
                onClick={() => {}}
                disabled
                skin="helldivers_dice"
              />
              <span className="text-[10px] text-muted-foreground text-center leading-tight">
                {ANIMATION_NAMES[n]}
              </span>
            </div>
          ))}
        </div>

        {/* Rollable dice */}
        <div className="flex items-center gap-6">
          <Dice
            value={diceValue}
            isLocked={false}
            isRolling={isRolling}
            onClick={rollDice}
            skin="helldivers_dice"
          />
          <div className="flex flex-col gap-1">
            <Button onClick={rollDice} disabled={isRolling} size="sm" variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${isRolling ? "animate-spin" : ""}`} />
              Roll
            </Button>
            {!isRolling && (
              <span className="text-sm text-muted-foreground">
                Result: <span className="font-semibold text-foreground">{diceValue}</span> — {ANIMATION_NAMES[diceValue]}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Victory animations section */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Victory Animations</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Trigger each full-screen animation. Click outside or wait for it to finish.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Button
              key={n}
              variant="outline"
              onClick={() => triggerVictory(n)}
              className="flex flex-col h-auto py-3"
            >
              <span className="text-xl mb-1">
                {n === 1 ? "🔥" : n === 2 ? "🛡️" : n === 3 ? "💥" : n === 4 ? "💣" : n === 5 ? "✈️" : "⚡"}
              </span>
              <span className="text-xs font-semibold">{n}. {ANIMATION_NAMES[n]}</span>
            </Button>
          ))}
        </div>
      </section>

      {victoryNumber !== null && (
        <HelldiversVictory
          winningNumber={victoryNumber}
          onComplete={() => setVictoryNumber(null)}
        />
      )}
    </div>
  );
}

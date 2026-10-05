import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Trophy } from "lucide-react";
import type { User } from "@supabase/supabase-js";
type SortOption = "best" | "average" | "games" | "streak";

const sortLabels: Record<SortOption, string> = {
  best: "Best Result",
  average: "Average",
  games: "Games Played",
  streak: "Current Streak",
};

const Leaderboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("best");
  const {
    leaderboard: rawLeaderboard,
    isLoading,
    error
  } = useLeaderboard("best");

  const leaderboard = [...rawLeaderboard].sort((a, b) => {
    switch (sortBy) {
      case "best": return a.best_throws - b.best_throws;
      case "average": return a.avg_throws - b.avg_throws;
      case "games": return b.games_played - a.games_played;
      case "streak": return b.current_streak - a.current_streak;
      default: return 0;
    }
  }).map((entry, i) => ({ ...entry, rank: i + 1 }));
  // Players with a mökki get a "visit" link
  const [mokkiOwners, setMokkiOwners] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!user) return;
    supabase.rpc("get_mokki_owners").then(({ data, error }) => {
      if (!error && data) setMokkiOwners(new Set(data.map((r) => r.user_id)));
    });
  }, [user]);
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
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
  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <span className="flex items-center gap-1"><Trophy className="h-4 w-4 text-primary" aria-hidden="true" /> 1</span>;
    if (rank === 2) return <span className="flex items-center gap-1"><Trophy className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> 2</span>;
    if (rank === 3) return <span className="flex items-center gap-1"><Trophy className="h-4 w-4 text-primary/70" aria-hidden="true" /> 3</span>;
    return rank;
  };
  return <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6 md:py-10">
        <header className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Game
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <span aria-hidden="true">🏆</span> Leaderboard
          </h1>
        </header>

        <main>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Top Players</CardTitle>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(sortLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? <div className="flex justify-center py-8">
                  <div className="animate-pulse text-2xl" aria-hidden="true">🎲</div>
                  <span className="sr-only">Loading leaderboard...</span>
                </div> : error ? <div className="text-center py-8 text-muted-foreground">
                  <p>Failed to load leaderboard</p>
                  <p className="text-sm">{error}</p>
                </div> : leaderboard.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                  <p>No players on the leaderboard yet</p>
                  <p className="text-sm">Be the first to play!</p>
                </div> : <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead className="text-right">Best</TableHead>
                        <TableHead className="text-right">Avg</TableHead>
                        <TableHead className="text-right">Games</TableHead>
                        <TableHead className="text-right">🔥 Streak</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.map(entry => <TableRow key={entry.user_id} className={user?.id === entry.user_id ? "bg-primary/10" : ""}>
                          <TableCell className="font-medium">
                            {getRankDisplay(entry.rank)}
                          </TableCell>
                          <TableCell>
                            {entry.username}
                            {user?.id === entry.user_id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                            {mokkiOwners.has(entry.user_id) && (
                              <Link
                                to={user?.id === entry.user_id ? "/mokki" : `/mokki/${entry.user_id}`}
                                className="ml-2 text-sm hover:opacity-70"
                                aria-label={`Visit ${entry.username}'s mökki`}
                                title="Visit mökki"
                              >
                                🏡
                              </Link>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{entry.best_throws}</TableCell>
                          <TableCell className="text-right">{entry.avg_throws}</TableCell>
                          <TableCell className="text-right">{entry.games_played}</TableCell>
                          <TableCell className="text-right">
                            {entry.current_streak > 0 ? `${entry.current_streak} 🔥` : "-"}
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>;
};
export default Leaderboard;